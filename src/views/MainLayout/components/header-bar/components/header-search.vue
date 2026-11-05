<template>
    <div class="header-search">
        <div class="header-search-box" :class="{ 'is-focused': isFocused }">
            <input ref="inputRef" v-model="enteringSearchKey" class="header-search-input" type="search" inputmode="search" enterkeyhint="search" placeholder="输入以搜索烂梗..." @focus="isFocused = true" @blur="isFocused = false" @keyup.enter="handleSearchMemeOnEnter" @keydown.esc="handleEscape" />
            <button v-if="enteringSearchKey" type="button" class="header-search-icon header-search-clear" aria-label="清空搜索内容" @mousedown.prevent @click="clearSearchKey">
                <X :size="14" />
            </button>
            <button type="button" class="header-search-icon header-search-submit" aria-label="搜索" @click="handleSearchMeme">
                <Search :size="15" />
            </button>
        </div>

        <transition name="history-fade">
            <div v-if="showHistoryPanel" class="search-history-panel" @mousedown.prevent>
                <div class="search-history-header">
                    <span>搜索记录</span>
                    <button type="button" class="search-history-clear" @click="clearSearchHistory">
                        <Trash2 :size="12" />
                        清空记录
                    </button>
                </div>
                <ul class="search-history-list">
                    <li v-for="item in searchHistory" :key="item">
                        <button type="button" class="search-history-item" @click="searchByHistory(item)">
                            <Clock :size="13" class="search-history-clock" />
                            <span class="search-history-text">{{ item }}</span>
                        </button>
                    </li>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { Clock, X, Trash2, Search } from '@lucide/vue';
import { ElMessage } from 'element-plus';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const SEARCH_QUERY_KEY = 'search';
const SEARCH_HISTORY_STORAGE_KEY = 'sb6657-search-history';
const SEARCH_HISTORY_MAX_COUNT = 5;
const enteringSearchKey = ref('');
const isFocused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const route = useRoute();
const router = useRouter();
const searchHistory = ref<string[]>(loadSearchHistory());

const showHistoryPanel = computed(() => isFocused.value && searchHistory.value.length > 0);

function loadSearchHistory(): string[] {
    try {
        const raw = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '').slice(0, SEARCH_HISTORY_MAX_COUNT);
    } catch {
        return [];
    }
}

function saveSearchHistory(searchKey: string) {
    const next = [searchKey, ...searchHistory.value.filter((item) => item !== searchKey)].slice(0, SEARCH_HISTORY_MAX_COUNT);
    searchHistory.value = next;
    try {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // 存储异常时仅保留内存记录
    }
}

function clearSearchHistory() {
    searchHistory.value = [];
    try {
        localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
    } catch {
        // 忽略移除异常
    }
}

function handleSearchMeme() {
    const nextSearchKey = enteringSearchKey.value.trim();
    if (nextSearchKey === '') {
        ElMessage.warning('请输入搜索内容');
        inputRef.value?.focus();
        return;
    }

    saveSearchHistory(nextSearchKey);
    void router.push({
        query: {
            ...route.query,
            [SEARCH_QUERY_KEY]: nextSearchKey,
        },
    });
}

function handleSearchMemeOnEnter(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    handleSearchMeme();
    (event.target as HTMLInputElement)?.blur();
}

function searchByHistory(searchKey: string) {
    enteringSearchKey.value = searchKey;
    handleSearchMeme();
    inputRef.value?.blur();
}

function clearSearchKey() {
    enteringSearchKey.value = '';
    inputRef.value?.focus();
}

function handleEscape(event: KeyboardEvent) {
    event.preventDefault();
    inputRef.value?.blur();
}
</script>

<style scoped lang="scss">
.header-search {
    width: 100%;
    position: relative;
}

.header-search-box {
    width: 100%;
    height: 32px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding-left: 9px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-fill-color-blank);
    transition: border-color 0.2s;

    &.is-focused {
        border-color: var(--el-color-primary);
    }
}

.header-search-input {
    min-width: 0;
    flex: 1;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--el-text-color-primary);
    font-size: 13px;
    -webkit-appearance: none;
    appearance: none;

    &::placeholder {
        color: var(--el-text-color-placeholder);
    }

    &::-webkit-search-cancel-button {
        display: none;
    }

    &::-webkit-search-decoration {
        display: none;
    }
}

.header-search-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 3px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition:
        color 0.2s,
        background-color 0.2s;

    &:hover {
        background-color: var(--el-fill-color-light);
        color: var(--el-color-primary);
    }
}

.search-history-panel {
    width: 100%;
    min-width: 160px;
    overflow: hidden;
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 200;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    background: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-light);
}

.search-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.search-history-clear {
    display: flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: var(--el-color-danger);
    }
}

.search-history-list {
    margin: 0;
    padding: 4px 0;
    list-style: none;
    max-height: 200px;
    overflow-y: auto;
}

.search-history-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 0;
    background: transparent;
    color: var(--el-text-color-primary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition:
        color 0.2s,
        background-color 0.2s;

    &:hover {
        background: var(--el-fill-color-light);
        color: var(--el-color-primary);
    }
}

.search-history-clock {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
}

.search-history-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.history-fade-enter-active,
.history-fade-leave-active {
    transition:
        opacity 0.15s,
        transform 0.15s;
}

.history-fade-enter-from,
.history-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
