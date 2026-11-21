<template>
    <div class="model-container" ref="container">
      <!-- 添加按钮组 -->
      <div class="coin-buttons">
        <button @click="changeCoinType('bronze')" :class="{ active: currentCoinType === 'bronze' }">铜币</button>
        <button @click="changeCoinType('silver')" :class="{ active: currentCoinType === 'silver' }">银币</button>
        <button @click="changeCoinType('gold')" :class="{ active: currentCoinType === 'gold' }">金币</button>
        <button @click="changeCoinType('diamond')" :class="{ active: currentCoinType === 'diamond' }">钻石币</button>
      </div>
      <!-- 添加调试信息显示 -->
      <div class="debug-info" v-if="debugInfo">
        <p>容器尺寸: {{ containerSize }}</p>
        <p>加载状态: {{ loadingStatus }}</p>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
  import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

  // Props
  const props = defineProps<{
      debug?: boolean
      initialCoinType?: CoinType
  }>()

  // Initialize debugInfo based on prop, default to true if prop is not provided
  const debugInfo = ref(props.debug !== undefined ? props.debug : true)
  console.log('MatchCoinBase - debugInfo:', debugInfo.value)

  const containerSize = ref('')
  const loadingStatus = ref('初始化中...')

  const container = ref<HTMLElement | null>(null)
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let coinMetalMaterial: THREE.MeshPhysicalMaterial | null = null
  const modelUrl = `${import.meta.env.BASE_URL}major/singapore-2026/coin.glb`

  // 添加币种类型定义
  type CoinType = 'bronze' | 'silver' | 'gold' | 'diamond'

  interface CoinStyle {
    color: string
    metalness: number
    roughness: number
    clearcoat: number
    clearcoatRoughness: number
  }

  // Define emits at the top level
  const emit = defineEmits<{
      (e: 'update:coinType', type: CoinType): void
      (e: 'loading', status: string): void
      (e: 'model-loaded'): void
      (e: 'progress', percent: number): void
  }>()

  // 币种多阶质感配置（铜、银、金、钻）
  const coinStyles: Record<CoinType, CoinStyle> = {
    bronze: {
      color: '#B87333',
      metalness: 0.82,
      roughness: 0.35,
      clearcoat: 0.20,
      clearcoatRoughness: 0.10
    },
    silver: {
      color: '#DCE2E6',
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.60,
      clearcoatRoughness: 0.04
    },
    gold: {
      color: '#FFD700',
      metalness: 0.90,
      roughness: 0.25,
      clearcoat: 0.40,
      clearcoatRoughness: 0.06
    },
    diamond: {
      color: '#B6E2FD',
      metalness: 0.96,
      roughness: 0.12,
      clearcoat: 0.95,
      clearcoatRoughness: 0.02
    }
  }

  const currentCoinType = ref<CoinType>(props.initialCoinType || 'gold') // 默认显示金币或传入币种

  // 添加改变币种的方法
  const changeCoinType = (type: CoinType) => {
    currentCoinType.value = type
    updateCoinMaterial()
    emit('update:coinType', type)
  }

  // 添加更新材质的方法
  const updateCoinMaterial = () => {
    if (!coinMetalMaterial) return
    const style = coinStyles[currentCoinType.value]
    coinMetalMaterial.color.set(style.color)
    coinMetalMaterial.metalness = style.metalness
    coinMetalMaterial.roughness = style.roughness
    coinMetalMaterial.clearcoat = style.clearcoat
    coinMetalMaterial.clearcoatRoughness = style.clearcoatRoughness
    coinMetalMaterial.needsUpdate = true
  }

  // 更新容器尺寸信息
  const updateContainerSize = () => {
    if (container.value) {
      const rect = container.value.getBoundingClientRect()
      containerSize.value = `宽度: ${rect.width}px, 高度: ${rect.height}px`
    }
  }

  // 初始化场景
  const initScene = () => {
    try {
      loadingStatus.value = '创建场景...'
      // 创建场景
      scene = new THREE.Scene()
      // 暂时移除固定背景色，将背景设置为环境贴图
      // scene.background = new THREE.Color(0x404040) // 改为深灰色背景以便于观察
      console.log('场景创建成功')

      loadingStatus.value = '创建相机...'
      // 创建相机
      camera = new THREE.PerspectiveCamera(
        75,
        container.value ? container.value.clientWidth / container.value.clientHeight : 1,
        0.1,
        1000
      )
      camera.position.set(0, 0, 5)
      console.log('相机创建成功')

      loadingStatus.value = '创建渲染器...'
      // 创建渲染器
      renderer = new THREE.WebGLRenderer({ antialias: true })
      if (!container.value) {
        throw new Error('容器元素不存在')
      }

      // 使用容器的实际尺寸
      const width = container.value.clientWidth
      const height = container.value.clientHeight
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      container.value.appendChild(renderer.domElement)
      console.log('渲染器创建成功，尺寸:', width, height)
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1; // 可以根据需要调整曝光

      // 创建控制器
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      console.log('控制器创建成功')

      // 移除之前的环境光和平行光，改用环境贴图提供环境照明
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
      scene.add(ambientLight)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 5, 5)
      scene.add(directionalLight)
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight2.position.set(-5, 5, -5).normalize();
      scene.add(directionalLight2);
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(0, 2, 0);
      scene.add(pointLight);
      console.log('灯光移除，将使用环境贴图提供照明')

      // 初始化 PMREMGenerator
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      // 加载 HDR 环境贴图
      loadingStatus.value = '加载环境贴图...'
      const hdrLoader = new RGBELoader();
      hdrLoader.load(
          //HDR 下载：https://polyhaven.com/zh
          'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/the_sky_is_on_fire_1k.hdr',
          (texture: THREE.Texture) => {
              const envMap = pmremGenerator.fromEquirectangular(texture).texture;
              pmremGenerator.dispose();
              texture.dispose();

              scene.environment = envMap;
              scene.background = envMap;
              console.log('环境贴图加载并应用成功');
              loadingStatus.value = '环境贴图加载成功';
          },
          undefined,
          (error: unknown) => {
              console.error('加载环境贴图错误:', error);
              loadingStatus.value = '环境贴图加载失败: ' + (error instanceof Error ? error.message : String(error));
          }
      );

      // 加载模型
      loadingStatus.value = '开始加载模型...'
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      console.log('开始加载模型...')

      loader.load(
        modelUrl,
        (gltf) => {
          console.log('模型加载成功')
          loadingStatus.value = '模型加载成功'
          emit('loading', loadingStatus.value) // Emit success status
          scene.add(gltf.scene)

          const initStyle = coinStyles[currentCoinType.value];
          coinMetalMaterial = new THREE.MeshPhysicalMaterial({
              metalness: initStyle.metalness,
              roughness: initStyle.roughness,
              clearcoat: initStyle.clearcoat,
              clearcoatRoughness: initStyle.clearcoatRoughness,
              envMapIntensity: 1.25,
              color: initStyle.color,
          });
          if (scene.environment) {
              coinMetalMaterial.envMap = scene.environment;
          }

          scene.traverse((object: any) => {
              if (!object.isMesh) return;
              const materialName = object.material?.name ?? '';
              if (materialName.startsWith('Metal')) {
                  object.material = coinMetalMaterial;
                  return;
              }
              if (object.material?.isMeshStandardMaterial || object.material?.isMeshPhysicalMaterial) {
                  if (scene.environment) {
                      object.material.envMap = scene.environment;
                      object.material.needsUpdate = true;
                  }
              }
          });

          // 自动调整相机位置以适应模型
          const box = new THREE.Box3().setFromObject(gltf.scene)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          const maxDim = Math.max(size.x, size.y, size.z)
          const fov = camera.fov * (Math.PI / 180)
          // 计算相机到模型的距离，减小乘数使其更近
          const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;

          // glTF 导出后正面朝向 +Z，初始镜头从正面观看
          camera.position.set(center.x, center.y, center.z + cameraDistance);
          camera.lookAt(center);

          controls.target.copy(center);
          controls.update();
          console.log('相机位置调整完成')

          // 确保在所有设置完成后发送加载完成事件
          setTimeout(() => {
              console.log('发送模型加载完成事件')
              emit('model-loaded')
          }, 100)
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100)
          console.log('加载进度:', percent.toFixed(2) + '%')
          loadingStatus.value = `模型加载进度: ${percent.toFixed(0)}%`
          emit('loading', loadingStatus.value) // Emit status during progress
          emit('progress', percent) // Emit numerical progress
        },
        (error: unknown) => {
          console.error('模型加载错误:', error)
          loadingStatus.value = '模型加载失败: ' + (error instanceof Error ? error.message : String(error))
          emit('loading', loadingStatus.value) // Emit error status
        }
      )

      // 更新容器尺寸信息
      updateContainerSize()
    } catch (error) {
      console.error('初始化场景失败:', error)
      loadingStatus.value = '初始化失败: ' + (error as Error).message
    }
  }

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate)
    controls?.update()
    renderer?.render(scene, camera)
  }

  // 处理窗口大小变化
  const handleResize = () => {
    if (!container.value || !camera || !renderer) return

    const width = container.value.clientWidth
    const height = container.value.clientHeight

    console.log('handleResize - 容器尺寸:', width, height)

    // 使用容器的宽高比更新相机，并在访问前确保 container.value 非空
    camera.aspect = container.value ? width / height : camera.aspect // Update camera aspect ratio with check
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    updateContainerSize()
    console.log('handleResize - 相机宽高比更新为:', camera.aspect)
  }

  onMounted(() => {
    console.log('组件挂载，容器元素:', container.value)
    // 添加窗口大小监听
    window.addEventListener('resize', handleResize)

    loadingStatus.value = '初始化场景...'
    // Ensure DOM is updated before getting container size and initializing Three.js
    nextTick(() => {
        updateContainerSize()
        console.log('nextTick - 容器尺寸:', container.value?.clientWidth, container.value?.clientHeight)
        if (container.value) {
            console.log('nextTick - 相机宽高比:', container.value.clientWidth / container.value.clientHeight)
        }
        initScene()
        animate()
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    if (container.value && renderer) {
      container.value.removeChild(renderer.domElement)
    }
    renderer?.dispose()
    // 移除场景中的所有对象并清理资源
    if (scene) {
      scene.traverse((object: any) => {
        // dispose geometry, material, textures
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            for (const materialItem of object.material) materialItem.dispose();
          } else {
            (object.material as any).dispose();
          }
        }
        if (object.texture) {
          object.texture.dispose();
        }
      });
    }
  })
  </script>

  <style scoped>
  .model-container {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background-color: var(--el-fill-color-light, #f0f0f0);
  }

  .coin-buttons {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 8px;
  }

  .coin-buttons button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #333;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .coin-buttons button:hover {
    background-color: #444;
  }

  .coin-buttons button.active {
    background-color: #666;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  }

  .debug-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
  }

  .debug-info p {
    margin: 5px 0;
  }
  </style>
