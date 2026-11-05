<template>
    <section v-infinite-scroll="requestMore" v-loading="loading && images.length === 0" class="image-list" aria-label="时光相册照片列表" :infinite-scroll-disabled="loading || !hasMore" :infinite-scroll-distance="120">
        <AlbumPhotoCard v-for="image in images" :key="image.id || image.url" :image="image" @toggle-comments="emit('toggle-comments', image)" @comment="emit('comment', image)" />
    </section>

    <div v-if="images.length > 0" class="load-state">
        <button v-if="hasMore" type="button" class="load-more" :disabled="loading" @click="requestMore">
            <span class="load-more-icon" :class="{ 'is-loading': loading }">
                <MorphIcon :icon="loading ? Loader2 : ArrowDown" :size="16" :stroke-width="2.5" spring="snappy" />
            </span>
            <span>{{ loading ? '正在加载…' : '加载更多' }}</span>
        </button>
        <p v-else>已经到底了</p>
    </div>
</template>

<script setup lang="ts">
import AlbumPhotoCard from '@/components/TimeAlbum/AlbumPhotoCard.vue';
import type { AlbumImage } from '@/types/timeAlbum';
import { ArrowDown, Loader2 } from 'lucide';

defineProps<{
    images: AlbumImage[];
    loading: boolean;
    hasMore: boolean;
}>();

const emit = defineEmits<{
    'load-more': [];
    'toggle-comments': [image: AlbumImage];
    comment: [image: AlbumImage];
}>();

function requestMore() {
    emit('load-more');
}
</script>

<style scoped lang="scss">
.image-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    align-items: start;
    gap: 14px;
    min-height: 260px;
}

.load-state {
    display: flex;
    justify-content: center;
    min-height: 42px;
    margin-top: 18px;

    > p {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 32px;
    }
}

.load-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 112px;
    height: 32px;
    padding: 0 14px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background-color: var(--card-bg);
    color: var(--el-color-primary);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition:
        border-color 150ms ease,
        background-color 150ms ease;

    &:hover:not(:disabled),
    &:focus-visible {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
    
    .load-more-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 6px;

        &.is-loading {
            animation: rotating 1.5s linear infinite;
        }
    }
}

    &:focus-visible {
        outline: 2px solid var(--el-color-primary-light-5);
        outline-offset: 2px;
    }

    &:disabled {
        cursor: wait;
        opacity: 0.65;
    }
}

@media (max-width: 600px) {
    .image-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        min-height: 220px;
    }

    .load-state {
        margin-top: 14px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .load-more {
        transition: none;
    }
}
</style>
