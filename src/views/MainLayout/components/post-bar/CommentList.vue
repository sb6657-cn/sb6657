<template>
    <div style="display: flex;margin-top: 10px;">
        <el-input v-model="CommentValue" placeholder="评论一下吧~"></el-input>&nbsp;<el-button @click="CommentPost(postId)" color="#FF9933" :disabled="CommentValue.length === 0">评论</el-button>
    </div>
    <div v-if="comments.length" class="comment-list">


        <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" @like="likeCommentById"
            @reply="replyTo" @refresh="getComments" />
        <el-divider />

        <el-pagination v-if="pagination.total > pagination.pageSize" :current-page="pagination.pageNum"
            :page-size="pagination.pageSize" :total="pagination.total" @current-change="loadPage"
            layout="prev, pager, next" background class="pagination" />
    </div>
    <div v-else>
        <p class="empty-comment">暂无评论，期待您的评论~</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import httpInstance from '@/apis/httpInstance'
import CommentItem from './CommentItem.vue'

const CommentValue = ref('')
const commentId = ref(0)

interface CommentType {
    id: number
    postId: number
    parentId: number
    userId: number
    userName: string
    content: string
    likeCount: number
    createTime: string
    isDelete: string
    toUserName: string
    children?: CommentType[] | null
}

interface CommentPageData {
    list: CommentType[]
    total: number
    pageNum: number
}

const props = defineProps<{ postId: number }>()
const comments = ref<CommentType[]>([])
const pagination = ref({
    pageNum: 1,
    pageSize: 10,
    total: 0
})

const getComments = async (pageNum = 1) => {
    try {
        const res = await httpInstance.get<CommentPageData>(`/machine/Post/Comment/getComment/${props.postId}`, {
            params: {
                pageNum,
                pageSize: pagination.value.pageSize
            }
        })

        if (res.code === 200) {
            comments.value = res.data.list
            pagination.value.total = res.data.total
            pagination.value.pageNum = res.data.pageNum
        } else {
            ElMessage.error('获取评论失败')
        }
    } catch (error) {
        ElMessage.error('网络请求失败')
    }
}
defineExpose({ getComments }) // 暴露给子组件调用
const loadPage = (pageNum: number) => {
    pagination.value.pageNum = pageNum
    getComments(pageNum)
}

// 点赞操作：调用接口后刷新数据
const likeCommentById = async (commentId: number) => {
    try {
        const res = await httpInstance.post(`/machine/Post/Comment/like/${commentId}`)
        if (res.code === 200) {
            ElMessage.success('点赞成功')
            getComments(pagination.value.pageNum)
        } else {
            ElMessage.error('点赞失败')
        }
    } catch (error) {
        ElMessage.error('请求点赞接口失败')
    }
}

// 回复操作：例如弹出回复框后提交（这里仅示例回复操作后刷新数据）
const replyTo = async (comment: CommentType) => {
    // 此处你需要实现回复的逻辑，如调用弹窗收集回复内容后提交
    console.log('回复评论：', comment)
    // 示例：调用回复接口（此处假设 API 为 /machine/Post/Comment/reply）
    try {
        const res = await httpInstance.post(`/machine/Post/Comment/reply`, {
            parentId: comment.id,
            postId: comment.postId,
            // 此处还需收集回复内容等字段
            content: '这里是回复内容'
        })
        if (res.code === 200) {
            ElMessage.success('回复成功')
            getComments(pagination.value.pageNum)
        } else {
            ElMessage.error('回复失败')
        }
    } catch (error) {
        ElMessage.error('请求回复接口失败')
    }
}
function CommentPost(postId :number){
    if (!CommentValue.value.trim()) {
        ElMessage.warning('评论内容不能为空')
        return
    }
    httpInstance.post('/machine/Post/Comment/add', {
        postId: postId,
        content: CommentValue.value.trim()
    }).then((res) => {
        if (res.code === 200) {
            ElMessage.success('评论成功')
            CommentValue.value = ''
            getComments(pagination.value.pageNum)
        } else {
            ElMessage.error(res.msg || '评论失败')
        }
    }).catch((error) => {
        ElMessage.error('网络错误，评论失败')
    })

}
onMounted(() => {
    getComments()
})
</script>

<style scoped>
.comment-list {
    padding: 10px 0;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.empty-comment {
    color: #999;
}

html.dark .empty-comment {
    color: var(--el-text-color-secondary);
}
</style>
