<template>
    <main class="album-page">
        <header class="album-header">
            <div class="album-heading">
                <div class="album-title-row">
                    <h1>时光相册</h1>
                    <span>点击照片即可放大</span>
                </div>
                <p>记录玩机器相关的照片与表情包</p>
            </div>
            <p class="album-notice">
                想补一张请点顶部「上传照片 / 建议/提交BUG」填表，
                <br />
                我们看到后会手动加上。侵权删除也走这里。
            </p>
        </header>

        <AlbumGallery :images="images" :loading="loading" :has-more="hasMore" @load-more="loadMoreImages" @toggle-comments="toggleComments" @comment="openCommentDialog" />

        <el-empty v-if="!loading && images.length === 0" :description="loadFailed ? '照片加载失败，请稍后重试' : '相册里暂时还没有照片'">
            <el-button v-if="loadFailed" type="primary" plain @click="retryLoad">重新加载</el-button>
        </el-empty>

        <AlbumCommentDialog v-model="commentDialogVisible" :image="selectedImage" :submitting="submitting" @closed="clearSelectedImage" @submit="saveComment" />
        <el-backtop :right="20" :bottom="50" />
    </main>
</template>

<script setup lang="ts">
import httpInstance from '@/apis/httpInstance';
import AlbumCommentDialog from '@/components/TimeAlbum/AlbumCommentDialog.vue';
import AlbumGallery from '@/components/TimeAlbum/AlbumGallery.vue';
import type { AlbumImage, AlbumPage } from '@/types/timeAlbum';
import { normalizeAlbumImage } from '@/utils/timeAlbum';
import { ElMessage, ElNotification } from 'element-plus';
import { ref } from 'vue';

interface BackendResponse<T> {
    data?: T;
}

const images = ref<AlbumImage[]>([]);
const pageNum = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const loadFailed = ref(false);

const commentDialogVisible = ref(false);
const selectedImage = ref<AlbumImage | null>(null);
const submitting = ref(false);

async function load() {
    if (loading.value || !hasMore.value) return;
    loading.value = true;
    loadFailed.value = false;

    try {
        const response = (await httpInstance.get('/machine/showImage', {
            params: {
                pageNum: pageNum.value,
                pageSize,
            },
        })) as unknown as BackendResponse<AlbumPage>;
        const page = response.data;
        const nextImages = (page?.list ?? []).map(normalizeAlbumImage);

        if (pageNum.value === 1) {
            images.value = nextImages;
        } else {
            images.value.push(...nextImages);
        }

        hasMore.value = nextImages.length === pageSize && page?.lastPage !== true;
        pageNum.value += 1;
    } catch (error) {
        console.error('加载相册失败:', error);
        loadFailed.value = true;
    } finally {
        loading.value = false;
    }
}

function loadMoreImages() {
    void load();
}

function retryLoad() {
    pageNum.value = 1;
    hasMore.value = true;
    void load();
}

function toggleComments(image: AlbumImage) {
    image.showComments = !image.showComments;
}

function openCommentDialog(image: AlbumImage) {
    selectedImage.value = image;
    commentDialogVisible.value = true;
    ElNotification({
        title: '温馨提醒',
        message: '请注意你的行为，不要上传违反法律的内容，后台能监控到你',
        type: 'warning',
    });
}

function clearSelectedImage() {
    selectedImage.value = null;
}

async function saveComment(content: string) {
    if (!selectedImage.value || submitting.value) return;

    submitting.value = true;
    const targetImage = selectedImage.value;

    try {
        await httpInstance.post('/machine/addCommentname', {
            id: '',
            imageId: targetImage.id,
            douyuID: '',
            createdAt: '',
            commentname: content,
        });
        targetImage.comments.push({
            douyuID: '我',
            createdAt: new Date().toISOString(),
            commentname: content,
        });
        targetImage.showComments = true;
        ElMessage.success('评论成功');
        commentDialogVisible.value = false;
    } catch (error) {
        console.error('发表评论失败:', error);
    } finally {
        submitting.value = false;
    }
}

void load();
</script>

<style scoped lang="scss">
.album-page {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 8px 12px 32px;
}

.album-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin: 2px 2px 14px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.album-title-row {
    display: flex;
    align-items: baseline;
    gap: 8px;

    h1 {
        margin: 0;
        color: inherit;
        font-size: 22px;
        line-height: 1.3;
        letter-spacing: normal;
    }

    span {
        font-size: 13px;
        opacity: 0.82;
    }
}

.album-heading > p,
.album-notice {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.5;
    opacity: 0.82;
}

.album-notice {
    max-width: 36em;
    text-align: right;
}

@media (max-width: 600px) {
    .album-page {
        padding: 7px 8px 24px;
    }

    .album-header {
        display: block;
        margin: 0 3px 11px;
    }

    .album-title-row {
        gap: 6px;

        h1 {
            font-size: 19px;
        }

        span {
            font-size: 12px;
        }
    }

    .album-heading > p,
    .album-notice {
        font-size: 11px;
    }

    .album-notice {
        max-width: none;
        margin-top: 3px;
        text-align: left;
    }
}
</style>
