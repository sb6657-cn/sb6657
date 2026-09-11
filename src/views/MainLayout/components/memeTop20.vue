<template>
    <div class="meme-container">
        <div class="header-section">
            <div class="header-content">
                <h1 class="title">{{ currentYear }} 年度TOP20烂梗</h1>
                <p class="subtitle">sb6657官方认证野榜</p>
            </div>
            <div class="header-action">
                <el-select v-model="currentYear" class="year-select" size="small" :teleported="false">
                    <el-option v-for="item in yearOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </div>
        </div>

        <div class="hint-bar">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            点击任意条目即可复制内容
        </div>

        <div class="meme-list">
            <div v-for="item in memeList" :key="item.rank" class="meme-item" @click="copyContent(item.content)">
                <div class="rank-column">
                    <span v-if="item.rank === 1" class="rank-icon">🥇</span>
                    <span v-else-if="item.rank === 2" class="rank-icon">🥈</span>
                    <span v-else-if="item.rank === 3" class="rank-icon">🥉</span>
                    <span v-else class="rank-number">{{ item.rank }}</span>
                </div>

                <div class="content-column">
                    <div v-if="item.award" class="award-badge">
                        <span class="award-icon">{{ item.awardIcon }}</span>
                        <span class="award-text">{{ item.award }}</span>
                    </div>
                    <p class="meme-text">{{ item.content }}</p>
                </div>

                <div class="action-column">
                    <el-icon class="copy-icon"><CopyDocument /></el-icon>
                </div>
            </div>

            <div v-if="memeList.length === 0" class="empty-state">
                <p>加载中...</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { CopyDocument, InfoFilled } from '@element-plus/icons-vue';
import { copyToClipboard } from '@/utils/clipboard';
import axios from 'axios';

interface MemeItem {
    rank: number;
    content: string;
    award?: string;
    awardIcon?: string;
}
interface YearConfig {
    label: string;
    value: number;
    json: string;
}

const currentYear = ref(2025);
const yearOptions: YearConfig[] = [
    { label: '2025年', value: 2025, json: 'memeTop20_2025.json' },
    { label: '2024年', value: 2024, json: 'memeTop20_2024.json' },
];
const memeList = ref<MemeItem[]>([]);
const isLoading = ref(false);

async function fetchMemeData(year: number) {
    const config = yearOptions.find((opt) => opt.value === year);
    if (!config) return;

    isLoading.value = true;
    memeList.value = [];
    try {
        const response = await axios.get(`https://sb6657oss.wishao.fun/${config.json}`);
        if (response.data) {
            memeList.value = response.data;
        }
    } catch (error) {
        console.error('Failed to load meme data:', error);
        ElMessage.error('数据加载失败');
    } 
    isLoading.value = false;
};

// 监听年份变化
watch(currentYear, (newYear) => {
    fetchMemeData(newYear);
});

// 初始化加载
onMounted(() => {
    fetchMemeData(currentYear.value);
});

const copyContent = async (text: string) => {
    const success = copyToClipboard(text);
    if (success) {
        ElMessage.success({
            message: '复制成功！',
            duration: 1500,
            grouping: true,
        });
    } else {
        ElMessage.error('复制失败，请手动复制');
    }
};
</script>

<style lang="scss" scoped>
.meme-container {
    max-width: 800px;
    margin: 20px auto;
    background: var(--el-fill-color-light, #f4f4f5); /* 类似纸张的灰白色，高对比度 */
    border-radius: 2px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    padding: 24px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

    /* 移动端适配：底部留出空间 */
    margin-bottom: 60px;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #303133;

    html.dark & {
        border-bottom-color: var(--header-border);
    }
}

.header-content {
    .title {
        font-size: 24px;
        font-weight: 900;
        color: #303133;
        margin: 0;
        letter-spacing: 1px;
        text-transform: uppercase;

        html.dark & {
            color: var(--body-color);
        }
    }

    .subtitle {
        font-size: 12px;
        color: #606266;
        margin: 8px 0 0;
        font-weight: 500;

        html.dark & {
            color: var(--el-text-color-secondary);
        }
    }
}

.header-action {
    .year-select {
        width: 100px;
    }
}

.hint-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e6e8eb;
    color: #606266;
    font-size: 12px;
    padding: 8px;
    margin-bottom: 16px;
    border-radius: 2px;
    font-weight: 500;

    html.dark & {
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
    }

    .hint-icon {
        margin-right: 4px;
        font-size: 14px;
    }
}

.meme-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.meme-item {
    display: flex;
    align-items: flex-start;
    background: var(--card-bg);
    border: 1px solid #dcdfe6;

    html.dark & {
        border-color: var(--el-border-color);
    }
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:active {
        background: var(--el-fill-color-light, #f0f2f5);
        transform: scale(0.99);
    }

    .rank-column {
        flex: 0 0 36px;
        margin-right: 12px;
        text-align: center;
        display: flex;
        justify-content: center;
        padding-top: 2px; /* 微调对齐 */

        .rank-number {
            font-size: 20px;
            font-weight: 800;
            color: #909399;
            font-style: italic;
            line-height: 1;
        }

        .rank-icon {
            font-size: 24px;
            line-height: 1;
        }
    }

    .content-column {
        flex: 1;
        min-width: 0; /* 防止文本溢出 */

        .award-badge {
            display: inline-flex;
            align-items: center;
            background: var(--el-fill-color-light, #fff6f6);
            color: #f56c6c;
            font-size: 12px;
            font-weight: bold;
            padding: 2px 6px;
            border: 1px solid #fab6b6;
            border-radius: 2px;
            margin-bottom: 6px;

            .award-icon {
                margin-right: 4px;
                font-size: 14px;
            }
        }

        .meme-text {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #303133;
            white-space: pre-wrap; /* 保留换行 */
            word-break: break-word;

            html.dark & {
                color: var(--body-color);
            }
        }
    }

    .action-column {
        flex: 0 0 24px;
        margin-left: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;

        .copy-icon {
            font-size: 18px;
            color: #909399;
        }
    }
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #909399;
    font-size: 14px;
}

/* 移动端适配优化 */
@media (max-width: 600px) {
    .meme-container {
        margin: 10px;
        padding: 16px 12px;
    }

    .meme-item {
        padding: 10px;
    }

    .rank-column {
        flex: 0 0 28px;
        margin-right: 8px;

        .rank-number {
            font-size: 18px;
        }
        .rank-icon {
            font-size: 20px;
        }
    }

    .meme-text {
        font-size: 13px;
    }

    .header-content {
        .title {
            font-size: 20px;
        }
    }
}
</style>
