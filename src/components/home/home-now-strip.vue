<template>
    <RouterLink class="card now-strip" to="/hotwall">
        <span class="strip-title">
            <img :src="hotwallIcon" class="strip-icon keep-color" alt="" />
            此刻
        </span>
        <span class="strip-status">{{ statusText }}</span>
        <span v-if="topCount !== null" class="strip-count">近 5 分钟 · {{ topCount }} 次</span>
        <span class="strip-go">去热度墙</span>
    </RouterLink>
</template>

<script setup lang="ts">
import hotwallIcon from '@/assets/icons/hotwall_icon.svg';
import { fetchHotwallSnapshot } from '@/utils/hotwallSnapshot';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const topMeme = ref('');
const topCount = ref<number | null>(null);
const loaded = ref(false);
let abort: AbortController | null = null;

const statusText = computed(() => {
    if (!loaded.value) {
        return '正在看此刻…';
    }
    return topMeme.value || '最近 5 分钟还没热起来';
});

onMounted(async () => {
    abort = new AbortController();
    const items = await fetchHotwallSnapshot({ signal: abort.signal });
    const first = items[0];
    if (first?.barrage) {
        topMeme.value = first.barrage;
        topCount.value = first.count;
    }
    loaded.value = true;
});

onUnmounted(() => {
    abort?.abort();
});
</script>

<style scoped lang="scss">
.now-strip {
    display: flex;
    width: 100%;
    align-items: baseline;
    gap: 10px;
    margin-top: 8px;
    color: inherit;
    text-decoration: none;

    &:hover {
        color: inherit;
    }

    &:hover .strip-title,
    &:hover .strip-go {
        color: var(--el-color-primary);
    }
}

.strip-title {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 6px;
    color: var(--body-color);
    font-size: 16px;
    font-weight: 600;
    transition: color 0.15s ease;
}

.strip-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
}

.strip-status {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
}

.strip-count {
    flex-shrink: 0;
    font-size: 12px;
    opacity: 0.72;
}

.strip-go {
    flex-shrink: 0;
    color: var(--el-color-primary);
    font-size: 13px;
    transition: color 0.15s ease;
}
</style>
