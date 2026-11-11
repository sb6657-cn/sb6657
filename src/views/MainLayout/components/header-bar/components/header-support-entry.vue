<template>
    <el-popover :visible="hintVisible" placement="bottom" width="auto" :offset="8" popper-class="header-support-hint">
        <template #reference>
            <button type="button" class="support-button" :class="{ compact }" aria-label="赞赏支持" aria-haspopup="dialog" @click="sponsorDialog.open">
                <img src="https://cdn.hguofichp.cn/power.png" alt="" />
            </button>
        </template>
        <button type="button" class="hint-content" @mouseenter="pauseHint" @mouseleave="dismissSoon" @focus="pauseHint" @blur="dismissSoon" @click="sponsorDialog.open">
            <span aria-hidden="true">⚡</span>
            记录你的赞赏动态
        </button>
    </el-popover>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useSponsorDialogStore } from '@/stores/useSponsorDialogStore';

defineProps<{ compact?: boolean }>();

const sponsorDialog = useSponsorDialogStore();
const hintVisible = ref(false);
let hintTimer: ReturnType<typeof setTimeout>;
let firstDialogTimer: ReturnType<typeof setTimeout>;
let repeatDialogTimer: ReturnType<typeof setInterval>;

function pauseHint() {
    clearTimeout(hintTimer);
}

function scheduleHint(delay: number) {
    pauseHint();
    hintTimer = setTimeout(() => {
        hintVisible.value = true;
        hintTimer = setTimeout(hideHint, 30_000);
    }, delay);
}

function hideHint() {
    hintVisible.value = false;
    pauseHint();
    if (!sponsorDialog.visible) scheduleHint((90 + Math.floor(Math.random() * 31)) * 1000);
}

function dismissSoon() {
    if (!hintVisible.value) return;
    pauseHint();
    hintTimer = setTimeout(hideHint, 2500);
}

watch(() => sponsorDialog.visible, hideHint);

onMounted(() => {
    if (!sponsorDialog.visible) scheduleHint(5000);
    firstDialogTimer = setTimeout(() => {
        sponsorDialog.open();
        repeatDialogTimer = setInterval(sponsorDialog.open, 30 * 60_000);
    }, 20 * 60_000);
});

onUnmounted(() => {
    pauseHint();
    clearTimeout(firstDialogTimer);
    clearInterval(repeatDialogTimer);
});
</script>

<style scoped lang="scss">
.support-button,
.hint-content {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}
.support-button {
    display: inline-flex;
    flex: none;
    height: 32px;
    margin-right: 15px;

    img {
        height: 100%;
        width: auto;
    }
    &.compact {
        height: 24px;
        margin-right: 0;
    }
}
.hint-content {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    color: white;
    font: 600 15px/1.2 'Microsoft YaHei', Arial, sans-serif;
    white-space: nowrap;
}
</style>

<style lang="scss">
.el-popover.el-popper.header-support-hint {
    --el-popover-bg-color: #ff7744;
    --el-popover-border-color: #ff7744;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: linear-gradient(135deg, #ee795f, #ff7744);
    box-shadow: 0 4px 12px rgb(255 85 46 / 28%);

    .el-popper__arrow::before {
        background: var(--el-popover-bg-color);
        border-color: var(--el-popover-border-color);
    }
}
</style>
