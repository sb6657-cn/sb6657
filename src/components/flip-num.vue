<template>
    <span class="flip-num-wrapper">
        <span class="container">
            <div class="place-holder">{{ numValue }}</div>
            <div :key="numValue" class="flip" :class="{ rolling: previousNum !== numValue, shrinking: numValue < previousNum }">
                <div>{{ previousNum }}</div>
                <div>{{ numValue }}</div>
            </div>
        </span>
        <span v-if="showPlusOne" :key="plusOneKey" class="plus-one-badge">+1</span>
    </span>
</template>

<script setup lang="ts">
import { watch, ref, computed, onBeforeUnmount } from 'vue';

const props = withDefaults(
    defineProps<{
        num: number | string;
        showPlus?: boolean;
    }>(),
    {
        showPlus: true,
    }
);

// 将传入的num统一转换为number类型
const numValue = computed(() => {
    return typeof props.num === 'string' ? Number(props.num) : props.num;
});

const previousNum = ref(numValue.value);
const showPlusOne = ref(false);
const plusOneKey = ref(0);
let plusTimer: ReturnType<typeof setTimeout> | null = null;

function triggerPlusAnimation() {
    if (!props.showPlus) return;
    plusOneKey.value++;
    showPlusOne.value = true;
    if (plusTimer) clearTimeout(plusTimer);
    plusTimer = setTimeout(() => {
        showPlusOne.value = false;
    }, 850);
}

defineExpose({
    triggerPlus: triggerPlusAnimation,
});

watch(numValue, (current, previous) => {
    previousNum.value = previous;
    if (current > previous && current - previous <= 10) triggerPlusAnimation();
});

onBeforeUnmount(() => {
    if (plusTimer) clearTimeout(plusTimer);
});
</script>

<style scoped lang="scss">
.flip-num-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
}

.container {
    height: 14px;
    position: relative;
    overflow: hidden;
    .place-holder {
        opacity: 0;
    }
    .flip {
        position: absolute;
        top: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .rolling {
        animation: flip-number 0.5s ease forwards;
    }
    .shrinking {
        align-items: flex-start;
    }
}

@keyframes flip-number {
    from { transform: translateY(0); }
    to { transform: translateY(-50%); }
}

@media (prefers-reduced-motion: reduce) {
    .container .rolling {
        animation: none;
        transform: translateY(-50%);
    }
}

.plus-one-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    pointer-events: none;
    user-select: none;
    z-index: 20;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    padding: 2px 5px;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
    box-shadow: 0 3px 8px rgba(255, 71, 87, 0.45);
    animation: plusOnePop 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes plusOnePop {
    0% {
        opacity: 0;
        transform: translate3d(-50%, 6px, 0) scale(0.4);
    }
    20% {
        opacity: 1;
        transform: translate3d(-50%, -4px, 0) scale(1.15);
    }
    50% {
        opacity: 1;
        transform: translate3d(-50%, -14px, 0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate3d(-50%, -24px, 0) scale(0.85);
    }
}
</style>
