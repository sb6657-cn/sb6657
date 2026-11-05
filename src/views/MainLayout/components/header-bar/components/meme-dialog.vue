<template>
    <div>
        <el-dialog v-model="showDialog" draggable append-to-body width="min(96%, 1200px)">
            <template #header>
                <slot></slot>
            </template>
            <el-table v-loading="loading" :data="memeArr" stripe :empty-text="emptyText" cell-class-name="hover-pointer" @row-click="copyMeme_countPlus1">
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
                                    <TriangleAlert v-if="hasShieldWordInContent(scope.row.content)" style="color: #e6a23c; flex-shrink: 0; margin-right: 4px;" :size="16" />
                                    <span class="barrage-text">{{ scope.row.content }}</span>
                                </div>
                            </template>
                            <template #default>
                                <div class="meme-popover">
                                    <div class="tags-container">
                                        <div v-for="(item, index) in getDisplayTags(scope.row.tags, dictData)" :key="index" class="popover-tag">
                                            <el-tag round effect="dark" class="tag-item">
                                                <div class="tag-icon-wrapper">
                                                    <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                                    <span class="tag-label">{{ item.label }}</span>
                                                </div>
                                            </el-tag>
                                        </div>
                                        <span v-if="hasShieldWordInContent(scope.row.content)" class="shield-word-text">
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
                <!-- <el-table-column align="center" width="40">
                    <template #default="scope">
                        <LikeNum :likeCount="scope.row.likes" @click.stop="likeMeme_countPlus1(scope.row)"/>
                    </template>
                </el-table-column> -->
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
    </div>
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
import { onMounted, ref } from 'vue';

const memeTagsStore = useMemeTagsStore();
const shieldWordStore = useShieldWordStore();


/**
 * 组件输入:
 * 1.插槽，弹窗头部的内容。主要是描述，标题，切换其他弹窗按钮之类的。(注意，我把对话框的title删了，因为插槽放在header，设置插槽就行，会覆盖title)
 * 2.v-model，控制提示框的展示与否。注意这是个v-model，父组件要用v-model绑定。vue3.4新增的语法
 * 3.memeArr，烂梗数组
 * 4.loading，是否加载中
 * 5.emptyText，加载中或者为空时候的提示词
 * 6.refresh，刷新函数，其实就是获取此烂梗的函数，这里复制完调用一次，刷新+1结果
 */
const showDialog = defineModel({ type: Boolean, default: false });
defineProps<{
    memeArr: Meme[];
    loading: boolean;
    emptyText: string;
}>();
const emit = defineEmits<{
    refresh: [];
}>();

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

const dictData = ref<any>([]);
memeTagsStore.tagsLoaded.then(() => {
    dictData.value = memeTagsStore.memeTags;
});

//移动端的触摸展示
const handleTouchStart = (row: any) => {
    row.touchStartTime = Date.now();
};

const handleTouchEnd = (row: any) => {
    const touchEndTime = Date.now();
    if (touchEndTime - row.touchStartTime > 100) {
        //100ms 长按时长
        row.popoverVisible = true;
        setTimeout(() => {
            row.popoverVisible = false;
        }, 1500);
    }
};

//初始化屏蔽词数据
onMounted(async () => {
    try {
        //如果屏蔽词数据为空，尝试加载
        if (shieldWordStore.shieldWords.length === 0) {
            await shieldWordStore.setShieldWords();
        }
    } catch (error) {
        console.error('加载屏蔽词失败:', error);
    }
});
// 检查内容是否包含屏蔽词
function hasShieldWordInContent(content: string): boolean {
    if (!content || !shieldWordStore.shieldWords || shieldWordStore.shieldWords.length === 0) {
        return false;
    }
    return shieldWordStore.hasShieldWord(content);
}
</script>

<style scoped lang="scss">
:deep(.hover-pointer) {
    cursor: pointer;
}

.index {
    font-size: large;
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
