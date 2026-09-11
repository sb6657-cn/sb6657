<template>
    <div ref="tabBarRef" class="tab">
        <div class="tab-container">
            <div v-for="item in MemeCategory" :key="item.path" :class="['tab1', { selected: item.path === route.path }]" @click="navigateTo(item.path)">
                {{ item.text }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { MemeCategory } from '@/constants/backend';
import { nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tabBarRef = ref<HTMLElement | null>(null);

async function scrollSelectedTabIntoView() {
    await nextTick();

    const tabBar = tabBarRef.value;
    const selectedTab = tabBar?.querySelector<HTMLElement>('.tab1.selected');
    if (!tabBar || !selectedTab) return;

    const tabBarRect = tabBar.getBoundingClientRect();
    const selectedTabRect = selectedTab.getBoundingClientRect();
    const isOutsideViewport = selectedTabRect.left < tabBarRect.left || selectedTabRect.right > tabBarRect.right;
    if (!isOutsideViewport) return;

    const targetLeft = tabBar.scrollLeft + selectedTabRect.left - tabBarRect.left;
    tabBar.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
}

watch(() => route.path, scrollSelectedTabIntoView, { immediate: true, flush: 'post' });

async function navigateTo(path: string) {
    if (path === route.path) {
        await scrollSelectedTabIntoView();
        return;
    }

    await router.push(path);
}
</script>

<style lang="scss" scoped>
.tab {
    display: flex;
    overflow-x: scroll;
    white-space: nowrap;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: darkgrey solid 1px;

    html.dark & {
        background-color: var(--header-bg);
        border-bottom-color: var(--header-border);
    }

    .tab-container {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 16px;
        padding: 4px 12px;
    }

    .tab1 {
        font-size: large;
        color: dimgray;
        position: relative;

        html.dark & {
            color: var(--header-text);
            opacity: 0.7;
        }
    }

    .selected {
        font-size: larger;
        color: #000;
        font-weight: bold;
        padding: 0 2px;

        html.dark & {
            color: var(--header-text);
            opacity: 1;
        }
    }

    .selected::after {
        content: '';
        width: 100%;
        height: 8px;
        background-color: #89cff0;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: -1;
    }
}
</style>
