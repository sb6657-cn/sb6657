<template>
    <div class="match-library">
        <div class="card">
            <span>投稿时勾选关联赛事库将加入某一赛事创作的烂梗，目前只收录大型赛事</span>
            <p>页面仅展示收录于赛事期间创作的烂梗</p>
        </div>
        <div class="match-list">
            <el-card v-for="match in matchList" :key="match.id" class="match-card" :body-style="{ padding: '0px' }"
                @click="handleMatchClick(match)">
                <div class="card-content">
                    <div class="image-container">
                        <img :src="match.matchesImg" class="match-image" />
                    </div>
                    <div class="match-info">
                        <div class="match-header">
                            <h3 class="match-name">{{ match.matchesName }}</h3>
                            <el-tag size="small" type="success" class="match-level">{{ match.level }}</el-tag>
                        </div>
                        <div class="match-details">
                            <div class="match-location">
                                <el-icon>
                                    <Location />
                                </el-icon>
                                <span>{{ match.matchesLocation }}</span>
                            </div>
                            <div class="match-time">
                                <div class="time-item">
                                    <el-icon>
                                        <Calendar />
                                    </el-icon>
                                    <span>开始：{{ match.startTime }}</span>
                                </div>
                                <div class="time-item">
                                    <el-icon>
                                        <Calendar />
                                    </el-icon>
                                    <span>结束：{{ match.endTime }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-card>
        </div>

        <div class="pagination-container">
            <el-pagination 
                v-model:current-page="currentPage" 
                :total="total" 
                layout="total,prev, pager, next"
                @current-change="handleCurrentChange" 
            />
        </div>

        <!-- 烂梗弹窗 -->
        <el-dialog v-model="dialogVisible" :title="currentMatch?.matchesName" :width="isMobile ? '100%' : '75%'" class="match-dialog"
            destroy-on-close>
            <div class="memes-view">
                <div class="card-table">
                    <el-table :data="matchBarrageList" stripe v-loading="barrageLoading" cell-class-name="hover-pointer"
                        empty-text="暂无烂梗，快来投稿吧！" @row-click="copyMeme_countPlus1">
                        <el-table-column align="center" width="60">
                            <template #default="scope">
                                <el-tag round effect="plain">{{ scope.row.id }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="barrage">
                            <template #default="scope">
                                <el-popover placement="top" :width="'auto'" trigger="hover"
                                    :visible="scope.row.popoverVisible">
                                    <template #reference>
                                        <div style="cursor: pointer;" @touchstart="handleTouchStart(scope.row)"
                                            @touchend="handleTouchEnd(scope.row)">
                                            <span class="barrage-text">{{ scope.row.barrage }}</span>
                                        </div>
                                    </template>
                                    <template #default>
                                        <div style="display: flex; align-items: center; flex-wrap: wrap;">
                                            <div v-for="(item, index) in getDisplayTags(scope.row.tags, dictData)" :key="index"
                                                style="margin-right: 8px;">
                                                <el-tag round effect="dark"
                                                    :style="{ fontSize: '16px', cursor: 'pointer' }">
                                                    <img v-if="item.iconUrl" :src="item.iconUrl"
                                                        style="width: 16px; height: 22px; object-fit: cover;vertical-align: middle;" />
                                                    <span style="vertical-align: middle;">{{ item.label }}</span>
                                                </el-tag>
                                            </div>
                                            <span
                                                style="position: absolute;bottom: 0;right: 0;font-size: 11px;min-width: 170px;">
                                                投稿时间: {{ easyFormatTime(scope.row.submitTime) }}
                                            </span>
                                        </div>
                                    </template>
                                </el-popover>
                            </template>
                        </el-table-column>
                        <el-table-column align="center" width="100">
                            <template #default="scope">
                                <el-button type="primary" class="copy-btn" @click.stop="copyMeme_countPlus1(scope.row)">
                                    复制 🌈<flip-num :num="scope.row.cnt" />
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div class="pagination-wrapper">
                        <el-pagination v-if="!barrageLoading" background layout="prev, pager, next, jumper"
                            :current-page="barrageCurrentPage" :total="barrageTotal" :pager-count="5"
                            :page-size="barragePageSize" @current-change="handleBarragePageChange" />
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Calendar } from '@element-plus/icons-vue'
import httpInstance from '@/apis/httpInstance'
import flipNum from '@/components/flip-num.vue'
import { copyToClipboard, copySuccess, limitedCopy } from '@/utils/clipboard'
import { throttle } from '@/utils/throttle'
import { copyCountPlus1, plus1Error } from '@/apis/setMeme'
import { easyFormatTime } from '@/utils/time'
import { getDisplayTags } from '@/utils/tags'
import { useMemeTagsStore } from '@/stores/memeTags';
import type { getMemeTags as MemeTag } from '@/types/meme'
const memeTagsStore = useMemeTagsStore();

interface MatchItem {
    id: number
    matchesName: string
    matchesImg: string
    matchesLocation: string
    level: string
    startTime: string
    endTime: string
    barrageNum: number | null
}

interface MatchListData {
    total: number
    list: MatchItem[]
    pageNum: number
    pageSize: number
}

interface BarrageItem {
    id: number
    barrage: string
    cnt: string
    tags: string
    submitTime: string
}

interface BarrageListData {
    total: number
    list: BarrageItem[]
    pageNum: number
    pageSize: number
}

const matchList = ref<MatchItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const dialogVisible = ref(false)
const currentMatch = ref<MatchItem | null>(null)
const matchBarrageList = ref<BarrageItem[]>([])
const barrageLoading = ref(false)
const barrageTotal = ref(0)
const barragePageSize = ref(50)
const barrageCurrentPage = ref(1)
const dictData = ref<MemeTag[]>([])

// 2s节流。节流期间触发了就调第二个回调。表示2s内多次点击复制只取其中一次发请求给后台
const copyMeme = throttle(copyToClipboard, limitedCopy, 2000)

// 判断是否为移动端
const isMobile = ref(window.innerWidth <= 768)

// 监听窗口大小变化
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
}

const getMatchList = async () => {
    try {
        const res = await httpInstance.get<MatchListData>('/machine/getMatchList', {
            params: {
                pageNum: currentPage.value,
                pageSize: pageSize.value
            }
        })

        if (res.code === 200) {
            matchList.value = res.data.list
            total.value = res.data.total
        } else {
            ElMessage.error(res.msg || '获取赛事列表失败')
        }
    } catch (error) {
        ElMessage.error('获取赛事列表失败')
        console.error('获取赛事列表失败:', error)
    }
}

const handleCurrentChange = (val: number) => {
    currentPage.value = val
    getMatchList()
}

// 点击赛事卡片
const handleMatchClick = (match: MatchItem) => {
    currentMatch.value = match
    dialogVisible.value = true
    barrageCurrentPage.value = 1
    getMatchBarrageList(1)
}

// 获取赛事烂梗列表
const getMatchBarrageList = async (pageNum: number) => {
    if (!currentMatch.value) return

    barrageLoading.value = true
    try {
        const res = await httpInstance.get<BarrageListData>('/machine/matchPageList', {
            params: {
                pageNum,
                pageSize: barragePageSize.value,
                matchId: currentMatch.value.id
            }
        })

        if (res.code === 200) {
            matchBarrageList.value = res.data.list
            barrageTotal.value = res.data.total
        } else {
            ElMessage.error(res.msg || '获取烂梗列表失败')
        }
    } catch (error) {
        ElMessage.error('获取烂梗列表失败')
        console.error('获取烂梗列表失败:', error)
    } finally {
        barrageLoading.value = false
    }
}

// 复制烂梗
const copyMeme_countPlus1 = async (item: BarrageItem) => {
    const memeText = item.barrage
    const res = copyMeme(memeText)
    if (!res || res === 'limitedSuccess') return
    copySuccess()

    try {
        if (await copyCountPlus1('match', item.id.toString(), barrageCurrentPage.value, barragePageSize.value)) {
            await getMatchBarrageList(barrageCurrentPage.value)
            return
        }
    } catch (error) {
        console.error('复制次数+1失败:', error)
    }
    plus1Error()
}
const handleBarragePageChange = (page: number) => {
    barrageCurrentPage.value = page
    getMatchBarrageList(page)
}

// 获取字典数据
memeTagsStore.tagsLoaded.then(() => {
    dictData.value = memeTagsStore.memeTags
})

// 移动端触摸处理
const handleTouchStart = (row: any) => {
    row.touchStartTime = Date.now()
}

const handleTouchEnd = (row: any) => {
    const touchEndTime = Date.now()
    if (touchEndTime - row.touchStartTime > 100) {
        row.popoverVisible = true
        setTimeout(() => {
            row.popoverVisible = false
        }, 1500)
    }
}

onMounted(() => {
    getMatchList()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.match-library {
    padding: 20px;
}

.match-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    width: 100%;
    margin-top: 20px;
}

.match-card {
    transition: all 0.3s;
    cursor: pointer;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

    html.dark & {
        background: rgba(26, 31, 39, 0.82);
        border-color: var(--el-border-color);
    }
}

.match-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);

    html.dark & {
        background: rgba(26, 31, 39, 0.95);
    }
}

.card-content {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.image-container {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.4);
    padding: 15px;

    html.dark & {
        background: rgba(255, 255, 255, 0.06);
    }
}

.match-image {
    width: auto;
    height: 150px;
    object-fit: contain;
    border-radius: 6px;
}

.match-info {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.match-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
}

.match-name {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    flex: 1;
    line-height: 1.4;

    html.dark & {
        color: var(--body-color);
    }
}

.match-level {
    flex-shrink: 0;
}

.match-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.match-location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    font-size: 14px;

    html.dark & {
        color: var(--el-text-color-secondary);
    }
}

.match-time {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.time-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    font-size: 14px;

    html.dark & {
        color: var(--el-text-color-secondary);
    }
}

.el-icon {
    font-size: 16px;
    color: #909399;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

.match-dialog {
    :deep(.el-dialog) {
        margin: 10px auto;
    }
    
    :deep(.el-dialog__body) {
        padding: 20px;
    }
}

.memes-view {
    width: 100%;
}

.card-table {
    width: 100%;
}

.barrage-text {
    font-size: 16px;
    line-height: 1.5;
}

.copy-btn {
    width: 90px;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 20px;
}

:deep(.hover-pointer) {
    cursor: pointer;
}

@media screen and (max-width: 768px) {
    .match-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
}

@media (max-width: 768px) {
    .match-dialog {
        :deep(.el-dialog) {
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        :deep(.el-dialog__body) {
            flex: 1;
            overflow-y: auto;
        }
    }
    
    .barrage-text {
        font-size: 14px;
    }
}
</style>
