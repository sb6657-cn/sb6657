<template>
    <div class="home-info-modules">
        <section class="info-module latest-module" aria-labelledby="latest-meme-title">
            <RouterLink id="latest-meme-title" class="total-link" to="/memes/AllBarrage">
                共有
                <span class="total-count">{{ formattedTotal }}</span>
                条烂梗
            </RouterLink>
            <p class="submit-time">最新投稿 {{ lastMeme.time || '—' }}</p>
            <div class="line-bottom">
                <span class="copy-hint">(点击可复制)</span>
                <ElTooltip :trigger="isMobile ? 'click' : 'hover'" placement="top" effect="light">
                    <template #content>
                        <div class="tooltip-content">
                            <div v-if="lastMeme.tags && lastMeme.tags.length" class="tags-container">
                                <div v-for="(item, index) in lastMeme.tags" :key="index" class="modern-tag">
                                    <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                    <span class="tag-label">{{ item.label }}</span>
                                </div>
                            </div>
                            <div class="copy-count">复制次数：{{ lastMeme.copy }}</div>
                        </div>
                    </template>
                    <span class="meme-text" :class="{ clicked: isClicked }" @click="handleCopyLatestMeme">{{ lastMeme.meme || '加载中…' }}</span>
                </ElTooltip>
            </div>
        </section>

        <el-divider class="module-divider" />

        <HomeSpotlight />
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { getMemeList } from '@/apis/getMeme';
import HomeSpotlight from '@/components/home/home-spotlight.vue';
import { easyFormatTime } from '@/utils/time';
import { useMemeTagsStore } from '@/stores/memeTags';
import type { getMemeTags as memeTag } from '@/types/meme';
import { useIsMobile } from '@/composables/useIsMobile';
import { getDisplayTags } from '@/utils/tags';
import { ElTooltip, ElNotification, ElDivider } from 'element-plus';
import { copyToClipboard } from '@/utils/clipboard';

const isMobile = useIsMobile();
const memeTagsStore = useMemeTagsStore();
const memeTags = ref<memeTag[]>([]);
memeTagsStore.tagsLoaded.then(() => {
    memeTags.value = memeTagsStore.memeTags;
});

const lastMeme = reactive({
    time: '',
    meme: '',
    tags: [{ label: '', iconUrl: '' }],
    copy: 0,
    total: 0,
});
const loaded = ref(false);
const formattedTotal = computed(() => (loaded.value ? lastMeme.total.toLocaleString('zh-CN') : '—'));

async function getLastMeme() {
    const res = await getMemeList('allbarrage', 1, 1);
    if (!res) return;
    lastMeme.time = easyFormatTime(res.memeArr[0].submitTime);
    lastMeme.meme = res.memeArr[0].content;
    lastMeme.tags = getDisplayTags(res.memeArr[0].tags, memeTags.value);
    lastMeme.copy = res.memeArr[0].copyCount;
    lastMeme.total = res.total;
    loaded.value = true;
}
getLastMeme();

const isClicked = ref(false);
function handleCopyLatestMeme() {
    if (!lastMeme.meme) return;
    copyToClipboard(lastMeme.meme);
    ElNotification({
        message: '复制成功',
        type: 'success',
    });
    isClicked.value = true;
    setTimeout(() => {
        isClicked.value = false;
    }, 1200);
}
</script>

<style scoped lang="scss">
.home-info-modules {
    .info-module {
        color: var(--body-color);
        font-size: 14px;
        line-height: 1.6;
    }

    :deep(.module-divider) {
        margin: 10px 0;
    }
}

.latest-module {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.total-link {
    color: var(--body-color) !important;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.25;
    text-decoration: none !important;

    &:hover .total-count {
        text-decoration: underline;
    }
}

.total-count {
    color: cadetblue;
    font-size: 1.25em;
}

.line-bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
}

.submit-time,
.copy-hint {
    margin: 0;
    font-size: 12px;
    opacity: 0.72;
}

.copy-hint {
    font-style: italic;
}

.meme-text {
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dashed;
    text-underline-offset: 2px;

    &:hover,
    &.clicked {
        color: #409eff;
    }
}

.tooltip-content {
    max-width: 480px;

    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 6px;
    }

    .modern-tag {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        background: var(--el-fill-color-light, #e7f6f3);
        border-radius: 50px;
        padding: 3px 6px;
        font-size: 12px;
        color: var(--el-color-primary);

        .tag-icon {
            width: 22px;
            height: 22px;
            object-fit: contain;
        }
    }

    .copy-count {
        font-size: 12px;
        color: var(--body-color);
    }
}
</style>
