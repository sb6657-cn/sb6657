<template>
    <div class="comment-item">
        <div class="comment-header">
            <img class="avatar" :src="getAvatar(comment.userId)" />
            <span class="username">
                {{ comment.userName }}
                <span style="color: #808080ff;" v-if="comment.toUserName"> <span style="color: var(--body-color);font-size: 12px;">回复</span> {{ comment.toUserName }} :</span> <span v-else>：</span>
            </span>
            <span>{{ comment.content }}</span>
        </div>
        <span class="time">{{ formatTime(comment.createTime) }}</span>
        <el-button text size="small" @click="likeCommentById(comment.id)"><img class="likeImg"
                src="/src/assets/icons/postNotLike.svg"> {{ comment.likeCount }}</el-button>
        <el-button text size="small" @click="replyTo">回复</el-button>

        <!-- 回复输入框弹窗 -->
        <el-dialog v-model="replyVisible" title="回复评论">
            <el-input v-model="replyContent" type="textarea" placeholder="请输入回复内容" rows="4" />
            <template #footer>
                <el-button @click="replyVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReply">发送</el-button>
            </template>
        </el-dialog>

        <div v-if="comment.children?.length" :style="{ marginLeft: level === 1 ? '15px' : '0' }" class="child-comments">
            <CommentItem v-for="child in comment.children" :key="child.id" :comment="child" :level="(level || 0) + 1"
                @refresh="emit('refresh')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import httpInstance from '@/apis/httpInstance'

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

const props = defineProps<{
    comment: CommentType
    level?: number
}>()

const emit = defineEmits(['refresh'])

const userImgList = [
    'https://pic1.imgdb.cn/item/6806fcac58cb8da5c8bdab62.jpg',
    'https://pic1.imgdb.cn/item/6806fcac58cb8da5c8bdab65.png',
    'https://pic1.imgdb.cn/item/6806fcac58cb8da5c8bdab66.png',
    'https://pic1.imgdb.cn/item/6806fcac58cb8da5c8bdab66.png',
    'https://pic1.imgdb.cn/item/6806fcac58cb8da5c8bdab64.png',
    'https://pic1.imgdb.cn/item/6807007258cb8da5c8bdbbbc.png',
    'https://pic1.imgdb.cn/item/680700ab58cb8da5c8bdbce4.png',
    'https://pic1.imgdb.cn/item/680700ab58cb8da5c8bdbce7.png',
    'https://pic1.imgdb.cn/item/680700ab58cb8da5c8bdbce3.png',
    'https://pic1.imgdb.cn/item/680700aa58cb8da5c8bdbce1.png',
    'https://pic1.imgdb.cn/item/680700d458cb8da5c8bdbdd7.png',
    'https://pic1.imgdb.cn/item/680700d458cb8da5c8bdbdd6.png',
    'https://pic1.imgdb.cn/item/680700d458cb8da5c8bdbdd1.png',
    'https://pic1.imgdb.cn/item/680700d458cb8da5c8bdbdd5.png',
    'https://pic1.imgdb.cn/item/680700d458cb8da5c8bdbdd3.png',
    'https://pic1.imgdb.cn/item/680700f858cb8da5c8bdbe94.png',
    'https://pic1.imgdb.cn/item/6807011a58cb8da5c8bdbf61.png',
    'https://pic1.imgdb.cn/item/6807011b58cb8da5c8bdbf64.png',
    'https://pic1.imgdb.cn/item/6807011b58cb8da5c8bdbf62.png',
    'https://pic1.imgdb.cn/item/6807011b58cb8da5c8bdbf63.png',
]
const getUserImgSrc = (userName: string) => {
    const randomNumber = Math.floor(Math.random() * 20)
    return userImgList[randomNumber]
}
const getAvatar = (userId: number) => {
    const randomNumber = Math.floor(Math.random() * 20)
    return userImgList[randomNumber]
}

const formatTime = (time: string) => new Date(time).toLocaleString()

const likeCommentById = async (commentId: number) => {
    try {
        const res = await httpInstance.post(`/machine/Post/Comment/like/${commentId}`)
        if (res.code === 200) {
            ElMessage.success('点赞成功')
            emit('refresh')
        } else {
            ElMessage.error('点赞失败')
        }
    } catch (error) {
        
    }
}

const replyContent = ref('')
const replyVisible = ref(false)

const replyTo = () => {
    replyContent.value = ''
    replyVisible.value = true
}

const submitReply = async () => {
    if (!replyContent.value.trim()) {
        ElMessage.warning('请输入回复内容')
        return
    }

    try {
        const res = await httpInstance.post('/machine/Post/Comment/reply', {
            postId: props.comment.postId,
            parentId: props.comment.id,
            toUserName: props.comment.userName,
            content: replyContent.value
        })

        if (res.code === 200) {
            ElMessage.success('回复成功')
            replyVisible.value = false
            emit('refresh') // 通知父组件刷新
        } else {
            ElMessage.error('回复失败')
        }
    } catch (err) {
        
    }
}
</script>

<style scoped lang="scss">
@media (min-width: 601px) {
    .comment-item {
        .likeImg {
            width: 18px;
            height: 18px;
            margin-right: 3px;
        }

        font-size: 15px;
        font-family: PingFang SC;
        margin-bottom: 15px;
    }

    .comment-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .username {
        color: #808080ff;
    }

    .time {
        margin-left: 30px;
        font-size: 12px;
        color: #999;
    }

    .avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }

    .child-comments {
        margin-top: 5px;
    }
}
@media (max-width:600px) {
    .comment-item {
        .likeImg {
            width: 18px;
            height: 18px;
            margin-right: 3px;
        }

        font-size: 14px;
        margin-bottom: 15px;
    }

    .comment-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .username {
        color: #808080ff;
    }

    .time {
        margin-left: 30px;
        font-size: 12px;
        color: #999;
    }

    .avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }

    .child-comments {
        margin-top: 5px;
    }
}

html.dark .username {
    color: var(--el-text-color-secondary);
}

html.dark .time {
    color: var(--el-text-color-secondary);
}
</style>