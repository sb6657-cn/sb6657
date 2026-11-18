<template>
    <button ref="button" type="button" class="hot-meme-ticker" aria-label="查看近 24 小时热门烂梗" aria-haspopup="dialog" @click="hotMeme.open()">
        <img src="@/assets/imgs/hot.png" alt="" />
        <span class="ticker-window">
            <Transition name="ticker-roll">
                <span :key="current?.id" class="ticker-line">{{ current?.content || '近 24 小时烂梗' }}</span>
            </Transition>
        </span>
        <span class="ticker-link">看榜<ChevronRight :size="14" aria-hidden="true" /></span>
    </button>
</template>

<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useHotMemeStore } from '@/stores/useHotMemeStore';

const hotMeme = useHotMemeStore();
const button = ref<HTMLButtonElement | null>(null);
const index = ref(0);
const daily = computed(() => hotMeme.rankings['24h']);
const current = computed(() => daily.value[index.value] ?? daily.value[0]);
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
    void hotMeme.refresh('24h');
    timer = setInterval(() => {
        if (daily.value.length < 2 || hotMeme.visible || document.hidden) return;
        if (button.value?.matches(':focus-visible')) return;
        if (window.matchMedia('(hover: hover)').matches && button.value?.matches(':hover')) return;
        index.value = (index.value + 1) % daily.value.length;
    }, 5000);
});

onUnmounted(() => clearInterval(timer));
</script>

<style scoped lang="scss">
.hot-meme-ticker {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 326px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: #e4d6b8;
    font: inherit;
    text-align: left;
    cursor: pointer;

    html.dark & {
        color: var(--header-text);
    }
    img {
        flex: none;
        width: 26px;
        height: 26px;
    }
    &:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }
    @media (hover: hover) {
        &:hover .ticker-line,
        &:hover .ticker-link {
            text-decoration: underline;
            text-underline-offset: 3px;
        }
        &:hover .ticker-link svg {
            transform: translateX(2px);
        }
    }
    @media (max-width: 768px) {
        width: 100%;
        padding: 0 4px;
        // 贴在首页深色横幅上，沿用米色；--header-text 在浅色主题是深字，会糊进横幅
        color: #e4d6b8;

        img {
            width: 24px;
            height: 24px;
        }
    }
}
.ticker-window {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    line-height: 1.5;
}

.ticker-line {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.ticker-link {
    flex: none;
    display: inline-flex;
    align-items: center;
    padding-right: 2px;
    font-size: 0.85em;
    color: #ffd2a3;

    html.dark & {
        color: #edb58a;
    }

    svg {
        transition: transform 160ms ease-out;
    }
}

.ticker-roll-enter-active,
.ticker-roll-leave-active {
    transition: transform 280ms ease-in-out;
}
.ticker-roll-leave-active {
    position: absolute;
    inset: 0;
}
.ticker-roll-enter-from {
    transform: translateY(100%);
}
.ticker-roll-leave-to {
    transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
    .ticker-roll-enter-active,
    .ticker-roll-leave-active,
    .ticker-link svg {
        transition: none;
    }
}
</style>
