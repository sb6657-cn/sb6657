<template>
    <div class="message-container">
        <el-page-header @back="goBack" class="card" content="我的消息" />

        <!-- 内容为空 -->
        <el-empty v-if="!loading && list.length === 0" description="暂无消息" />

        <!-- 消息列表 -->
        <div v-else class="msg-list" >
            <div v-for="(item, index) in list" :key="index" class="card message-item">
                <div class="item-header">
                    <span class="nickname">👤 {{ item.fromNickname }}</span>
                    <span class="time">🕒 {{ formatTime(item.createTime) }}</span>
                </div>

                <div class="item-type">
                    <el-tag v-if="item.type === 'like'" size="small" type="success">
                        点赞了你的<strong>{{ item.targetType === 'post' ? '帖子' : '评论' }}</strong>
                    </el-tag>
                    <el-tag v-else-if="item.type === 'comment_post'" size="small" type="info">
                        评论了你的<strong>{{ item.targetType === 'post' ? '评论' : '帖子' }}</strong>
                    </el-tag>
                    <el-tag v-else-if="item.type === 'reply_comment'" size="small" type="warning">
                        回复了你的<strong>{{ item.targetType === 'post' ? '帖子' : '评论' }}</strong>
                    </el-tag>
                    <el-tag v-else-if="item.type === 'expression'" size="small" type="warning">
                        表态了你的<strong>{{ item.targetType === 'post' ? '帖子' : '评论' }}</strong>
                    </el-tag>
                </div>

                <div class="item-content">
                    「{{ item.targetContent }}」
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
            <el-pagination background layout="prev, pager, next" :current-page="pageNum" :page-size="pageSize"
                :total="total" @current-change="handlePageChange" />
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import httpInstance from '@/apis/httpInstance'
import { useRouter } from 'vue-router'
const router = useRouter()
interface MessageItem {
    fromUserId: number | null
    fromNickname: string
    type: string
    targetId: number
    targetType: string
    targetContent: string
    createTime: string
}

interface MessagePageData {
    list: MessageItem[]
    total: number
}

const list = ref<MessageItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const fetchData = async () => {
    loading.value = true
    try {
        const res = await httpInstance.get<MessagePageData>(`/machine/SysMessage/getLikeMsgList`, {
            params: { pageNum: pageNum.value, pageSize: pageSize.value }
        })

        const data = res.data
        list.value = data.list
        total.value = data.total || 0
    } catch (e) {
        console.error('消息获取失败', e)
    } finally {
        loading.value = false
    }
}

const goBack = () => {
    router.back()
}
const handlePageChange = (newPage: number) => {
    pageNum.value = newPage
    fetchData()
}

const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString()
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped lang="scss">
.message-container {
    width: 60%;
    padding: 24px;
    margin: 0 auto;
}

.item-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;

    html.dark & {
        color: var(--el-text-color-regular);
    }
}

.nickname {
    font-weight: 500;
}

.time {
    font-size: 12px;
    color: #999;

    html.dark & {
        color: var(--el-text-color-secondary);
    }
}

.item-type {
    font-size: 13px;
    margin-bottom: 6px;
    color: #444;

    html.dark & {
        color: var(--el-text-color-regular);
    }
}

.item-content {
    width: 100%;
    font-size: 14px;
    color: var(--body-color);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.message-item {
    margin-top: 10px;
    margin-bottom: 10px;
    transition: all 0.2s ease;
}

.pagination {
    margin-top: 32px;
    margin-bottom: 32px;
    display: flex;
    justify-content: center;
}
@media (max-width: 600px) {
    .message-container {
        width: 100%;
        padding: 16px;
    }

    .item-header {
        font-size: 12px;
    }

    .item-type {
        font-size: 12px;
    }

    .item-content {
        font-size: 13px;
    }
}
</style>
