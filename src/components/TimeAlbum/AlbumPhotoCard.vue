<template>
    <article class="photo-card">
        <el-image class="photo-card__image" :src="image.url" :alt="title" :preview-src-list="[image.url]" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" :hide-on-click-modal="true" :preview-teleported="true" fit="cover" lazy>
            <template #placeholder>
                <div class="image-state">图片加载中…</div>
            </template>
            <template #error>
                <div class="image-state image-state--error">
                    <Image :size="16" />
                    <span>图片暂时无法加载</span>
                </div>
            </template>
        </el-image>

        <div class="photo-card__body">
            <p class="photo-card__title" :title="title">{{ title }}</p>
            <div class="photo-card__actions">
                <button type="button" class="photo-action" :class="{ 'is-active': image.showComments }" :aria-expanded="image.showComments" :aria-controls="commentsId" @click="emit('toggle-comments')">
                    <MessageCircle :size="16" />
                    <span>{{ image.showComments ? '收起' : '评论' }} ({{ image.comments.length }})</span>
                </button>
                <button type="button" class="photo-action photo-action--primary" @click="emit('comment')">
                    <Pencil :size="16" />
                    <span>写评论</span>
                </button>
            </div>

            <div v-if="image.showComments" :id="commentsId" class="comment-list">
                <p v-if="image.comments.length === 0" class="comment-empty">还没有评论</p>
                <div v-for="(comment, index) in image.comments" :key="comment.id || `${image.id}-${index}`" class="comment-item">
                    <div class="comment-meta">
                        <strong>{{ comment.douyuID || '匿名' }}</strong>
                        <time>{{ formatAlbumCommentDate(comment.createdAt) }}</time>
                    </div>
                    <p>{{ comment.commentname }}</p>
                </div>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
import type { AlbumImage } from '@/types/timeAlbum';
import { formatAlbumCommentDate, getAlbumImageTitle } from '@/utils/timeAlbum';
import { MessageCircle, Pencil, Image } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{ image: AlbumImage }>();
const emit = defineEmits<{
    'toggle-comments': [];
    comment: [];
}>();

const title = computed(() => getAlbumImageTitle(props.image));
const commentsId = computed(() => `comments-${props.image.id}`);
</script>

<style scoped lang="scss">
.photo-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background-color: var(--card-bg);
}

.photo-card__image {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    cursor: zoom-in;
    background-color: var(--el-fill-color-light);
}

:deep(.photo-card__image .el-image__inner) {
    width: 100%;
    height: 100%;
}

.image-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    height: 100%;
    padding: 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;
}

.image-state--error {
    flex-direction: column;
}

.photo-card__body {
    padding: 9px 10px 0;
}

.photo-card__title {
    display: -webkit-box;
    overflow: hidden;
    color: var(--body-color);
    font-size: 14px;
    line-height: 1.45;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.photo-card__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
}

.photo-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 0;
    height: 30px;
    padding: 0 6px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--el-text-color-regular);
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    transition:
        color 150ms ease,
        background-color 150ms ease;

    &:hover,
    &:focus-visible,
    &.is-active {
        background-color: var(--el-fill-color-light);
        color: var(--el-color-primary);
    }

    &:focus-visible {
        outline: 2px solid var(--el-color-primary-light-5);
        outline-offset: 1px;
    }
}

.photo-action--primary {
    color: var(--el-color-primary);
}

.comment-list {
    max-height: 220px;
    margin-top: 7px;
    padding-top: 2px;
    overflow-y: auto;
    border-top: 1px solid var(--el-border-color-lighter);
}

.comment-empty {
    padding: 10px 0 2px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;
}

.comment-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
        border-bottom: 0;
    }

    > p {
        margin-top: 3px;
        color: var(--body-color);
        font-size: 13px;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }
}

.comment-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;

    strong {
        min-width: 0;
        overflow: hidden;
        color: var(--el-text-color-regular);
        font-size: 12px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    time {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
        font-size: 10px;
    }
}

@media (max-width: 600px) {
    .photo-card {
        border-radius: 7px;
    }

    .photo-card__body {
        padding: 7px;
    }

    .photo-card__title {
        min-height: 34px;
        font-size: 12px;
        line-height: 1.4;
    }

    .photo-card__actions {
        gap: 2px;
        margin-top: 5px;
        padding-top: 5px;
    }

    .photo-action {
        gap: 3px;
        height: 28px;
        padding: 0 3px;
        font-size: 12px;
    }

    .comment-list {
        max-height: 180px;
        margin-top: 5px;
    }

    .comment-item {
        padding: 7px 0;

        > p {
            font-size: 12px;
        }
    }

    .comment-meta {
        display: block;

        strong,
        time {
            display: block;
        }

        time {
            margin-top: 1px;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .photo-action {
        transition: none;
    }
}
</style>
