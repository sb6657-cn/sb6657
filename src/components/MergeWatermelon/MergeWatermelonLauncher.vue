<template>
    <div
        class="merge-watermelon-launcher"
        :class="{ 'launcher-visible': isVisible }"
        ref="launcherRef"
        @mousedown="startDrag"
    >
        <span class="launcher-bubble">有人想合成软软的西瓜吗</span>
        <img
            class="launcher-img"
            :src="iconDataUri"
            alt="合成流心西瓜"
            @click="openDialog"
            draggable="false"
        >
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { mergeWatermelonDialogVisible } from './state';

const isVisible = ref(true);
const launcherRef = ref<HTMLElement | null>(null);

const iconDataUri =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    "<defs><radialGradient id='g' cx='50%' cy='40%' r='65%'>" +
    "<stop offset='0%' stop-color='%23ff8aa6'/>" +
    "<stop offset='60%' stop-color='%23d63a64'/>" +
    "<stop offset='100%' stop-color='%237a1632'/>" +
    "</radialGradient></defs>" +
    "<rect width='100' height='100' rx='18' fill='url(%23g)'/>" +
    "<text x='50' y='72' text-anchor='middle' font-size='62'>🍉</text>" +
    "</svg>";

let isDragging = false;
let startY = 0;
let startTop = 0;
let dragHandler: ((e: MouseEvent) => void) | null = null;
let upHandler: (() => void) | null = null;

const openDialog = () => {
    mergeWatermelonDialogVisible.value = true;
};

const startDrag = (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    startY = e.clientY;
    const launcher = launcherRef.value;
    if (launcher) {
        const rect = launcher.getBoundingClientRect();
        startTop = rect.top;
    }

    dragHandler = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        const newTop = Math.max(0, Math.min(window.innerHeight - 110, startTop + deltaY));
        if (launcherRef.value) {
            launcherRef.value.style.top = `${newTop}px`;
            launcherRef.value.style.right = '0';
            launcherRef.value.style.bottom = 'auto';
        }
    };

    upHandler = () => {
        isDragging = false;
    };

    document.addEventListener('mousemove', dragHandler);
    document.addEventListener('mouseup', upHandler);
};

onMounted(() => {
    const launcher = launcherRef.value;
    if (launcher) {
        launcher.style.top = `calc(50% - 125px)`;
        launcher.style.right = '0';
    }
});

onBeforeUnmount(() => {
    if (dragHandler) document.removeEventListener('mousemove', dragHandler);
    if (upHandler) document.removeEventListener('mouseup', upHandler);
});
</script>

<style scoped lang="scss">
.merge-watermelon-launcher {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 110px;
    height: 110px;
    z-index: 1000;
    cursor: pointer;
    user-select: none;
    border-radius: 8px;
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-50%) scale(1.05);
    }
}

/* 入口上方的提醒气泡 */
.launcher-bubble {
    position: absolute;
    bottom: calc(100% + 12px);
    right: 4px;
    padding: 8px 13px;
    border-radius: 14px;
    background: var(--card-bg, #fff);
    color: #2b2b2b;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    border: 1px solid rgba(214, 58, 100, 0.28);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
    pointer-events: none;
    animation: bubble-float 2.6s ease-in-out infinite;

    /* 指向入口的小尾巴 */
    &::after {
        content: '';
        position: absolute;
        top: 100%;
        right: 44px;
        border: 7px solid transparent;
        border-top-color: var(--card-bg, #fff);
    }

    html.dark & {
        color: var(--el-text-color-primary, #eee);
        border-color: var(--el-border-color, rgba(255, 255, 255, 0.2));
    }
}

@keyframes bubble-float {
    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-4px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .launcher-bubble {
        animation: none;
    }
}

.launcher-img {
    width: 110px;
    height: 110px;
    object-fit: cover;
    display: block;
    border-radius: 8px;
    cursor: pointer;
}

@media (max-width: 600px) {
    .merge-watermelon-launcher {
        width: 65px;
        height: 65px;
    }

    .launcher-bubble {
        padding: 6px 10px;
        font-size: 11px;
        right: 0;

        &::after {
            right: 26px;
            border-width: 5px;
        }
    }

    .launcher-img {
        width: 65px;
        height: 65px;
    }
}
</style>
