<template>
    <div
        class="merge-pig-launcher"
        :class="{ 'launcher-visible': isVisible }"
        ref="launcherRef"
        @mousedown="startDrag"
    >
        <!-- 游戏图片 -->
        <img
            class="launcher-img"
            src="https://pic1.imgdb.cn/i/0342NkfoYEaihxnuIPWrXk.png"
            alt="合成大猪头"
            @click="openDialog"
            draggable="false"
        >
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { mergePigDialogVisible } from './state';

const isVisible = ref(true);
const launcherRef = ref<HTMLElement | null>(null);

let isDragging = false;
let startY = 0;
let startTop = 0;
let dragHandler: ((e: MouseEvent) => void) | null = null;
let upHandler: (() => void) | null = null;

const openDialog = () => {
    mergePigDialogVisible.value = true;
};

const closeLauncher = () => {
    isVisible.value = false;
};

const startDrag = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('close-btn')) return;
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
const handleClick = (e: MouseEvent) => {
    // 如果只是点击（没有拖动），打开游戏
    if (!isDragging) {
        mergePigDialogVisible.value = true;
    }
};

onMounted(() => {
    // 初始位置：右侧边缘，垂直居中
    const launcher = launcherRef.value;
    if (launcher) {
        launcher.style.top = `calc(50% - 55px)`;
        launcher.style.right = '0';
    }
});

onBeforeUnmount(() => {
    if (dragHandler) document.removeEventListener('mousemove', dragHandler);
    if (upHandler) document.removeEventListener('mouseup', upHandler);
});
</script>

<style scoped lang="scss">
.merge-pig-launcher {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 110px;
    height: 110px;
    z-index: 1000;
    cursor: move;
    user-select: none;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-50%) scale(1.05);
    }

    &.launcher-hidden {
        display: none;
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

.close-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #666;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10;
    border: 2px solid #fff;

    html.dark & {
        background: var(--card-bg);
        border-color: var(--el-border-color);
        color: var(--el-text-color-regular);
    }

    &:hover {
        color: #f00;
        background: #fff5f5;
    }

    svg {
        width: 14px;
        height: 14px;
    }
}

@media (max-width: 600px) {
    .merge-pig-launcher {
        width: 65px;
        height: 65px;
    }

    .launcher-img {
        width: 65px;
        height: 65px;
    }

    .close-btn {
        width: 18px;
        height: 18px;
        top: -8px;
        right: -8px;

        svg {
            width: 12px;
            height: 12px;
        }
    }
}
</style>