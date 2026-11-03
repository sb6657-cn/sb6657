<template>
    <div class="support-entry-wrapper">
        <slot :open="openSupportDialog" />

        <!-- 闪电图标下方时不时弹出的气泡提示 -->
        <Transition name="bubble-pop">
            <div
                v-if="bubbleVisible"
                class="sponsor-hint-bubble"
                @click="onBubbleClick"
                @mouseenter="onBubbleMouseEnter"
                @mouseleave="onBubbleMouseLeave"
            >
                <div class="bubble-arrow"></div>
                <div class="bubble-content">
                    <span class="bubble-sparkle">⚡</span>
                    <span class="bubble-text">记录你的赞赏动态</span>
                </div>
            </div>
        </Transition>

        <SponsorModal v-model="dialogVisible" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import SponsorModal from '@/components/SponsorModal.vue';

defineProps<{
    dialogWidth?: string;
}>();

const bubbleVisible = ref(false);
const dialogVisible = ref(false);

// 气泡提醒相关定时器
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let nextTimer: ReturnType<typeof setTimeout> | undefined;

// 全屏弹窗相关定时器（初次 30min，后面每 1h）
let firstOpenTimer: ReturnType<typeof setTimeout> | undefined;
let repeatOpenTimer: ReturnType<typeof setInterval> | undefined;

function getRandomInterval(): number {
    // 60 秒到 90 秒之间的随机周期毫秒数
    const min = 90;
    const max = 120;
    const seconds = Math.floor(Math.random() * (max - min + 1)) + min;
    return seconds * 1000;
}

function scheduleNextBubble() {
    if (nextTimer) clearTimeout(nextTimer);
    const delay = getRandomInterval();
    nextTimer = setTimeout(() => {
        showBubbleBriefly();
    }, delay);
}

function openSupportDialog() {
    dialogVisible.value = true;
    bubbleVisible.value = false;
    scheduleNextBubble();
}

function onBubbleClick() {
    openSupportDialog();
}

function showBubbleBriefly() {
    bubbleVisible.value = true;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        bubbleVisible.value = false;
        scheduleNextBubble();
    }, 30000); // 浮现展示 6 秒后平滑隐去，进入 180~500 秒随机周期倒计时
}

function onBubbleMouseEnter() {
    if (hideTimer) clearTimeout(hideTimer);
}

function onBubbleMouseLeave() {
    hideTimer = setTimeout(() => {
        bubbleVisible.value = false;
        scheduleNextBubble();
    }, 2500);
}

onMounted(() => {
    // 轻量气泡逻辑：初次进站 5 秒后轻量浮现一次，之后每隔 180~500 秒随机周期循环
    showTimer = setTimeout(() => {
        showBubbleBriefly();
    }, 5000);
    firstOpenTimer = setTimeout(
        () => {
            dialogVisible.value = true;
            bubbleVisible.value = false;
            repeatOpenTimer = setInterval(
                () => {
                    dialogVisible.value = true;
                    bubbleVisible.value = false;
                },
                30 * 60 * 1000 // 后面每 30 分钟
            );
        },
        20 * 60 * 1000 // 初次进站 20 分钟
    );
});

onUnmounted(() => {
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
    if (nextTimer) clearTimeout(nextTimer);
    if (firstOpenTimer) clearTimeout(firstOpenTimer);
    if (repeatOpenTimer) clearInterval(repeatOpenTimer);
});
</script>

<style scoped lang="scss">
.support-entry-wrapper {
    display: inline-flex;
    align-items: center;
    position: relative;
    user-select: none;
}

/* 闪电下方提示气泡 */
.sponsor-hint-bubble {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1005;
    white-space: nowrap;
    cursor: pointer;
    filter: drop-shadow(0 4px 12px rgba(255, 85, 46, 0.28));

    @media (max-width: 640px) {
        left: auto;
        right: -8px;
        transform: none;

        .bubble-arrow {
            left: auto;
            right: 22px;
            transform: none;
        }
    }

    .bubble-arrow {
        position: absolute;
        top: -5px;
        left: 45%;
        transform: translateX(-45%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid #ff552e;
    }

    .bubble-content {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #ee795f 0%, #ff7744 100%);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 15px;
        font-weight: 600;
        font-family: Microsoft YaHei, Arial, sans-serif;
        letter-spacing: 0.3px;
        box-shadow: 0 2px 8px rgba(253, 253, 253, 0.35);
        transition: transform 0.15s ease, box-shadow 0.15s ease;

        &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 14px rgba(255, 85, 46, 0.5);
        }

        .bubble-sparkle {
            font-size: 15px;
            animation: pulse-sparkle 1.6s ease infinite;
        }

        .bubble-text {
            line-height: 1.2;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
    }
}

@keyframes pulse-sparkle {
    0%, 100% {
        transform: scale(1);
        opacity: 0.9;
    }
    50% {
        transform: scale(1.25);
        opacity: 1;
    }
}

/* 进出过渡动画 */
.bubble-pop-enter-active,
.bubble-pop-leave-active {
    transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-pop-enter-from,
.bubble-pop-leave-to {
    opacity: 0;
    transform: translate(-50%, -6px) scale(0.85);

    @media (max-width: 640px) {
        transform: translateY(-6px) scale(0.85);
    }
}
</style>
