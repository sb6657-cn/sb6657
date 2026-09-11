<template>
    <div class="cs2-major-root">
        <div class="major-container">
            <div v-if="isLoading" class="loading-container">
                <el-skeleton :rows="3" animated />
            </div>

            <template v-else-if="hasAvailablePhases">
                <!-- 右侧预测内容 -->
                <div class="prediction-content">
                    <div class="tab-buttons">
                        <button v-if="matchPhases.onePhase" :class="{ active: currentTab === 'onePhase' }" @click="currentTab = 'onePhase'">
                            第一阶段
                            <div class="countdown" v-if="currentTab === 'onePhase'">
                                {{ getCountdown('onePhase') }}
                            </div>
                        </button>
                        <button v-if="matchPhases.twoPhase" :class="{ active: currentTab === 'twoPhase' }" @click="currentTab = 'twoPhase'">
                            第二阶段
                            <div class="countdown" v-if="currentTab === 'twoPhase'">
                                {{ getCountdown('twoPhase') }}
                            </div>
                        </button>
                        <button v-if="matchPhases.threePhase" :class="{ active: currentTab === 'threePhase' }" @click="currentTab = 'threePhase'">
                            第三阶段
                            <div class="countdown" v-if="currentTab === 'threePhase'">
                                {{ getCountdown('threePhase') }}
                            </div>
                        </button>
                        <button v-if="matchPhases.champion" :class="{ active: currentTab === 'champion' }" @click="currentTab = 'champion'">
                            冠军组
                            <div class="countdown" v-if="currentTab === 'champion'">
                                {{ getCountdown('champion') }}
                            </div>
                        </button>
                    </div>
                    <div class="major-content">

                        <!-- 左侧赛事信息 -->
                        <div class="match-info-panel">
                            <div class="match-header">
                                <img :src="matchInfo?.matchesImg" :alt="matchInfo?.matchesName" class="match-logo">
                                <h2 class="match-name">{{ matchInfo?.matchesName }}</h2>
                            </div>
                            <div class="match-details">
                                <div class="info-item">
                                    <span class="label">赛事等级：</span>
                                    <span class="value">{{ matchInfo?.level }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">比赛地点：</span>
                                    <span class="value">{{ matchInfo?.matchesLocation }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">比赛时间：</span>
                                    <span class="value">{{ formatDateTime(matchInfo?.startTime) }} - {{
                                        formatDateTime(matchInfo?.endTime) }}</span>
                                </div>
                            </div>
                            <div class="match-footer">
                                <!-- <div class="reward-info">竞猜会获得平台虚拟奖章，所获奖章在比赛结束后统计</div> -->
                                <div class="button-group">
                                    <el-button type="primary" @click="captureAndShare" :loading="isCapturing">
                                        <el-icon><Share /></el-icon>
                                        截图分享预测
                                    </el-button>
                                </div>
                                <div class="button-group">
                                    <el-button type="success"  @click="showCoinViewerfun">
                                        <el-icon><View /></el-icon>
                                        预览2025布达佩斯Major3D硬币
                                    </el-button>
                                </div>

                            </div>
                        </div>

                        <div v-if="currentTab === 'onePhase'" class="major-section">
                            <div class="time-info">
                                <p>竞猜时间：{{ formatTimeRange('onePhase') }}</p>
                            </div>
                            <MajorPhase ref="onePhaseRef" :isTimeValid="isTimeValid('onePhase')" :matchId="matchId"
                                phase="onePhase" />
                        </div>

                        <div v-if="currentTab === 'twoPhase'" class="major-section">
                            <div class="time-info">
                                <p>竞猜时间：{{ formatTimeRange('twoPhase') }}</p>
                            </div>
                            <MajorPhase ref="twoPhaseRef" :isTimeValid="isTimeValid('twoPhase')" :matchId="matchId"
                                phase="twoPhase" />
                        </div>

                        <div v-if="currentTab === 'threePhase'" class="major-section">
                            <div class="time-info">
                                <p>竞猜时间：{{ formatTimeRange('threePhase') }}</p>
                            </div>
                            <MajorPhase ref="threePhaseRef" :isTimeValid="isTimeValid('threePhase')" :matchId="matchId"
                                phase="threePhase" />
                        </div>

                        <div v-if="currentTab === 'champion'" class="major-section">
                            <div class="time-info">
                                <p>竞猜时间：{{ formatTimeRange('champion') }}</p>
                            </div>
                            <MajorChampion ref="championRef" :isTimeValid="isTimeValid('champion')" :matchId="matchId" />
                        </div>
                    </div>
                </div>
            </template>
            <div v-else class="no-match">
                <el-empty description="Major赛事暂未公布" />
            </div>
        </div>

        <!-- 添加币种预览对话框 -->
        <CoinPreviewDialog
            v-model="showCoinViewer"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import MajorPhase from './MajorPhase.vue'
import MajorChampion from './MajorChampion.vue'
import { useRoute } from 'vue-router'
import httpInstance from '@/apis/httpInstance'
import { ElMessage } from 'element-plus'
import { Share, View } from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'
import CoinPreviewDialog from '@/components/CoinPreviewDialog.vue'
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()
const route = useRoute()
const matchId = ref<number>(0)
const isLoading = ref(true)
const currentTab = ref('onePhase')
const onePhaseRef = ref()
const twoPhaseRef = ref()
const threePhaseRef = ref()
const championRef = ref()
const countdownTimer = ref<number | null>(null)
const matchInfo = ref<any>(null)
const isCapturing = ref(false)

interface MatchPhase {
    id: number
    phase: string
    predictStartTime: string
    predictEndTime: string
}

const matchPhases = ref<Record<string, MatchPhase>>({})

// 定义各阶段的时间限制
const timeLimits = ref({
    onePhase: {
        start: new Date(),
        end: new Date()
    },
    twoPhase: {
        start: new Date(),
        end: new Date()
    },
    threePhase: {
        start: new Date(),
        end: new Date()
    },
    champion: {
        start: new Date(),
        end: new Date()
    }
})

// 添加计算属性判断是否有可用阶段
const hasAvailablePhases = computed(() => {
    return Object.keys(matchPhases.value).length > 0
})

// 格式化日期时间显示
const formatDateTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
        // 创建Date对象，自动处理时区
        const date = new Date(dateStr)
        // 使用toLocaleDateString进行格式化，确保使用正确的时区
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Shanghai'
        })
        // 将YYYY/MM/DD格式转换为YYYY年MM月DD日格式
        return formattedDate.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1年$2月$3日')
    } catch (error) {
        console.error('日期格式化错误:', error)
        return dateStr
    }
}

// 格式化时间范围显示（用于预测时间显示）
const formatTimeRange = (phase: keyof typeof timeLimits.value) => {
    const { start, end } = timeLimits.value[phase]
    return `${formatDateTime(start.toISOString())} ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${formatDateTime(end.toISOString())} ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

// 获取赛事信息
const fetchMatchId = async () => {
    try {
        isLoading.value = true
        const response = await httpInstance.get<MatchPhase[]>('/machine/matches')
        if (response.data && response.data.length > 0) {
            // 直接使用接口返回的数据，不做过滤
            const allPhases = response.data

            if (allPhases.length > 0) {
                // 将每个阶段的数据存储到matchPhases中
                allPhases.forEach((phase) => {
                    matchPhases.value[phase.phase] = phase
                })

                // 设置当前阶段的matchId和matchInfo
                // 如果当前选中的阶段不可用，则选择第一个可用的阶段
                if (!matchPhases.value[currentTab.value]) {
                    currentTab.value = Object.keys(matchPhases.value)[0]
                }
                updateCurrentPhaseInfo(currentTab.value)

                // 根据每个阶段的数据设置时间限制
                allPhases.forEach((phase) => {
                    const phaseKey = phase.phase as keyof typeof timeLimits.value
                    if (phaseKey in timeLimits.value) {
                        timeLimits.value[phaseKey] = {
                            start: new Date(phase.predictStartTime),
                            end: new Date(phase.predictEndTime)
                        }
                    }
                })

                console.log('比赛信息:', allPhases)
                console.log('时间限制设置:', timeLimits.value)
            } else {
                ElMessage.error('未找到可用赛事')
            }
        } else {
            ElMessage.error('未找到可用赛事')
        }
    } catch (error) {
        console.error('获取赛事ID失败:', error)
        ElMessage.error('获取赛事ID失败')
    } finally {
        isLoading.value = false
    }
}

// 添加更新当前阶段信息的函数
const updateCurrentPhaseInfo = (phase: string) => {
    const phaseInfo = matchPhases.value[phase]
    if (phaseInfo) {
        matchId.value = phaseInfo.id || 0
        matchInfo.value = phaseInfo
    } else {
        matchId.value = 0
        matchInfo.value = null
    }
}

// 检查当前时间是否在有效范围内
const isTimeValid = (phase: keyof typeof timeLimits.value) => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    const { start, end } = timeLimits.value[phase]
    return now >= start && now <= end
}

// 获取倒计时显示
const getCountdown = (phase: keyof typeof timeLimits.value) => {
    const now = new Date()
    const { start, end } = timeLimits.value[phase]

    if (now < start) {
        const diff = start.getTime() - now.getTime()
        return `距离开始还有 ${formatCountdown(diff)}`
    } else if (now > end) {
        return '竞猜已结束'
    } else {
        const diff = end.getTime() - now.getTime()
        return `距离结束还有 ${formatCountdown(diff)}`
    }
}

// 格式化倒计时显示
const formatCountdown = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    return `${days}天${hours}小时${minutes}分${seconds}秒`
}

// 更新倒计时
const updateCountdown = () => {
    currentTab.value = currentTab.value // 触发重新渲染
}

// 监听标签页变化
watch(currentTab, (newTab) => {
    // 更新当前阶段的赛事ID和信息
    updateCurrentPhaseInfo(newTab)

    // 切换标签页时重新获取数据
    if (matchId.value) {
        switch (newTab) {
            case 'onePhase':
                onePhaseRef.value?.fetchTeams()
                break
            case 'twoPhase':
                twoPhaseRef.value?.fetchTeams()
                break
            case 'threePhase':
                threePhaseRef.value?.fetchTeams()
                break
            case 'champion':
                championRef.value?.fetchTeams()
                break
        }
    }
})

onMounted(async () => {
    await fetchMatchId()
    countdownTimer.value = window.setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
    if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
    }
})

// 暴露数据给父组件
defineExpose({
    getPredictData() {
        return {
            onePhase: onePhaseRef.value?.getPredictData(),
            twoPhase: twoPhaseRef.value?.getPredictData(),
            threePhase: threePhaseRef.value?.getPredictData(),
            champion: championRef.value?.getPredictData()
        }
    }
})

// 添加水印函数
const addWatermark = (canvas: HTMLCanvasElement) => {
    // 创建新的画布，高度增加以容纳水印
    const newCanvas = document.createElement('canvas')
    newCanvas.width = canvas.width
    newCanvas.height = canvas.height + 60  // 增加60px高度用于水印
    const ctx = newCanvas.getContext('2d')
    if (!ctx) return canvas

    // 先绘制原图
    ctx.drawImage(canvas, 0, 0)

    // 设置水印样式
    ctx.font = 'bold 36px Microsoft YaHei'
    ctx.textAlign = 'center'  // 居中对齐
    ctx.textBaseline = 'bottom'

    // 在底部添加水印
    const text = '竞猜作业来源：sb6657.cn'
    const x = newCanvas.width / 2  // 水平居中
    const y = newCanvas.height - 20  // 距离底部20px

    // 先画一个半透明背景
    const textWidth = ctx.measureText(text).width
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(x - textWidth / 2 - 10, y - 40, textWidth + 20, 40)

    // 再画文字
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, x, y)

    return newCanvas
}

// 截图并分享
const captureAndShare = async () => {
    //剪切板复制竞猜地址
    const shareUrl = '玩机器烂梗库官方比赛作业，地址sb6657.cn'
    try {
        await navigator.clipboard.writeText(shareUrl)
    } catch (err) {
        console.error('复制失败:', err)
    }

    try {
        isCapturing.value = true
        const element = document.querySelector('.major-section') as HTMLElement
        if (!element) {
            throw new Error('未找到要截图的元素')
        }

        // 创建截图
        const canvas = await html2canvas(element, {
            backgroundColor: theme.isDark ? '#12141a' : '#ffffff',
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: true
        })

        // 添加水印
        const watermarkedCanvas = addWatermark(canvas)

        // 转换为图片并下载
        const link = document.createElement('a')
        link.download = `sb6657.cn_CS2Major预测_${new Date().toLocaleDateString()}.jpg`
        link.href = watermarkedCanvas.toDataURL('image/jpeg', 1.0)
        link.click()

        ElMessage.success('截图已保存')
        httpInstance.get("/machine/shareMatch")
    } catch (error) {
        console.error('截图失败:', error)
        ElMessage.error('截图失败，请重试')
    } finally {
        isCapturing.value = false
    }
}

// 币种预览控制
const showCoinViewer = ref(false)
function showCoinViewerfun() {
    showCoinViewer.value=true
    httpInstance.get("/machine/matchCoin")
}
</script>

<style lang="scss" scoped>
.cs2-major-root {
    position: relative;
    width: 100%;
    height: 100%;
}

.major-container {
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
    }

    >* {
        position: relative;
        z-index: 2;
    }
}

.major-content {
    justify-content: center;
    display: flex;
    gap: 24px;
    padding: 20px;
}

.match-info-panel {
    width: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px;
    backdrop-filter: blur(4px);
    flex-shrink: 0;

    .match-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;

        .match-logo {
            width: 120px;
            height: 120px;
            object-fit: contain;
            border-radius: 8px;
        }

        .match-name {
            color: white;
            font-size: 20px;
            text-align: center;
            margin: 0;
        }
    }

    .match-details {
        .info-item {
            margin-bottom: 16px;
            color: white;

            &:last-child {
                margin-bottom: 0;
            }

            .label {
                color: #3fa7ff;
                margin-right: 8px;
            }

            .value {
                color: #fff;
            }
        }
    }
}

.prediction-content {
    flex: 1;
    min-width: 0; // 防止内容溢出
}

.tab-buttons {
    color: white;
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;

    button {
        padding: 8px 24px;
        font-size: 16px;
        border: 2px solid #3fa7ff;
        background: transparent;
        color: #3fa7ff;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(4px);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        &:hover {
            // background: rgba(63, 167, 255, 0.2);
        }

        &.active {
            // background: #3fa7ff;
            color: white;
        }
    }
}

.major-section {
    background: rgba(255, 255, 255, 0);
    border-radius: 12px;
    padding: 20px;
}

.countdown {
    font-size: 12px;
    color: #ffd700;
    margin-top: 4px;
}

.time-info {
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    color: #fff;
    text-align: center;

    p {
        margin: 0;
        font-size: 14px;
    }
}

@media screen and (max-width: 1200px) {
    .major-content {
        flex-direction: column;
    }

    .match-info-panel {
        width: 100%;
        margin-bottom: -10px;
    }
}

@media screen and (max-width: 768px) {
    .major-content {
        padding: 12px;
    }

    .match-info-panel {
        padding: 16px;

        .match-header {
            .match-logo {
                width: 80px;
                height: 80px;
            }

            .match-name {
                font-size: 18px;
            }
        }

        .match-details {
            .info-item {
                margin-bottom: 12px;
                font-size: 14px;
            }
        }
    }

    .tab-buttons {
        gap: 12px;
        margin-bottom: 16px;

        button {
            padding: 6px 16px;
            font-size: 14px;
        }
    }

    .major-section {
        padding: 16px;
    }
}

.loading-container {
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
}

.no-match {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin: 20px;
}

.match-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .reward-info {
        color: #3fa7ff;
        margin-bottom: 16px;
        text-align: center;
    }

    .button-group {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
        @media screen and (max-width: 768px) {
            flex-direction: column;
            width: 100%;

            .el-button {
                width: 100%;
            }
        }
    }
}
</style>
