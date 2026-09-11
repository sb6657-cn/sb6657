<template>
    <div class="word-cloud-panel">
        <button type="button" class="word-cloud-title" title="刷新搜索词云" @click="refreshWordCloud">
            搜索词云
            <el-icon size="20" class="word-cloud-refresh-icon">
                <Refresh />
            </el-icon>
        </button>
        <Suspense>
            <template #default>
                <WordCloud ref="wordCloudRef" />
            </template>
            <template #fallback>
                <div class="word-cloud-loading">词云加载中...</div>
            </template>
        </Suspense>
    </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import { defineAsyncComponent, ref } from 'vue';

const WordCloud = defineAsyncComponent(() => import('@/components/wordCloud.vue'));
const wordCloudRef = ref<any>(null);

function refreshWordCloud() {
    wordCloudRef.value?.getData?.();
}
</script>

<style scoped lang="scss">
.word-cloud-panel {
    .word-cloud-title {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 6px;
        border: 1px solid rgba(64, 158, 255, 0.35);
        border-radius: 24px;
        background: var(--card-bg);
        box-shadow: 0 2px 10px rgba(100, 100, 111, 0.16);
        font-size: 16px;
        font-weight: 600;
        color: var(--body-color);
        margin: 0;
        cursor: pointer;

        &:hover {
            background: var(--el-fill-color-light, rgba(255, 255, 255, 0.92));
        }
    }

    .word-cloud-refresh-icon {
        color: #409eff;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            color: #66b1ff;
        }

        &.rotating {
            animation: rotate 0.6s linear;
        }
    }

    .word-cloud-loading {
        text-align: center;
        padding: 20px;
        color: #909399;

        html.dark & {
            color: var(--el-text-color-secondary);
        }
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
