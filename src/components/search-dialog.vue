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
                        <el-button text class="collapse-btn" @click="isAdvancedSearchCollapsed = !isAdvancedSearchCollapsed">
                            <span class="collapse-text">{{ isAdvancedSearchCollapsed ? '展开' : '收起' }}</span>
                            <component :is="isAdvancedSearchCollapsed ? ChevronDown : ChevronUp" :size="14" style="vertical-align: middle; margin-left: 2px;" />
                        </el-button>
                        <el-button v-if="sortType === SortType.ID" text type="info" :size="isMobile ? 'small' : 'default'" @click="sortType = SortType.COPY">
                            {{ isMobile ? '复制数排序' : '点击按复制次数排序' }}
                        </el-button>
                        <el-button v-else-if="sortType === SortType.COPY" text type="info" :size="isMobile ? 'small' : 'default'" @click="sortType = SortType.ID">
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
            <el-table :data="memeArr" stripe cell-class-name="hover-pointer" row-key="id" :lazy="true">
                <!-- 自定义空状态插槽 -->
                <template #empty>
                    <div class="empty-state">
                        <template v-if="searchState === 'loading'">
                            <Loader2 class="loading-icon is-loading" :size="20" />
                            <span>正在搜索中...坐和放宽...</span>
                        </template>
                        <span v-else-if="searchState === 'error'">
                            搜索失败，<button type="button" class="search-link" @click="retryCount++">点击重试</button>
                        </span>
                        <span v-else class="no-results-message">
                            <span>没有找到搜索结果。想要补充更多烂梗？欢迎</span>
                            <button type="button" class="search-link" @click="openSubmissionFromSearch">点击投稿</button>
                        </span>
                    </div>
                </template>
                <!-- 序号列 -->
                <el-table-column align="center" width="70">
                    <template #default="scope">
                        <div class="row-number">{{ scope.row.id }}</div>
                    </template>
                </el-table-column>

                <!-- 内容列 -->
                <el-table-column prop="content">
                    <template #default="scope">
                        <el-popover placement="top" width="auto" trigger="hover">
                            <template #reference>
                                <div class="barrage-text" style="display: flex; align-items: center; gap: 4px">
                                    <TriangleAlert v-if="hasShieldWordInContent(scope.row.content)" style="color: #e6a23c; flex-shrink: 0;" :size="16" />
                                    <span v-html="highlightContent(scope.row.content)"></span>
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
                                            <TriangleAlert :size="14" style="margin-right: 2px; vertical-align: middle;" />
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
import { searchMeme } from '@/apis/getMeme';
import { copyCountPlus1, plus1Error } from '@/apis/setMeme';
import { recordOptimisticCopy, applyOptimisticCopyCount } from '@/utils/copyTracker';
import flipNum from '@/components/flip-num.vue';
import tagSelector from '@/components/tag-selector.vue';
import { useMemeTagsStore } from '@/stores/memeTags';
import { useShieldWordStore } from '@/stores/shieldWordStore';
import { useSubmissionDialogStore } from '@/stores/useSubmissionDialogStore';
import { type getMemeTags as memeTag, SortType } from '@/types/meme';
import { createCountedCopy } from '@/utils/clipboard';
import { useIsMobile } from '@/composables/useIsMobile';
import { getDisplayTags } from '@/utils/tags';
import { easyFormatTime } from '@/utils/time';
import { Loader2, TriangleAlert, ChevronDown, ChevronUp } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
const shieldWordStore = useShieldWordStore();
const submissionDialogStore = useSubmissionDialogStore();

const showDialog = defineModel<boolean>();
const props = defineProps<{
    searchKey: string;
}>();
const isMobile = useIsMobile();

const memeTagsStore = useMemeTagsStore();
const allTags = computed(() => memeTagsStore.memeTags);

// ==================== 搜索状态管理 ====================
const PAGE_SIZE = 20;

const memeArr = ref<Meme[]>([]);
const searchState = ref<'loading' | 'ready' | 'error'>('loading');
const retryCount = ref(0);
const sortType = ref<SortType>(SortType.ID);
const currentPage = ref(1);
const total = ref(0);
const openSubmissionAfterClose = ref(false);

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
const selectedTags = ref<memeTag[]>([]);
const submitTime = ref<[string, string] | undefined>();

function resetAdvancedSearch() {
    selectedTags.value = [];
    submitTime.value = undefined;
}

function clearAdvancedSearch() {
    if (selectedTags.value.length === 0 && !submitTime.value) return;
    resetAdvancedSearch();
}

// 日期限制
function disabledDate(time: Date) {
    return time.getTime() < new Date('2024-09-24').getTime();
}

// ==================== 复制功能 ====================
const copyAndShouldCount = createCountedCopy();

async function handleCopyMeme(meme: Meme) {
    if (!copyAndShouldCount(meme.content)) return;

    const nextCount = (Number(meme.copyCount) || 0) + 1;
    meme.copyCount = nextCount;
    recordOptimisticCopy(meme.id, nextCount);

    try {
        const success = await copyCountPlus1('', meme.id);
        if (!success) {
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

const highlightPattern = computed(() => (props.searchKey ? new RegExp(escapeRegExp(props.searchKey), 'gi') : null));

function highlightContent(content: string) {
    return highlightPattern.value ? content.replace(highlightPattern.value, (match) => `<span class="search-hit">${match}</span>`) : content;
}

watch(showDialog, (open) => {
    if (!open) resetAdvancedSearch();
});

const criteria = computed(() => {
    const barrage = props.searchKey.trim();
    if (!showDialog.value || !barrage) return null;
    return {
        barrage,
        sort: sortType.value,
        tags: selectedTags.value.map((tag) => tag.dictValue).join(','),
        submitTime: submitTime.value,
    };
});

watch(criteria, () => {
    currentPage.value = 1;
    total.value = 0;
});

watch(
    [criteria, currentPage, retryCount],
    ([query, pageNum], _, onCleanup) => {
        searchState.value = 'loading';
        memeArr.value = [];
        if (!query) return;

        let active = true;
        const timer = setTimeout(async () => {
            const { _failure, flatData } = await searchMeme({ ...query, pageNum, pageSize: PAGE_SIZE });
            if (!active) return;
            if (_failure || !flatData) {
                searchState.value = 'error';
                return;
            }

            total.value = flatData.total;
            memeArr.value = flatData.list.map((item) =>
                applyOptimisticCopyCount({
                    id: String(item.id),
                    content: item.barrage,
                    tags: item.tags,
                    submitTime: item.submitTime,
                    copyCount: Number(item.cnt),
                })
            );
            searchState.value = 'ready';
        }, 300);

        onCleanup(() => {
            clearTimeout(timer);
            active = false;
        });
    },
    { immediate: true }
);
</script>

<style scoped lang="scss" src="./search-dialog.scss"></style>
