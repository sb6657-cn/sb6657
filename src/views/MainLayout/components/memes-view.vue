<template>
    <div class="memes-view">
        <div class="card-table">
            <div class="card">
                <h4 class="tag-card-title">
                    按标签查看烂梗
                    <el-popover :width="300">
                        <template #reference>
                            <el-icon size="16">
                                <Warning />
                            </el-icon>
                        </template>
                        为解决烂梗分栏不足和分类不清晰问题。
                        <br />
                        <b>点击标签即可添加</b>
                    </el-popover>
                    <el-button class="tag-submit-btn" link type="success">
                        投稿标签
                        <el-popover :width="300">
                            <template #reference>
                                <el-icon size="16">
                                    <QuestionFilled />
                                </el-icon>
                            </template>
                            <b>功能待完善(后续更新将添加)，请在上方(建议/提交)问卷投稿，sry。</b>
                            <br />
                            <b>审核巨严格，(重复，相似等)将不通过</b>
                        </el-popover>
                    </el-button>
                </h4>
                <tag-selector v-model:selected-tags="selectedTags" :tags="allTags" />
            </div>
            <div class="top">
                <el-button class="meme-submit-btn" :icon="EditPen" @click="submissionDialogStore.open">烂梗投稿</el-button>
                <div class="sort-switch" role="group" aria-label="列表排序方式">
                    <button type="button" :class="['sort-option', { 'is-active': sortMode === 'time' }]" :aria-pressed="sortMode === 'time'" @click="changeSortMode('time')">最新投稿</button>
                    <button type="button" :class="['sort-option', { 'is-active': sortMode === 'copyCount' }]" :aria-pressed="sortMode === 'copyCount'" @click="changeSortMode('copyCount')">复制最多</button>
                </div>
            </div>

            <el-table v-loading="loading" class="main-table" :data="memeArr" :show-header="false" stripe cell-class-name="hover-pointer" empty-text="该标签组合为空，期待投稿！" @row-click="copyMeme_countPlus1">
                <el-table-column align="center" width="60">
                    <template #default="scope">
                        <el-tag round effect="plain">{{ scope.row.id }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="content">
                    <template #default="scope">
                        <el-popover placement="top" :width="'auto'" trigger="hover" :visible="scope.row.popoverVisible">
                            <template #reference>
                                <div class="meme-content" @touchstart="handleTouchStart(scope.row)" @touchend="handleTouchEnd(scope.row)">
                                    <el-icon v-if="hasShieldWordInContent(scope.row.content)" class="shield-warning-icon" size="large">
                                        <WarningFilled />
                                    </el-icon>
                                    <span class="barrage-text">{{ scope.row.content }}</span>
                                </div>
                            </template>
                            <template #default>
                                <div class="meme-popover">
                                    <div class="tags-container">
                                        <div v-for="item in getDisplayTags(scope.row.tags, allTags)" :key="item.label" class="popover-tag">
                                            <el-tag round effect="dark" class="tag-item">
                                                <div class="tag-icon-wrapper">
                                                    <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                                    <span class="tag-label">{{ item.label }}</span>
                                                </div>
                                            </el-tag>
                                        </div>
                                    </div>
                                    <!-- 屏蔽词提示 - 用小字显示在tag区域 -->
                                    <span v-if="hasShieldWordInContent(scope.row.content)" class="shield-word-text">
                                        <el-icon class="shield-word-icon">
                                            <Warning />
                                        </el-icon>
                                        包含屏蔽词
                                    </span>
                                    <div class="submit-time">投稿时间:{{ easyFormatTime(scope.row.submitTime) }}</div>
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column align="center" width="100">
                    <template #default="scope">
                        <el-button type="primary" class="copy-btn" @click.stop="copyMeme_countPlus1(scope.row)">
                            复制 🌈
                            <flip-num :num="scope.row.copyCount" />
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-wrapper">
                <el-pagination v-if="!loading" background layout="prev, pager, next, jumper" :size="isMobile ? 'small' : ''" :current-page="currentPage" :total="total" :pager-count="isMobile ? 4 : 5" :page-size="pageSize" @current-change="handlePageChange"></el-pagination>
            </div>
        </div>

        <el-backtop :right="50" :bottom="50">UP</el-backtop>
    </div>
</template>

<script setup lang="ts">
import { getMemeList, getMemeListByCopyCount } from '@/apis/getMeme';
import { copyCountPlus1, plus1Error } from '@/apis/setMeme';
import flipNum from '@/components/flip-num.vue';
import tagSelector from '@/components/tag-selector.vue';
import { useMemeTagsStore } from '@/stores/memeTags';
import { useShieldWordStore } from '@/stores/shieldWordStore';
import { useSubmissionDialogStore } from '@/stores/useSubmissionDialogStore';
import { type getMemeTags as memeTag } from '@/types/meme';
import { copySuccess, copyToClipboard, limitedCopy } from '@/utils/clipboard';
import { getDisplayTags } from '@/utils/tags';
import { throttle } from '@/utils/throttle';
import { easyFormatTime } from '@/utils/time';
import { EditPen, QuestionFilled, Warning, WarningFilled } from '@element-plus/icons-vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useIsMobile } from '@/composables/useIsMobile';

const memeTagsStore = useMemeTagsStore();
const shieldWordStore = useShieldWordStore();
const submissionDialogStore = useSubmissionDialogStore();
const route = useRoute();
const memeCategory = 'allbarrage';
const isMobile = useIsMobile();

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

const loading = ref(true);
const memeArr = ref<Meme[]>([]);

function getRouteTagValue() {
    const rawTag = route.query.tag;
    // 这里tag在url的格式是'01,02,03'，目前只取第一个
    if (typeof rawTag !== 'string') return '';
    return rawTag.split(',')[0];
}

const allTags = ref<memeTag[]>([]);
const pendingRouteTag = ref(getRouteTagValue());
const selectedTags = ref<memeTag[]>([]);
memeTagsStore.tagsLoaded.then(() => {
    allTags.value = memeTagsStore.memeTags;
    if (!pendingRouteTag.value) return;

    const routeTag = allTags.value.find((tag) => tag.dictValue === pendingRouteTag.value);
    if (routeTag) selectedTags.value.push(routeTag);
    pendingRouteTag.value = '';
});
const selectedTagsStr = computed(() => selectedTags.value.map((tag) => tag.dictValue).join(',') || pendingRouteTag.value);

type SortMode = 'time' | 'copyCount';

const sortMode = ref<SortMode>('time');
const pageSize = 50;
const currentPage = ref(1);
const total = ref(0);
let latestRequestId = 0;

async function loadMemes(pageNum: number) {
    const requestId = ++latestRequestId;
    currentPage.value = pageNum;
    loading.value = true;
    const res = sortMode.value === 'copyCount' ? await getMemeListByCopyCount(pageNum, pageSize, selectedTagsStr.value) : await getMemeList(memeCategory, pageNum, pageSize, selectedTagsStr.value || undefined);

    if (requestId !== latestRequestId) return;
    if (!res) {
        memeArr.value = [];
        total.value = 0;
        loading.value = false;
        return;
    }

    memeArr.value = res.memeArr;
    total.value = res.total;
    loading.value = false;
}

function changeSortMode(nextMode: SortMode) {
    if (sortMode.value === nextMode) return;
    sortMode.value = nextMode;
    void loadMemes(1);
}

function handlePageChange(page: number) {
    scrollToTop();
    void loadMemes(page);
}

watch(selectedTagsStr, () => {
    void loadMemes(1);
});

void loadMemes(1);

// 复制
// 2s节流。节流期间触发了就调第二个回调。表示2s内多次点击复制只取其中一次发请求给后台
const copyMeme = throttle(copyToClipboard, limitedCopy, 2000);
async function copyMeme_countPlus1(meme: Meme) {
    const memeText = meme.content;
    const res = copyMeme(memeText);
    if (!res || res === 'limitedSuccess') return;
    copySuccess();
    if (await copyCountPlus1(meme.category || memeCategory, meme.id)) {
        await loadMemes(currentPage.value);
        return;
    }
    plus1Error();
}

//移动端的触摸展示
function handleTouchStart(row: any) {
    row.touchStartTime = Date.now();
}
function handleTouchEnd(row: any) {
    const touchEndTime = Date.now();
    if (touchEndTime - row.touchStartTime > 100) {
        //100ms 长按时长
        row.popoverVisible = true;
        setTimeout(() => {
            row.popoverVisible = false;
        }, 1500);
    }
}

// 检查内容是否包含屏蔽词
function hasShieldWordInContent(content: string): boolean {
    if (!content || !shieldWordStore.shieldWords || shieldWordStore.shieldWords.length === 0) {
        return false;
    }
    return shieldWordStore.hasShieldWord(content);
}

// 回顶部
const scrollToTop = () => {
    window.scrollTo({
        // top: document.documentElement.offsetHeight, //回到底部
        top: 0, //回到顶部
        behavior: 'smooth', //smooth 平滑；auto:瞬间
    });
};
</script>

<style scoped lang="scss">
.memes-view {
    width: 93%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;

    .card-table {
        width: 100%;
        max-width: 1400px;

        .card {
            border-radius: 5px 5px 0 0;

            .tag-card-title {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;

                .tag-submit-btn {
                    margin-left: auto;
                }
            }
        }

        .top {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            padding: 10px;
            background-color: var(--card-bg);

            .meme-submit-btn {
                --el-button-text-color: #d95783;
                --el-button-bg-color: #fff5f8;
                --el-button-border-color: #f5bfd0;
                --el-button-hover-text-color: #c93e6c;
                --el-button-hover-bg-color: #ffeaf1;
                --el-button-hover-border-color: #fb7299;
                --el-button-active-text-color: #b93461;
                --el-button-active-bg-color: #ffdde8;
                --el-button-active-border-color: #e95a88;
                --el-button-outline-color: rgba(251, 114, 153, 0.35);

                html.dark & {
                    --el-button-text-color: #ff9fbd;
                    --el-button-bg-color: #3a2430;
                    --el-button-border-color: #fb7299;
                    --el-button-hover-text-color: #fff;
                    --el-button-hover-bg-color: #4a2c3a;
                    --el-button-hover-border-color: #ff85ad;
                    --el-button-active-text-color: #fff;
                    --el-button-active-bg-color: #5a3344;
                    --el-button-active-border-color: #fb7299;
                }
                height: 36px;
                flex-shrink: 0;
                padding: 0 12px;
                border-radius: 8px;
                font-weight: 600;
            }

            .sort-switch {
                display: inline-flex;
                align-items: center;
                gap: 2px;
                margin-left: auto;
                padding: 3px;
                border-radius: 6px;
                background: var(--el-fill-color-light);
                white-space: nowrap;
            }

            .sort-option {
                appearance: none;
                min-height: 30px;
                padding: 0 10px;
                border: 0;
                border-radius: 4px;
                background: transparent;
                color: var(--el-text-color-regular);
                font: inherit;
                font-weight: 400;
                line-height: 1.2;
                cursor: pointer;
                transition:
                    color 0.2s,
                    background-color 0.2s,
                    box-shadow 0.2s;

                &:hover,
                &:focus-visible {
                    color: var(--el-color-primary);
                }

                &:focus-visible {
                    outline: 2px solid var(--el-color-primary-light-5);
                    outline-offset: 2px;
                }

                &.is-active {
                    background: var(--card-bg);
                    color: var(--el-color-primary);
                    font-weight: 600;
                    box-shadow: 0 1px 4px rgba(31, 45, 61, 0.12);
                }
            }
        }

        .main-table {
            .meme-content {
                display: flex;
                align-items: center;
                gap: 4px;
                cursor: pointer;

                .shield-warning-icon {
                    flex-shrink: 0;
                    color: #e6a23c;
                }

                .barrage-text {
                    min-width: 0;
                    overflow-wrap: anywhere;
                }
            }

            :deep(.hover-pointer) {
                cursor: pointer;
            }

            .copy-btn {
                width: 90px;
            }
        }

        .pagination-wrapper {
            display: flex;
            justify-content: center;
            margin-top: 16px;
            margin-bottom: 40px;
        }
    }
}

.meme-popover {
    .tags-container {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .popover-tag {
            display: flex;

            .tag-item {
                font-size: 16px;
                cursor: pointer;

                .tag-icon-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .tag-icon {
                    height: 22px;
                    object-fit: cover;
                    vertical-align: middle;
                }

                .tag-label {
                    vertical-align: middle;
                }
            }
        }
    }

    .shield-word-text {
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        font-size: 14px;
        color: #e6a23c;

        .shield-word-icon {
            margin-right: 2px;
        }
    }

    .submit-time {
        font-size: 11px;
    }
}

@media (min-width: 600px) {
    .memes-view {
        .main-table {
            font-size: large;
        }
    }
}

@media (max-width: 601px) {
    .memes-view {
        width: 100%;

        .tag-card-title {
            .tag-submit-btn {
                margin-left: 0;
            }
        }

        .top {
            padding: 8px;

            .sort-option {
                padding: 0 8px;
                font-size: 12px;
            }
        }

        .main-table {
            font-size: medium;
        }
    }
}
</style>
