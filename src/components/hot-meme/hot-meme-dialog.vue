<template>
    <el-dialog v-model="hotMeme.visible" :title="title" draggable append-to-body width="min(96%, 1200px)" @open="loadShieldWords">
        <template #header="{ titleId }">
            <div class="dialog-header">
                <span :id="titleId">{{ title }}</span>
                <el-button @click="hotMeme.open(isDaily ? '7d' : '24h')">{{ isDaily ? '查看近七天热门' : '查看近24h热门' }}</el-button>
            </div>
        </template>
        <el-table v-loading="hotMeme.loading[hotMeme.period]" :data="hotMeme.rankings[hotMeme.period]" stripe :empty-text="hotMeme.failed[hotMeme.period] ? '热榜加载失败' : '暂无热门烂梗'" cell-class-name="hover-pointer" @row-click="copyMeme_countPlus1">
            <el-table-column align="center" width="60">
                <template #default="scope">
                    <el-tag round effect="plain">{{ scope.$index + 1 }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="content">
                <template #default="scope">
                    <el-popover placement="top" :width="'auto'" trigger="hover" :visible="scope.row.popoverVisible">
                        <template #reference>
                            <div style="cursor: pointer" @touchstart="handleTouchStart(scope.row)" @touchend="handleTouchEnd(scope.row)">
                                <TriangleAlert v-if="shieldWordStore.hasShieldWord(scope.row.content)" style="color: #e6a23c; flex-shrink: 0; margin-right: 4px;" :size="16" />
                                <span class="barrage-text">{{ scope.row.content }}</span>
                            </div>
                        </template>
                        <template #default>
                            <div class="meme-popover">
                                <div class="tags-container">
                                    <div v-for="(item, index) in getDisplayTags(scope.row.tags, memeTagsStore.memeTags)" :key="index" class="popover-tag">
                                        <el-tag round effect="dark" class="tag-item">
                                            <div class="tag-icon-wrapper">
                                                <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                                <span class="tag-label">{{ item.label }}</span>
                                            </div>
                                        </el-tag>
                                    </div>
                                    <span v-if="shieldWordStore.hasShieldWord(scope.row.content)" class="shield-word-text">
                                        <TriangleAlert :size="14" class="shield-word-icon" style="color: #e6a23c; margin-right: 2px;" />
                                        包含屏蔽词
                                    </span>
                                </div>
                                <div class="meme-meta">
                                    <span class="meta-id">#{{ scope.row.id }}</span>
                                    <span v-if="scope.row.hotDateTime" class="meta-time">🔥{{ easyFormatTime(scope.row.hotDateTime) }}</span>
                                </div>
                            </div>
                        </template>
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column align="center" width="100">
                <template #default="scope">
                    <el-button type="primary" class="copy-btn" @click.stop="copyMeme_countPlus1(scope.row)">
                        复制 (
                        <flip-num :num="scope.row.copyCount" />
                        )
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue';
import { copyCountPlus1, plus1Error } from '@/apis/setMeme';
import flipNum from '@/components/flip-num.vue';
import { useMemeTagsStore } from '@/stores/memeTags';
import { useShieldWordStore } from '@/stores/shieldWordStore';
import { copySuccess, copyToClipboard, limitedCopy } from '@/utils/clipboard';
import { recordOptimisticCopy } from '@/utils/copyTracker';
import { getDisplayTags } from '@/utils/tags';
import { throttle } from '@/utils/throttle';
import { easyFormatTime } from '@/utils/time';
import { computed } from 'vue';
import { useHotMemeStore } from '@/stores/useHotMemeStore';

const memeTagsStore = useMemeTagsStore();
const shieldWordStore = useShieldWordStore();
const hotMeme = useHotMemeStore();
const isDaily = computed(() => hotMeme.period === '24h');
const title = computed(() => (isDaily.value ? '24h热门烂梗' : '七天热门烂梗'));

// 2s节流。节流期间触发了就调第二个回调。表示2s内多次点击复制只取其中一次发请求给后台
const copyMeme = throttle(copyToClipboard, limitedCopy, 2000);

async function copyMeme_countPlus1(meme: Meme) {
    const memeText = meme.content;
    const res = copyMeme(memeText);
    if (!res || res === 'limitedSuccess') return;

    const nextCount = (Number(meme.copyCount) || 0) + 1;
    meme.copyCount = nextCount;
    recordOptimisticCopy(meme.id, nextCount);
    copySuccess();

    try {
        const ok = await copyCountPlus1(meme.category ?? '', meme.id);
        if (!ok) {
            plus1Error();
        }
    } catch (error) {
        console.error('更新复制计数失败:', error);
        plus1Error();
    }
}

type TouchRow = Meme & { touchStartTime?: number; popoverVisible?: boolean };

const handleTouchStart = (row: TouchRow) => {
    row.touchStartTime = Date.now();
};

const handleTouchEnd = (row: TouchRow) => {
    if (row.touchStartTime && Date.now() - row.touchStartTime > 100) {
        row.popoverVisible = true;
        setTimeout(() => {
            row.popoverVisible = false;
        }, 1500);
    }
};

async function loadShieldWords() {
    try {
        if (!shieldWordStore.loading && shieldWordStore.shieldWords.length === 0) {
            await shieldWordStore.setShieldWords();
        }
    } catch (error) {
        console.error('加载屏蔽词失败:', error);
    }
}
</script>

<style scoped lang="scss">
.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

:deep(.hover-pointer) {
    cursor: pointer;
}

.copy-btn {
    width: 90px;
}

.meme-popover {
    min-width: 220px;
    max-width: min(420px, 80vw);
    display: flex;
    flex-direction: column;
    gap: 6px;

    .tags-container {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .popover-tag {
            display: flex;

            .tag-item {
                font-size: 16px;
                cursor: pointer;

                .tag-icon-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .tag-icon {
                    width: 16px;
                    height: 16px;
                    object-fit: cover;
                    vertical-align: middle;
                }

                .tag-label {
                    vertical-align: middle;
                }
            }
        }
    }

    .meme-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px 10px;
        color: #909399;
        font-size: 12px;
        line-height: 1.5;

        .meta-id {
            color: #606266;
            font-weight: 600;
        }

        .meta-time {
            white-space: nowrap;
        }
    }

    .shield-word-text {
        display: inline-flex;
        align-items: center;
        color: #e6a23c;
        font-size: 14px;

        .shield-word-icon {
            margin-right: 2px;
            vertical-align: middle;
        }
    }
}
</style>
