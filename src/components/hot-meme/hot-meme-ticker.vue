<template>
    <button type="button" class="hot-meme-ticker" aria-label="查看近 24 小时热门烂梗" aria-haspopup="dialog" @click="hotMeme.open()">
        <img src="@/assets/imgs/hot.png" alt="" />
        <Transition name="hot-meme-fade" mode="out-in">
            <span :key="current?.id">热门：{{ current?.content }}</span>
        </Transition>
    </button>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useHotMemeStore } from '@/stores/useHotMemeStore';

const hotMeme = useHotMemeStore();
const index = ref(0);
const daily = computed(() => hotMeme.rankings['24h']);
const current = computed(() => daily.value[index.value] ?? daily.value[0]);
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
    void hotMeme.refresh('24h');
    timer = setInterval(() => {
        if (daily.value.length) index.value = (index.value + 1) % daily.value.length;
    }, 5000);
});

onUnmounted(() => clearInterval(timer));
</script>

<style scoped lang="scss">
.hot-meme-ticker {
    display: flex;
    align-items: center;
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
    span {
        overflow: hidden;
        border-bottom: 1px solid currentColor;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    @media (max-width: 600px) {
        width: 100%;
        gap: 4px;
        padding: 0 4px;
        color: var(--header-text);

        img {
            width: 24px;
            height: 24px;
        }
        span {
            border-bottom: 0;
        }
    }
}
.hot-meme-fade-enter-active,
.hot-meme-fade-leave-active {
    transition: opacity 0.5s;
}
.hot-meme-fade-enter-from,
.hot-meme-fade-leave-to {
    opacity: 0;
}
</style>
