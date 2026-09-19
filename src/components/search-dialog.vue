<template>
    <div>
        <el-dialog v-model="showDialog" draggable class="dialog-main" @closed="handleDialogClosed">
            <!-- Header -->
            <template #header>
                <span class="search-tips">烂梗搜索结果:</span>
            </template>

            <!-- 高级筛选 -->
            <div class="advanced-search">
                <div class="title">
                    <div class="title-left">
                        <span class="title-text">高级筛选</span>
                        <el-button text class="collapse-btn" @click="toggleAdvancedSearch">
                            <span class="collapse-text">{{ isAdvancedSearchCollapsed ? '展开' : '收起' }}</span>
                            <el-icon>
                                <component :is="isAdvancedSearchCollapsed ? 'ArrowDown' : 'ArrowUp'" />
                            </el-icon>
                        </el-button>
                        <el-button v-if="sortType === SortType.ID" text type="info" :size="isMobile ? 'small' : 'default'" @click="changeSortType(SortType.COPY)">
                            {{ isMobile ? '复制数排序' : '点击按复制次数排序' }}
                        </el-button>
                        <el-button v-else-if="sortType === SortType.COPY" text type="info" :size="isMobile ? 'small' : 'default'" @click="changeSortType(SortType.ID)">
                            {{ isMobile ? '时间排序' : '点击按id(时间)排序' }}
                        </el-button>
                    </div>
                    <el-button text type="danger" @click="clearAdvancedSearch">
                        {{ isMobile ? '清空筛选' : '清空已选高级搜索' }}
                    </el-button>
                </div>
                <transition name="collapse">
                    <div v-show="!isAdvancedSearchCollapsed" class="collapsible-content">
                        <div class="time-container">
                            <el-date-picker v-model="submitTime" class="time-picker" type="daterange" range-separator="到" value-format="YYYY-MM-DD" start-placeholder="起始" end-placeholder="结束" :disabled-date="disabledDate" />
                        </div>
                        <tag-selector v-model:selectedTags="selectedTags" :tags="allTags" />
                    </div>
                </transition>
            </div>

            <!-- Table -->
            <el-table :data="highlightedMemeArr" stripe cell-class-name="hover-pointer" row-key="id" :lazy="true">
                <!-- 自定义空状态插槽 -->
                <template #empty>
                    <div class="empty-state">
                        <el-icon v-if="!hasNoSearchResults" class="loading-icon">
                            <Loading />
                        </el-icon>
                        <span v-if="hasNoSearchResults" class="no-results-message">
                            <span>没有找到搜索结果。想要补充更多烂梗？欢迎</span>
                            <button type="button" class="submission-link" @click="openSubmissionFromSearch">点击投稿</button>
                        </span>
                        <span v-else>{{ emptyText }}</span>
                    </div>
                </template>
                <!-- 序号列 -->
                <el-table-column align="center" width="70">
                    <template #default="scope">
                        <div v-memo="[scope.$index]" class="row-number">{{ scope.row.id }}</div>
                    </template>
                </el-table-column>

                <!-- 内容列 -->
                <el-table-column prop="content">
                    <template #default="scope">
                        <el-popover placement="top" width="auto" trigger="hover">
                            <template #reference>
                                <div class="barrage-text" style="display: flex; align-items: center; gap: 4px">
                                    <el-icon v-if="hasShieldWordInContent(scope.row.content)" style="color: #e6a23c; flex-shrink: 0" size="large">
                                        <WarningFilled />
                                    </el-icon>
                                    <span v-html="scope.row.highlightedContent || scope.row.content"></span>
                                </div>
                            </template>
                            <template #default>
                                <div class="popover-details">
                                    <div class="tag-list">
                                        <div v-for="item in getDisplayTags(scope.row.tags, allTags)" :key="item.label">
                                            <el-tag round effect="dark" class="tag-item">
                                                <div class="tag-icon-wrapper">
                                                    <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                                    <span class="tag-label">{{ item.label }}</span>
                                                </div>
                                            </el-tag>
                                        </div>
                                        <!-- 屏蔽词提示 - 用小字显示在tag区域 -->
                                        <span v-if="hasShieldWordInContent(scope.row.content)" class="shield-word-text" style="font-size: 14px; color: #e6a23c; margin-left: 4px">
                                            <el-icon style="margin-right: 2px; vertical-align: middle">
                                                <Warning />
                                            </el-icon>
                                            包含屏蔽词
                                        </span>
                                    </div>
                                    <div class="submit-time">投稿时间: {{ easyFormatTime(scope.row.submitTime) }}</div>
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>

                <!-- 操作列 -->
                <el-table-column align="center" width="100">
                    <template #default="scope">
                        <div v-memo="[scope.row.id, scope.row.copyCount]">
                            <el-button type="primary" class="copy-btn" @click.stop="handleCopyMeme(scope.row)">
                                复制 (
                                <flip-num :num="scope.row.copyCount" />
                                )
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页组件 -->
            <div v-if="total > 0" class="pagination-container">
                <el-pagination v-model:current-page="currentPage" :page-size="PAGE_SIZE" :total="total" :layout="isMobile ? 'prev, pager, next' : 'total, prev, pager, next, jumper'" size="small" background />
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
// ==================== 导入依赖 ====================
import { searchMeme } from '@/apis/getMeme';
import { copyCountPlus1, plus1Error } from '@/apis/setMeme';
import flipNum from '@/components/flip-num.vue';
import tagSelector from '@/components/tag-selector.vue';
import { useMemeTagsStore } from '@/stores/memeTags';
import { useShieldWordStore } from '@/stores/shieldWordStore';
import { useSubmissionDialogStore } from '@/stores/useSubmissionDialogStore';
import { type getMemeTags as memeTag, SortType } from '@/types/meme';
import { copySuccess, copyToClipboard, limitedCopy } from '@/utils/clipboard';
import { useIsMobile } from '@/composables/useIsMobile';
import { getDisplayTags } from '@/utils/tags';
import { debounce, throttle } from '@/utils/throttle';
import { easyFormatTime } from '@/utils/time';
import { Loading, Warning } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
const shieldWordStore = useShieldWordStore();
const submissionDialogStore = useSubmissionDialogStore();

// ==================== 类型定义 ====================
interface LocalMeme extends Omit<Meme, 'category' | 'likes'> {
    highlightedContent?: string;
}

// ==================== Props & 组件配置 ====================
const showDialog = defineModel<boolean>();
const props = defineProps<{
    searchKey: string;
}>();
const isMobile = useIsMobile();

// ==================== Store 状态管理 ====================
const memeTagsStore = useMemeTagsStore();
const { memeTags } = storeToRefs(memeTagsStore);

// ==================== 搜索状态管理 ====================
const DEFAULT_EMPTY_TEXT = '正在搜索中...坐和放宽...';
const PAGE_SIZE = 20;

const memeArr = ref<LocalMeme[]>([]);
const loading = ref(false);
const emptyText = ref(DEFAULT_EMPTY_TEXT);
const sortType = ref<SortType>(SortType.ID);
const currentPage = ref(1);
const total = ref(0);
const openSubmissionAfterClose = ref(false);
const hasNoSearchResults = ref(false);

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

// 搜索状态重置
function resetSearchState() {
    memeArr.value = [];
    currentPage.value = 1;
    total.value = 0;
    emptyText.value = DEFAULT_EMPTY_TEXT;
    hasNoSearchResults.value = false;
}

// 搜索核心逻辑
async function performSearch(searchKey: string, sortType: SortType = SortType.ID, pageNum: number = 1, tags?: string[], timeRange?: [string, string]) {
    if (!searchKey.trim()) return;

    const { _failure, flatData } = await searchMeme({
        barrage: searchKey,
        sort: sortType,
        pageNum,
        tags: tags?.join(','),
        submitTime: timeRange,
        pageSize: PAGE_SIZE,
    });

    if (_failure || !flatData || flatData.list.length <= 0) {
        memeArr.value = [];
        total.value = 0;
        currentPage.value = 1;
        hasNoSearchResults.value = true;
        return;
    }

    hasNoSearchResults.value = false;
    total.value = flatData.total;
    currentPage.value = pageNum;
    memeArr.value = flatData.list.map((item) => ({
        id: item.id.toString(),
        content: item.barrage,
        tags: item.tags,
        submitTime: item.submitTime,
        copyCount: +item.cnt,
    }));
}

// 防抖搜索
const debouncedSearch = debounce(async (searchKey: string, sortType: SortType = SortType.ID, pageNum: number = 1, tags?: string[], timeRange?: [string, string]) => {
    if (!searchKey.trim()) return;
    loading.value = true;
    try {
        await performSearch(searchKey, sortType, pageNum, tags, timeRange);
    } finally {
        loading.value = false;
    }
}, 300);

// 排序类型切换
function changeSortType(type: SortType) {
    sortType.value = type;
}

function openSubmissionFromSearch() {
    openSubmissionAfterClose.value = true;
    showDialog.value = false;
}

function handleDialogClosed() {
    if (!openSubmissionAfterClose.value) return;

    openSubmissionAfterClose.value = false;
    submissionDialogStore.open();
}

// ==================== 高级搜索功能 ====================
const isAdvancedSearchCollapsed = ref(true);
const allTags = ref<memeTag[]>([]);
memeTagsStore.tagsLoaded.then(() => {
    allTags.value = memeTags.value;
});
const selectedTags = ref<memeTag[]>([]);
const submitTime = ref<[string, string] | undefined>();

// 高级搜索控制
function toggleAdvancedSearch() {
    isAdvancedSearchCollapsed.value = !isAdvancedSearchCollapsed.value;
}

function resetAdvancedSearch() {
    selectedTags.value = [];
    allTags.value = [...memeTags.value];
    submitTime.value = undefined;
}

function clearAdvancedSearch() {
    if (selectedTags.value.length === 0 && !submitTime.value) return;
    resetAdvancedSearch();
    // 触发搜索更新
    const tagArr: string[] = [];
    debouncedSearch(props.searchKey, sortType.value, 1, tagArr, undefined);
}

// 日期限制
function disabledDate(time: Date) {
    return time.getTime() < new Date('2024-09-24').getTime();
}

// ==================== 复制功能 ====================
const copyMeme = throttle(copyToClipboard, limitedCopy, 2000);

async function handleCopyMeme(meme: LocalMeme) {
    const copyResult = copyMeme(meme.content);
    if (!copyResult || copyResult === 'limitedSuccess') return;

    copySuccess();

    try {
        const success = await copyCountPlus1('', meme.id);
        if (success) {
            // 更新本地复制计数
            const targetIndex = memeArr.value.findIndex((item) => item.id === meme.id);
            if (targetIndex !== -1) {
                memeArr.value[targetIndex].copyCount += 1;
            }
        } else {
            plus1Error();
        }
    } catch (error) {
        console.error('更新复制计数失败:', error);
        plus1Error();
    }
}

// ==================== 工具函数 ====================
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== 计算属性 ====================
const highlightedMemeArr = computed(() => {
    if (!props.searchKey || !memeArr.value.length) return memeArr.value;

    const regex = new RegExp(escapeRegExp(props.searchKey), 'gi');
    return memeArr.value.map((meme) => ({
        ...meme,
        highlightedContent: meme.content.replace(regex, (match) => `<span class="search-hit">${match}</span>`),
    }));
});

// ==================== 监听器 ====================
// 监听对话框显示状态
watch(showDialog, (show) => {
    if (!show) {
        resetSearchState();
        resetAdvancedSearch();
    }
});

// 监听搜索关键词变化
watch(
    () => props.searchKey,
    (newVal) => {
        if (newVal.trim()) {
            resetSearchState();
            debouncedSearch(newVal);
        }
    },
    { immediate: true }
);

// 监听分页变化
watch(currentPage, (newVal, oldVal) => {
    if (newVal !== oldVal && props.searchKey.trim()) {
        const tagArr = selectedTags.value.map((t) => t.dictValue);
        debouncedSearch(props.searchKey, sortType.value, newVal, tagArr, submitTime.value);
    }
});

// 监听高级搜索条件变化
watch(
    [selectedTags, submitTime, sortType],
    ([tags, time, sort], [oldTags, oldTime, oldSort]) => {
        // 避免初始化时触发
        if (oldTags === undefined && oldTime === undefined && oldSort === undefined) return;

        resetSearchState();
        const tagArr = tags.map((t) => t.dictValue);
        debouncedSearch(props.searchKey, sort, 1, tagArr, time);
    },
    { deep: true }
);
</script>

<style scoped lang="scss">
// 根容器
:deep(.dialog-main) {
    width: 96%;
    max-width: 1200px;

    // Header 部分
    .search-tips {
        font-size: x-large;
    }

    // 高级筛选部分
    .advanced-search {
        border: 1px solid #e4e7ed;
        padding: 0 6px;
        background-color: var(--el-fill-color-light, #eee);

        html.dark & {
            border-color: var(--el-border-color);
        }

        .title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;

            .title-left {
                display: flex;
                align-items: center;
                gap: 4px;

                .title-text {
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--body-color);
                }

                .collapse-btn {
                    padding: 4px 8px;
                    min-height: auto;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #409eff;

                    .collapse-text {
                        font-size: 13px;
                    }

                    .el-icon {
                        font-size: 14px;
                    }

                    &:hover {
                        background-color: var(--el-color-primary-light-9, #ecf5ff);
                    }
                }
            }
        }

        // 折叠动画
        .collapse-enter-active,
        .collapse-leave-active {
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .collapse-enter-from,
        .collapse-leave-to {
            max-height: 0;
            opacity: 0;
            transform: translateY(-10px);
        }

        .collapse-enter-to,
        .collapse-leave-from {
            max-height: 500px;
            opacity: 1;
            transform: translateY(0);
        }

        .collapsible-content {
            overflow: hidden;

            .time-container {
                margin-bottom: 16px;

                .time-picker {
                    width: 100%;
                }
            }
        }
    }

    // Table 部分
    .el-table {
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 20px 0;
            color: var(--body-color);

            .loading-icon {
                font-size: 24px;
                animation: rotate 1s linear infinite;
            }

            .no-results-message {
                align-items: baseline;
                line-height: normal;
            }

            .submission-link {
                appearance: none;
                padding: 0;
                border: 0;
                background: transparent;
                color: var(--el-color-primary);
                font: inherit;
                line-height: inherit;
                cursor: pointer;
            }

            @keyframes rotate {
                from {
                    transform: rotate(0deg);
                }

                to {
                    transform: rotate(360deg);
                }
            }
        }

        .row-number {
            font-size: 20px;
            font-weight: 600;
            color: var(--body-color);
            line-height: 1;
            font-style: italic;
        }

        .barrage-text {
            width: 100%;
            cursor: pointer;
        }

        .copy-btn {
            width: 90px;
        }
    }

    // 分页组件
    .pagination-container {
        display: flex;
        justify-content: center;
        margin-top: 16px;
        padding: 0 16px;
    }
}

// Table 全局样式
:deep(.hover-pointer .cell) {
    cursor: pointer;
}

// Popover 内部样式
.popover-details {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .tag-list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .tag-item {
            font-size: 16px;
            cursor: pointer;

            .tag-icon-wrapper {
                height: 100%;
                width: 100%;
                display: flex;
                align-items: center;
                gap: 4px;
                cursor: pointer;

                .tag-icon {
                    width: 18px;
                    object-fit: cover;
                    vertical-align: middle;
                }

                .tag-label {
                    vertical-align: middle;
                }
            }
        }
    }

    .submit-time {
        color: var(--body-color);
        font-size: 14px;
    }
}

.barrage-text :deep(.search-hit) {
    background-color: yellow;
}

html.dark .barrage-text :deep(.search-hit) {
    background-color: var(--search-hit-bg, #8c6d1f);
    color: var(--body-color);
}
</style>
