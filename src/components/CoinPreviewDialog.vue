<template>
    <el-dialog
      v-model="dialogVisible"
      title="2026新加坡Major 3D纪念硬币预览"
      :width="dialogWidth"
      :fullscreen="!isMobile"
      draggable
      destroy-on-close
      @closed="handleDialogClosed"
      :close-on-click-modal="false"
    >
      <div class="coin-preview-container">
        <MatchCoinBase
          ref="coinViewer"
          :debug="false"
          :initial-coin-type="currentCoinType"
          :container-height="viewerHeight"
          @update:coin-type="handleCoinTypeChange"
          @loading="handleLoadingStatus"
          @model-loaded="handleModelLoaded"
          @progress="handleProgress"
        />
        <div v-if="isLoading || progress < 100" class="loading-overlay">
            <el-progress
                type="circle"
                :percentage="progress"
                :width="isMobile ? 90 : 100"
                :stroke-width="10"
                color="#409eff"
            />
            <div class="loading-text">{{ loadingStatusText }}</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useIsMobile } from '@/composables/useIsMobile';
  import MatchCoinBase from '../views/MainLayout/components/match-prediction/MatchCoinBase.vue'
  import { ElProgress } from 'element-plus'
  
  const props = defineProps<{
    modelValue: boolean
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()
  
  // 对话框可见性
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })
  
  // 当前币种类型
  const currentCoinType = ref<'bronze' | 'silver' | 'gold' | 'diamond'>('gold')
  
  // 响应式布局
  const isMobile = useIsMobile();
  const dialogWidth = computed(() => isMobile.value ? '100%' : '80%')
  const viewerHeight = computed(() => isMobile.value ? '80vh' : '70vh')
  
  // 加载状态和进度
  const isLoading = ref(true)
  const progress = ref(0)
  const loadingStatusText = ref('初始化...')
  
  // 处理币种类型变化
  const handleCoinTypeChange = (type: typeof currentCoinType.value) => {
    currentCoinType.value = type
  }
  
  // 处理加载状态文本更新
  const handleLoadingStatus = (status: string) => {
    loadingStatusText.value = status
    console.log('加载状态:', status)
  }
  
  // 处理加载进度更新
  const handleProgress = (percent: number) => {
    progress.value = Math.floor(percent)
    if (progress.value >= 100) {
      loadingStatusText.value = '加载完成...'
    }
  }
  
  // 处理模型加载完成
  const handleModelLoaded = () => {
    console.log('收到模型加载完成事件')
    // 增加一个小的延时，确保渲染完成
    setTimeout(() => {
        isLoading.value = false // 最终加载完成
        progress.value = 100 // 确保进度条满
        loadingStatusText.value = '加载完成' // 最终状态文本
        console.log('加载叠加层应已隐藏')
    }, 300); // 增加延时到 300ms
  }
  
  // 处理对话框关闭
  const handleDialogClosed = () => {
    isLoading.value = true
    progress.value = 0
    loadingStatusText.value = '初始化...'
    currentCoinType.value = 'gold'
  }
  
  // 监听对话框显示状态
  watch(dialogVisible, (newVal) => {
    console.log('对话框状态变化:', newVal)
    if (newVal) {
      isLoading.value = true
      progress.value = 0
      loadingStatusText.value = '初始化...'
    }
  })
  </script>
  
  <style scoped>
  .coin-preview-container {
    width: 100%;
    position: relative;
    background-color: var(--el-fill-color-light, #f0f0f0);
    border-radius: 8px;
    overflow: hidden;
    height: 85vh;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    color: white;
    font-size: 16px;
  }
  
  .loading-text {
      margin-top: 20px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 0px 0;
  }
  
  /* 移动端适配 */
  @media screen and (max-width: 768px) {
    :deep(.el-dialog) {
      margin: 0 !important;
      height: 100%;
    }
  
    :deep(.el-dialog__body) {
      padding: 0px;
      margin: 0;
    }
  
    .coin-preview-container { 
      height: 74vh;
    }
  }
  </style>