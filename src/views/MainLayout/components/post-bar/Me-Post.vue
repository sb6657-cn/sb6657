<template>
    <div class="main-post" v-infinite-scroll="getPosts">
        <el-page-header @back="goBack" class="card" content="我的帖子" />
        <div v-for="post in posts" :key="post.id" class="card post-card-main">
            <div>
                <div class="post-card-header">
                    <img class="user-img" :src="getUserImgSrc(post.userName)" alt="">
                    <span class="post-user-name">{{ post.userName }}</span>
                </div>
                <div class="post-meta">
                    <span class="post-createTime">{{ formatTime(post.createTime) }}</span>
                    <el-popover placement="top-start" trigger="hover" width="auto"
                        @before-enter="getBarrageById(post.barrageId)">
                        <template #reference>
                            <el-tag effect="dark" round v-if="post.barrage" class="meme-tag">
                                <span class="meme-tag-text">#烂梗：{{ post.barrage }}</span>
                            </el-tag>
                        </template>
                        <template #default>
                            <div style="cursor: pointer;" @click="copyMeme(barrageMap.get(post.barrageId))">
                                {{ barrageMap.get(post.barrageId)?.barrage }}
                            </div>
                        </template>
                    </el-popover>
                </div>

            </div>
            <span class="post-content">
                {{ post.content }}
            </span>

            <div v-if="post.postStatement" class="post-statements">
                <span v-for="statement in filteredStatements(post.postStatement)" :key="statement.statementNum"
                    style="display: flex; align-items: center; margin-right: 10px;">
                    <el-tag round>
                        <img :src="statement.url" />
                        <span>{{ getStatementValue(post.postStatement, statement.statementNum) }}</span>
                    </el-tag>
                </span>
            </div>

            <div class="post-footer">
                <div class="post-footer-meta">
                    <el-popover placement="top-start" trigger="hover" width="auto" content="">
                        <template #default>
                            <div style="display: flex;">
                                <div v-for="statement in StatementGifList" :key="statement.statementNum"
                                    style="margin-right: 10px;">
                                    <span style="display: flex; flex-direction: column; align-items: center;"
                                        @click="sendStatement(post.id, statement.statementNum, post.id)">
                                        <img style="width: 30px;cursor:pointer;" :src="statement.url">
                                        <span style="cursor:pointer;">{{ statement.name }}</span>
                                    </span>
                                </div>
                            </div>
                        </template>
                        <template #reference>
                            <span><img src="/src/assets/icons/statement.svg">&nbsp;表态</span>
                        </template>
                    </el-popover>
                    <span style="cursor:pointer;" @click="toggleComments(post.id)">
                        <img src="/src/assets/icons/postComment.svg"><span>&nbsp;{{ post.commentCount }}</span>
                    </span>
                    <span v-if="post.likeFlag" style="cursor:not-allowed;" @click="likePost(post)">
                        <img src="/src/assets/icons/postIsLike.svg"><span>&nbsp;{{ post.postLike }}</span>
                    </span>
                    <span v-else style="cursor:pointer;" @click="likePost(post)">
                        <img src="/src/assets/icons/postNotLike.svg">&nbsp;赞
                    </span>
                </div>
                <div v-if="showComments.get(post.id)">
                    <CommentList :comments="commentMap.get(post.id) || []" :post-id="post.id" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus';
import httpInstance from '@/apis/httpInstance'
import { copyCountPlus1 } from '@/apis/setMeme'
import CommentList from './CommentList.vue'
import SendPost from './sendPost.vue'
import { copyToClipboard } from '@/utils/clipboard'
import { useRouter } from 'vue-router'
const router = useRouter()

interface Barrage {
    id: number
    barrage: string
    cnt: number
}
interface PostStatement {
    btLike: number
    btJoker: number
    btSix: number
    btStar: number
    btRead: number
    btCry: number
    btAngry: number
    btQuestion: number
    btMelon: number
}

interface Post {
    id: number
    userName: string
    content: string
    createTime: string
    barrageId: number
    barrage: string
    views: number
    postLike: number
    commentCount: number
    likeFlag: boolean
    postStatement: PostStatement | null
}

interface PostListData {
    list: Post[]
}

interface Comment {
    id: number
    postId: number
    parentId: number
    userId: number
    userName: string
    content: string
    likeCount: number
    createTime: string
    isDelete: string
    children: Comment[] | null
}

const goBack = () => {
  router.back()
}
const commentMap = ref<Map<number, Comment[]>>(new Map())
const showComments = ref<Map<number, boolean>>(new Map())

const StatementGifList = ref([
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/7c72e4d78ebd97382d3f26e5a19811e8/7c72e4d78ebd97382d3f26e5a19811e8.gif', statementNum: '0', name: '点赞' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/db9196946fade857487d59be68b36267/db9196946fade857487d59be68b36267.gif', statementNum: '1', name: '小丑' },
    { url: 'https://c-yuba.douyucdn.cn/yubavod/admin/common/acf317da9ad35fa498442d704d98d5d3.gif', statementNum: '2', name: '6' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/83fdf1c0f5cbe371f27e802561c77e20/83fdf1c0f5cbe371f27e802561c77e20.gif', statementNum: '3', name: '星星眼' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/5fb9b6546d750d4de5a8ef871371c582/5fb9b6546d750d4de5a8ef871371c582.gif', statementNum: '4', name: '已阅' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/d93d137765536483b8b6c1fdd0539474/d93d137765536483b8b6c1fdd0539474.gif', statementNum: '5', name: '快哭了' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/44ab7dd05057009730686e0a9b779e08/44ab7dd05057009730686e0a9b779e08.gif', statementNum: '6', name: '生气' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/a9521ac5aff85035d247362b18e7ae76/a9521ac5aff85035d247362b18e7ae76.gif', statementNum: '7', name: '问号' },
    { url: 'https://c-yuba.douyucdn.cn/yubares/2024/06/24/922b1ee01ed1b330cf7aa37e2cf28e74/922b1ee01ed1b330cf7aa37e2cf28e74.gif', statementNum: '8', name: '吃瓜' },
])

const posts = ref<Post[]>([])
const barrageMap = ref<Map<number, Barrage>>(new Map())

const showComment = ref<{ [key: number]: boolean }>({}) // 控制某帖子的评论是否显示
const pageNum = ref(1)
const pageSize = 5
const hasMore = ref(true) // 是否还有更多数据
const loading = ref(false) // 是否正在加载中

// 获取评论列表
const getCommentsByPostId = async (postId: number) => {
    const res = await httpInstance.get<Comment[]>(`/machine/Post/Comment/getComment/${postId}`)
    commentMap.value.set(postId, res.data)
}

// 切换显示评论的方法
const toggleComments = async (postId: number) => {
    if (!showComments.value.get(postId)) {
        await getCommentsByPostId(postId)
    }
    showComments.value.set(postId, !showComments.value.get(postId))
}

const getPosts = async () => {
    if (loading.value || !hasMore.value) return;
    loading.value = true;
    console.log('Loading more posts...');
    try {
        const res = await httpInstance.get<PostListData>('/machine/Post/selectIsMePageList', {
            params: {
                pageNum: pageNum.value,
                pageSize: pageSize
            }
        });

        if (res.data.list.length < pageSize) {
            hasMore.value = false;
        }
        posts.value.push(...res.data.list);
        pageNum.value++; // 递增页码
    } catch (e) {
        // 可以根据需要处理异常
    } finally {
        loading.value = false;
    }
};

const formatTime = (time: string) => {
    const date = new Date(time)
    return date.toLocaleString()
}

const getUserImgSrc = (userName: string) => {
    const randomNumber = Math.floor(Math.random() * 5)
    return `/src/assets/imgs/user-img-${randomNumber}.png`
}
const getBarrageById = async (barrageId: number) => {
    if (barrageMap.value.has(barrageId)) {
        return barrageMap.value.get(barrageId)
    }
    const res = await httpInstance.get<Barrage>(`/machine/getBarrageInfo/${barrageId}`)
    const barrageData: Barrage = res.data
    barrageMap.value.set(barrageId, barrageData)
    return barrageData
}

function likePost(post: Post) {
    if (post.likeFlag) return;
    httpInstance.post(`/machine/Post/like/${post.id}`).then(() => {
        post.likeFlag = true;
        post.postLike += 1;
    });
}
// 判断是否需要显示某个 statement
const shouldShowStatement = (postStatement: PostStatement, statementNum: string): boolean => {
    const mapping: { [key: string]: keyof PostStatement } = {
        '0': 'btLike',
        '1': 'btJoker',
        '2': 'btSix',
        '3': 'btStar',
        '4': 'btRead',
        '5': 'btCry',
        '6': 'btAngry',
        '7': 'btQuestion',
        '8': 'btMelon',
    };
    const key = mapping[statementNum];
    return !!key && postStatement[key] > 0;
};

// 获取对应 statement 的值
const getStatementValue = (postStatement: PostStatement, statementNum: string): number => {
    const mapping: { [key: string]: keyof PostStatement } = {
        '0': 'btLike',
        '1': 'btJoker',
        '2': 'btSix',
        '3': 'btStar',
        '4': 'btRead',
        '5': 'btCry',
        '6': 'btAngry',
        '7': 'btQuestion',
        '8': 'btMelon',
    };
    const key = mapping[statementNum];
    return key ? postStatement[key] : 0;
};
const filteredStatements = (postStatement: PostStatement | null) => {
    if (!postStatement) return [];
    return StatementGifList.value.filter(statement =>
        shouldShowStatement(postStatement, statement.statementNum)
    );
};

function sendStatement(id: number, statementNum: string, postId: number) {
    const post = posts.value.find(p => p.id === postId);
    if (!post || !post.postStatement) return;
    const postStatement = post.postStatement;

    const mapping: { [key: string]: keyof PostStatement } = {
        '0': 'btLike',
        '1': 'btJoker',
        '2': 'btSix',
        '3': 'btStar',
        '4': 'btRead',
        '5': 'btCry',
        '6': 'btAngry',
        '7': 'btQuestion',
        '8': 'btMelon',
    };
    const key = mapping[statementNum];
    if (!key) return;
    httpInstance.post('/machine/Post/Statement', {
        portId: id,
        postId: postId,
        statementNum: statementNum
    }).then(() => {
        //更新表态数量
        postStatement[key]++;
        ElMessage.success('表态成功');
    });
}
function copyMeme(barrageMap: Barrage | undefined) {
    if (barrageMap) {
        copyToClipboard(barrageMap.barrage)
        copyCountPlus1('', barrageMap.id.toString()).then(() => {
            ElMessage.success('复制成功')
        }).catch(() => {
            console.log('复制失败')
        })
    }

}
onMounted(() => {
    getPosts();
});
</script>
<style scoped lang="scss">
@media (min-width: 601px) {
    .main-post {
            margin-bottom: 50px;

        .post-card-main {
            width: 60%;
            margin: 5px auto;

            .post-card-header {
                display: flex;
                align-items: center;
            }

            .post-createTime {
                font-size: 12px;
                color: #999;

                html.dark & {
                    color: var(--el-text-color-secondary);
                }
            }

            .meme-tag.el-tag {
                cursor: pointer;
                margin-bottom: 5px;
                font-size: 14px;
                margin-left: 10px;
                white-space: normal;
                /* 确保自动换行 */
                height: auto;
                padding: 5px;
                background-color: #00ffff;
                border-color: #00ffff;

                .meme-tag-text {
                    color: #003844;
                }

                html.dark & {
                    background-color: #1b5e66;
                    border-color: #1b5e66;

                    .meme-tag-text {
                        color: #d7f6f8;
                    }
                }
            }

            .user-img {
                width: 36px;
                height: 36px;
                border-radius: 50%;
            }

            .post-user-name {
                font-size: 16px;
                font-weight: bold;
                margin-left: 10px;
                align-items: center;
            }

            .post-content {
                line-height: 24px;
                white-space: normal;
                word-wrap: break-word;
                margin-top: 20px;
                margin-bottom: 20px;
                max-width: 100%;
                margin-left: 46px;
            }

            .post-statements {
                display: flex;
                flex-wrap: wrap;
                margin-top: 10px;
                margin-left: 5%;

                .el-tag {

                    span {
                        color: #999;
                        vertical-align: middle;
                        align-items: center;
                        font-size: 16px;
                        margin-left: 5px;
                    }

                    img {
                        vertical-align: middle;
                        width: 24px;
                        height: 24px;
                    }
                }
            }

            .post-footer {
                margin-left: 5%;
                margin-right: 5%;

                .post-footer-meta {
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;

                    img {
                        width: 20px;
                    }

                    span {
                        img {
                            vertical-align: middle;
                        }

                        span {
                            vertical-align: middle;
                        }
                    }
                }
            }

        }
    }

}

@media (max-width: 600px) {
    .main-post {
            margin-bottom: 50px;

        .post-card-main {
            width: 100%;
            margin: 5px auto;

            .post-card-header {
                display: flex;
                align-items: center;
            }

            .post-createTime {
                font-size: 12px;
                color: #999;

                html.dark & {
                    color: var(--el-text-color-secondary);
                }
            }

            .meme-tag.el-tag {
                cursor: pointer;
                margin-bottom: 5px;
                font-size: 14px;
                
                margin-left: 10px;
                white-space: normal;
                /* 确保自动换行 */
                height: auto;
                padding: 5px;
                background-color: #00ffff;
                border-color: #00ffff;

                .meme-tag-text {
                    color: #003844;
                }

                html.dark & {
                    background-color: #1b5e66;
                    border-color: #1b5e66;

                    .meme-tag-text {
                        color: #d7f6f8;
                    }
                }
            }

            .user-img {
                width: 36px;
                height: 36px;
                border-radius: 50%;
            }

            .post-user-name {
                font-size: 16px;
                font-weight: bold;
                margin-left: 10px;
                align-items: center;
            }

            .post-content {
                line-height: 24px;
                white-space: normal;
                word-wrap: break-word;
                margin-top: 20px;
                margin-bottom: 20px;
                max-width: 100%;
                margin-left: 46px;
            }

            .post-statements {
                display: flex;
                flex-wrap: wrap;
                margin-top: 10px;
                margin-left: 5%;

                .el-tag {

                    span {
                        
                        vertical-align: middle;
                        align-items: center;
                        font-size: 16px;
                        margin-left: 5px;
                    }

                    img {
                        vertical-align: middle;
                        width: 24px;
                        height: 24px;
                    }
                }
            }

            .post-footer {
                margin-left: 5%;
                margin-right: 5%;

                .post-footer-meta {
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;

                    img {
                        width: 20px;
                    }

                    span {
                        img {
                            vertical-align: middle;
                        }

                        span {
                            vertical-align: middle;
                        }
                    }
                }
            }

        }
    }
}
</style>
