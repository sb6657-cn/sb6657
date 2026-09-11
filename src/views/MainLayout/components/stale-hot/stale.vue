<template>
    <div class="stale">
        <h2 class="page-title">烂度指数榜</h2>
        <p class="page-sub">
            每个烂梗有 0–100 的「烂度」分。你觉得它越烂越上头，就点「越烂越爱」；觉得它烂大街了就点「烂透了」。
            烂度 = 复制热度 × 时间新鲜度，会随着时间自动衰减，老的梗会慢慢「凉」下来。
        </p>

        <div class="tabs">
            <el-radio-group v-model="tab" class="glow-tabs">
                <el-radio-button label="rank">🔥 烂度总榜</el-radio-button>
                <el-radio-button label="hot">⚡ 实时热度榜</el-radio-button>
            </el-radio-group>
        </div>

        <div v-if="loading && list.length === 0" class="loading"><div class="spinner"></div></div>
        <ul v-else class="meme-list">
            <li v-for="(m, i) in list" :key="m.barrageId" class="meme-item" :class="{ 'just-voted': m.justvoted, 'voted': votedIds.has(m.barrageId) }">
                <span class="rank-badge" :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }">{{ i + 1 }}</span>
                <div class="meme-main">
                    <el-popover v-if="m.submitTime || m.tags" placement="top" :width="'auto'" trigger="hover">
                        <template #default>
                            <div v-if="m.tags" class="tag-list">
                                <div v-for="item in m._displayTags" :key="item.label">
                                    <el-tag round effect="dark" class="tag-item">
                                        <div class="tag-icon-wrapper">
                                            <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                            <span class="tag-label">{{ item.label }}</span>
                                        </div>
                                    </el-tag>
                                </div>
                            </div>
                            <div v-if="m.submitTime" class="submit-time">📅 {{ formatDate(m.submitTime) }}</div>
                        </template>
                        <template #reference>
                            <span class="meme-text">{{ m.barrage }}</span>
                        </template>
                    </el-popover>
                    <span v-else class="meme-text">{{ m.barrage }}</span>
                    <div class="meme-thermo">
                        <div class="thermo-track">
                            <div class="thermo-fill" :class="thermoClass(displayScore(m))" :style="{ width: displayScore(m) + '%' }">
                                <span class="thermo-bulb"></span>
                            </div>
                        </div>
                        <span class="thermo-label">{{ Math.round(displayScore(m)) }}°</span>
                    </div>
                </div>
                <div class="meme-side">
                    <span class="stale-score pulse-score">{{ Math.round(displayScore(m)) }}</span>
                    <el-tooltip
                        :content="voteTip(m)"
                        placement="top" :show-after="250">
                        <div class="vote-btns">
                            <button class="vote-btn vote-fire" :disabled="votingId === m.barrageId" :aria-pressed="(m.mylastScore ?? 0) >= 60" @click="vote(m.barrageId, 90)">🔥 越烂越爱</button>
                            <button class="vote-btn vote-ice" :disabled="votingId === m.barrageId" :aria-pressed="(m.mylastScore ?? 0) > 0 && (m.mylastScore ?? 0) < 60" @click="vote(m.barrageId, 20)">❄️ 还好吧</button>
                        </div>
                    </el-tooltip>

                </div>
            </li>
            <li v-if="!list.length" class="empty">暂无数据</li>
        </ul>
        <div v-if="loadingMore" class="loading-more"><div class="mini-spinner"></div></div>
        <div v-else-if="isLast && list.length" class="list-end">— 到底了 —</div>
        <div ref="sentinelRef" class="sentinel"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { API } from '@/constants/backend';
import { get, post } from '@/apis/httpInstance';
import { ElMessage } from 'element-plus';
import { useMemeTagsStore } from '@/stores/memeTags';
import { getDisplayTags } from '@/utils/tags';
import type { getMemeTags as memeTag } from '@/types/meme';

const memeTagsStore = useMemeTagsStore();
const allTags = ref<memeTag[]>([]);
memeTagsStore.tagsLoaded.then(() => { allTags.value = memeTagsStore.memeTags; });

interface StaleMeme {
    barrageId: number;
    barrage: string;
    staleScore: number;
    hotScore?: number;
    submitTime?: string;
    tags?: string;
    cnt?: number;
    mylastScore?: number;
    justvoted?: boolean;
    _displayTags?: ReturnType<typeof getDisplayTags>;
}
interface PageResult<T> {
    list: T[];
    total: number;
    isLastPage: boolean;
}

const tab = ref<'rank' | 'hot'>('rank');
const loading = ref(true);
const loadingMore = ref(false);
const list = ref<StaleMeme[]>([]);
const pageNum = ref(0);
const isLast = ref(false);
const sentinelRef = ref<HTMLElement | null>(null);
const votedIds = ref<Set<number>>(new Set());
const votingId = ref<number | null>(null);
let observer: IntersectionObserver | null = null;

function displayScore(m: StaleMeme): number {
    return tab.value === 'hot' ? (m.hotScore ?? m.staleScore) : m.staleScore;
}

async function load(reset = true) {
    if (reset) {
        loading.value = true;
        pageNum.value = 0;
        list.value = [];
        isLast.value = false;
    } else {
        loadingMore.value = true;
    }
    const url = tab.value === 'rank' ? API.STALE_RANK : API.STALE_HOT;
    const res = await get<PageResult<StaleMeme>>(`${url}?pageNum=${pageNum.value + 1}&pageSize=20`);
    loading.value = false;
    loadingMore.value = false;
    if (!res._failure && res.flatData) {
        const items: StaleMeme[] = (res.flatData.list || []).map(m => {
            if (m.tags && allTags.value.length) {
                m._displayTags = getDisplayTags(m.tags, allTags.value);
            }
            return m;
        });
        list.value.push(...items);
        pageNum.value++;
        isLast.value = res.flatData.isLastPage;
        // 没填满时继续拉
        await nextTick();
        if (!isLast.value && list.value.length < 20) load(false);
    }
}

async function vote(barrageId: number, score: number) {
    votingId.value = barrageId;
    const res = await post({ url: API.STALE_VOTE, data: { barrageId, score } });
    votingId.value = null;
    if (res._failure) {
        ElMessage.warning('投票失败，请稍后再试');
        return;
    }
    votedIds.value.add(barrageId);
    ElMessage.success(score >= 60 ? '🔥 已投「越烂越爱」' : '❄️ 已投「还好吧」');
    // 用后端返回的最新值更新该梗，不再重拉整个榜单
    const idx = list.value.findIndex(m => m.barrageId === barrageId);
    if (idx >= 0) {
        const item = list.value[idx];
        const latest = res.flatData ?? {};
        item.staleScore = latest.staleScore ?? item.staleScore;
        item.hotScore   = latest.hotScore   ?? item.hotScore;
        item.justvoted  = true;
        item.mylastScore = score;
        setTimeout(() => { item.justvoted = false; }, 2000);
    }
}

function voteTip(m: StaleMeme): string {
    if (m.mylastScore == null) return '投一票影响它的烂度';
    return m.mylastScore >= 60 ? '你投了「越烂越爱」' : '你投了「还好吧」';
}

function thermoClass(score: number): string {
    if (score >= 80) return 'thermo-fire';
    if (score >= 50) return 'thermo-hot';
    if (score >= 20) return 'thermo-warm';
    return 'thermo-cool';
}
function formatDate(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

watch(tab, () => load(true));

onMounted(async () => {
    await load(true);
    await nextTick();
    if (sentinelRef.value) {
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading.value && !loadingMore.value && !isLast.value) {
                    load(false);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(sentinelRef.value);
    }
});

onUnmounted(() => observer?.disconnect());
</script>

<style scoped lang="scss">
.stale {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: var(--content-bg);
}
.page-title {
    font-size: 24px;
    font-weight: 900;
    background: linear-gradient(90deg, #e74c3c, #ff6b35, #ffd666);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 4px;
}
.page-sub {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 16px;
}
.tabs { margin-bottom: 14px; }
.glow-tabs .el-radio-button__inner {
    border-radius: 20px !important;
}
.loading { text-align: center; color: #999; padding: 40px; }
.spinner {
    width: 36px; height: 36px;
    border: 3px solid #eee; border-top-color: #e74c3c;
    border-radius: 50%; margin: 0 auto;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.meme-list {
    list-style: none;
    margin: 0; padding: 0;
}
.meme-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 8px;
    border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
    opacity: 0;
    animation: slide-in 0.35s ease forwards;
    transition: background 0.2s;
}
.meme-item:hover {
    background: var(--el-fill-color-light, #fafafa);
}
@keyframes slide-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Rank Badge */
.rank-badge {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 14px;
    flex-shrink: 0;
    background: var(--el-fill-color-light, #f0f0f0); color: var(--body-color);
    transition: transform 0.2s;
    opacity: 0.7;
}
.rank-badge.gold {
    background: linear-gradient(135deg, #ffd700, #ff9f43);
    color: #fff; box-shadow: 0 2px 10px rgba(255,215,0,0.4);
    animation: badge-glow 2s ease infinite;
}
.rank-badge.silver {
    background: linear-gradient(135deg, #c0c0c0, #e0e0e0);
    color: var(--body-color); box-shadow: 0 2px 8px rgba(192,192,192,0.5);
}
.rank-badge.bronze {
    background: linear-gradient(135deg, #cd7f32, #e8a863);
    color: #fff; box-shadow: 0 2px 8px rgba(205,127,50,0.4);
}
@keyframes badge-glow {
    0%,100% { box-shadow: 0 2px 10px rgba(255,215,0,0.4); }
    50% { box-shadow: 0 2px 20px rgba(255,215,0,0.7); }
}

/* Meme Content */
.meme-main { flex: 1; min-width: 0; }
.meme-text { font-size: 15px; display: block; margin-bottom: 8px; }

/* Thermometer */
.meme-thermo {
    display: flex; align-items: center; gap: 8px;
}
.thermo-track {
    flex: 1; height: 8px;
    background: var(--el-fill-color-light, #f0f0f0);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}
.thermo-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}
.thermo-fill.thermo-cool {
    background: linear-gradient(90deg, #3498db, #5dade2);
}
.thermo-fill.thermo-warm {
    background: linear-gradient(90deg, #f39c12, #ffd666);
}
.thermo-fill.thermo-hot {
    background: linear-gradient(90deg, #e67e22, #ff6b35);
}
.thermo-fill.thermo-fire {
    background: linear-gradient(90deg, #e74c3c, #ff6b35, #ffd700);
    background-size: 200% 100%;
    animation: fire-shift 1.5s ease infinite;
}
@keyframes fire-shift {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
.thermo-bulb {
    position: absolute;
    right: -4px; top: -4px;
    width: 16px; height: 16px;
    background: #fff;
    border: 3px solid currentColor;
    border-radius: 50%;
}
.thermo-label {
    font-size: 12px; font-weight: 700; color: #e74c3c;
    min-width: 28px;
}

/* Side */
.meme-side {
    display: flex; flex-direction: column;
    align-items: flex-end; gap: 6px; flex-shrink: 0;
}
.stale-score {
    font-size: 28px; font-weight: 900;
    background: linear-gradient(135deg, #ff6b35, #e74c3c);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.pulse-score {
    animation: pulse-text 2s ease-in-out infinite;
}
@keyframes pulse-text {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.08); }
}

/* Vote Buttons */
.vote-btns {
    display: flex; gap: 6px; flex-direction: column;
}
.vote-btn {
    border: none;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
}
.vote-fire {
    background: linear-gradient(135deg, #e74c3c, #ff6b35);
    color: #fff;
}
.vote-fire:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(231,76,60,0.4);
}
.vote-ice {
    background: linear-gradient(135deg, #3498db, #5dade2);
    color: #fff;
}
.vote-ice:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(52,152,219,0.4);
}

.empty { color: #bbb; text-align: center; padding: 20px; }
.tag-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
    .tag-item {
        font-size: 13px;
        .tag-icon-wrapper {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 4px;
            .tag-icon {
                width: 16px;
                object-fit: cover;
                vertical-align: middle;
            }
            .tag-label { vertical-align: middle; }
        }
    }
}
.submit-time { color: #c0c4cc; font-size: 12px; }
.loading-more { text-align: center; padding: 16px; }
.mini-spinner {
    width: 24px; height: 24px;
    border: 2px solid #eee; border-top-color: #ff6b35;
    border-radius: 50%; margin: 0 auto;
    animation: spin 0.7s linear infinite;
}
.list-end { text-align: center; color: #ccc; font-size: 13px; padding: 16px; }
.sentinel { height: 1px; }

@media (max-width: 600px) {
    .meme-item { flex-wrap: wrap; }
    .meme-side { flex-direction: row; width: 100%; justify-content: space-between; }
    .vote-btns { flex-direction: row; }
}

/* vote feedback */
.meme-item.just-voted { background: #fffbe6; }
.vote-btn:disabled { opacity: 0.4; cursor: default; }

html.dark .page-sub,
html.dark .list-end {
    color: var(--el-text-color-secondary);
}

html.dark .mini-spinner {
    border-color: var(--el-border-color);
    border-top-color: #ff6b35;
}

html.dark .thermo-bulb {
    background: var(--card-bg);
}

html.dark .meme-item.just-voted {
    background: rgba(255, 214, 102, 0.16);
}
</style>

