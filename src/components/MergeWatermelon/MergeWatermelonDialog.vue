<template>
    <Teleport to="body">
        <el-dialog
            v-model="dialogVisible"
            title="合成流心西瓜"
            :width="isMobile ? '100%' : '1100px'"
            :fullscreen="isMobile"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="true"
            :destroy-on-close="true"
            align-center
            class="merge-watermelon-dialog"
        >
            <div v-if="dialogVisible" class="merge-watermelon-content">
                <!-- 左侧：游戏区 -->
                <div class="merge-watermelon-stage">
                    <div class="merge-watermelon-wrapper">
                        <iframe
                            ref="iframeRef"
                            src="/games/流心西瓜.html"
                            title="合成流心西瓜"
                            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                            @load="onIframeLoad"
                        ></iframe>
                    </div>

                    <!-- 操作提示条 -->
                    <div class="merge-watermelon-controls">
                        <div class="ctrl-row">
                            <div class="ctrl-group">
                                <span class="ctrl-label">基础操作</span>
                                <span class="ctrl-key">←</span><span class="ctrl-key">→</span>
                                <span class="ctrl-desc">移动</span>
                                <span class="ctrl-key wide">Space</span>
                                <span class="ctrl-desc">滴落</span>
                            </div>

                            <div class="ctrl-group skill" :class="{ ready: heatReady, disabled: !heatReady }">
                                <span class="ctrl-key">E</span>
                                <span class="ctrl-desc">加热 · 粘度骤降</span>
                                <div class="ctrl-meter" :style="{ '--c': '#ff7a3d' }">
                                    <i :style="{ width: heatPct + '%' }"></i>
                                </div>
                                <span class="ctrl-status" v-if="heatReady">✓ 可用</span>
                                <span class="ctrl-status muted" v-else>条满才可用</span>
                            </div>

                            <div class="ctrl-group skill" :class="{ ready: shakeReady, disabled: !shakeReady }">
                                <span class="ctrl-key">Q</span>
                                <span class="ctrl-desc">摇晃 · 沉降重排</span>
                                <div class="ctrl-meter" :style="{ '--c': '#7fd8ff' }">
                                    <i :style="{ width: shakePct + '%' }"></i>
                                </div>
                                <span class="ctrl-status" v-if="shakeReady">✓ 可用</span>
                                <span class="ctrl-status muted" v-else>条满才可用</span>
                            </div>
                        </div>
                        <div class="ctrl-tip">💡 技能条会随融合慢慢攒满，攒满后才能触发</div>
                    </div>
                </div>

                <!-- 右侧：排行榜 -->
                <div class="merge-watermelon-leaderboard" v-if="!isMobile || showMobileLeaderboard">
                    <div class="leaderboard-header">
                        <span class="title">🏆 排行榜 TOP100</span>
                        <span style="font-size: 11px; color: #000;">登录以记录昵称</span>
                        <el-button text type="primary" size="small" @click="loadLeaderboard">刷新</el-button>
                    </div>

                    <div v-if="myRank" class="my-rank-card" :class="{ 'top-three': myRank.rank > 0 && myRank.rank <= 3 }">
                        <div class="my-rank-line">
                            <span class="label">我的排名</span>
                            <strong class="rank">{{ myRank.rank > 0 ? `第 ${myRank.rank} 名` : '未上榜' }}</strong>
                        </div>
                        <div class="my-rank-line">
                            <span class="label">历史最高</span>
                            <strong class="score">{{ myRank.bestScore }}</strong>
                        </div>
                    </div>

                    <el-scrollbar height="100%" class="leaderboard-scroll">
                        <div v-loading="loading" class="leaderboard-list">
                            <div
                                v-for="(item, idx) in leaderboard"
                                :key="item.id"
                                class="leaderboard-row"
                                :class="{
                                    'top-1': idx === 0,
                                    'top-2': idx === 1,
                                    'top-3': idx === 2,
                                    'is-mine': item.nickname && myNickname && myNickname === item.nickname,
                                }"
                            >
                                <div class="row-main">
                                    <span class="rank-no">{{ idx + 1 }}</span>
                                    <span class="nickname">{{ item.nickname || '匿名用户' }}</span>
                                    <span class="score">{{ item.score }}</span>
                                </div>
                                <div class="row-sub" v-if="!isMobile">
                                    <span class="level" v-if="item.topSpecies">{{ item.topSpecies }}</span>
                                    <span class="time">{{ formatTime(item.createTime) }}</span>
                                </div>
                            </div>
                            <el-empty v-if="!loading && leaderboard.length === 0" description="暂无排行数据" />
                        </div>
                    </el-scrollbar>

                    <div v-if="isMobile" class="mobile-leaderboard-close">
                        <el-button type="primary" block @click="showMobileLeaderboard = false">
                            关闭排行榜，继续游戏
                        </el-button>
                    </div>
                </div>
            </div>
        </el-dialog>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { mergeWatermelonDialogVisible } from './state';
import { useIsMobile } from '@/composables/useIsMobile';
import { getSiteToken } from '@/utils/cookieUtils';
import {
    fetchMergeWatermelonLeaderboard,
    fetchMergeWatermelonRank,
    submitMergeWatermelonScore,
    type MergeWatermelonLeaderboardItem,
    type MergeWatermelonRankInfo,
} from '@/apis/mergeWatermelon';

function formatTime(iso: string): string {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
}

function getCookie(name: string): string | null {
    const m = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    if (!m) return null;
    const raw = decodeURIComponent(m[2]);
    if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
    return raw;
}

const isMobile = useIsMobile();
const dialogVisible = mergeWatermelonDialogVisible;
const iframeRef = ref<HTMLIFrameElement | null>(null);

const leaderboard = ref<MergeWatermelonLeaderboardItem[]>([]);
const myRank = ref<MergeWatermelonRankInfo | null>(null);
const loading = ref(false);
const myNickname = ref<string | null>(null);
const showMobileLeaderboard = ref(false);

// iframe 内 DOM 轮询：检测 game over + 同步技能条进度
let pollTimer: number | null = null;
let lastSubmittedScore = -1;
let isWatchingGameOver = false;
const heatPct = ref(0);
const shakePct = ref(0);
const heatReady = ref(false);
const shakeReady = ref(false);

function isGameOverShown(doc: Document): boolean {
    const btn = doc.getElementById('againBtn');
    if (!btn) return false;
    const style = doc.defaultView?.getComputedStyle(btn);
    return !!style && style.display !== 'none' && style.visibility !== 'hidden';
}

function readFinalScore(doc: Document): { score: number; topSpecies: string | null } | null {
    const scoreEl = doc.getElementById('score');
    const tierEl = doc.getElementById('ovTier');
    if (!scoreEl) return null;
    const score = parseInt(scoreEl.textContent?.trim() ?? '0', 10);
    const topSpecies = tierEl?.textContent?.trim() || null;
    if (Number.isNaN(score) || score <= 0) return null;
    return { score, topSpecies: topSpecies === '—' ? null : topSpecies };
}

/** 读取技能条的进度百分比；按钮未被禁用且 meter 已满即视为可用 */
function readSkill(doc: Document, btnId: string, meterId: string): { pct: number; ready: boolean } {
    const btn = doc.getElementById(btnId);
    const meter = doc.getElementById(meterId);
    let pct = 0;
    let ready = false;
    if (meter) {
        const raw = meter.style.width || '0%';
        const m = raw.match(/([\d.]+)/);
        pct = m ? Math.max(0, Math.min(100, parseFloat(m[1]))) : 0;
    }
    if (btn) {
        const style = doc.defaultView?.getComputedStyle(btn);
        ready = !!style && !style.display.includes('none') && !btn.hasAttribute('disabled');
        if (!ready && pct < 100) ready = false;
        // 当条满 100% 时按钮恢复可点（即使 disabled 属性尚未移除）
        if (pct >= 100) ready = true;
    }
    return { pct: Math.round(pct), ready };
}

function startWatching() {
    if (isWatchingGameOver) return;
    isWatchingGameOver = true;
    lastSubmittedScore = -1;
    const tick = () => {
        const win = iframeRef.value?.contentWindow;
        if (!win) return;
        const doc = win.document;
        if (isGameOverShown(doc)) {
            const result = readFinalScore(doc);
            if (result && result.score !== lastSubmittedScore) {
                lastSubmittedScore = result.score;
                submitAndRefresh(result.score, result.topSpecies);
            }
        }
        const heat = readSkill(doc, 'skHeat', 'mHeat');
        const shake = readSkill(doc, 'skShake', 'mShake');
        heatPct.value = heat.pct;
        shakePct.value = shake.pct;
        heatReady.value = heat.ready;
        shakeReady.value = shake.ready;
    };
    pollTimer = window.setInterval(tick, 250);
}

function stopWatching() {
    isWatchingGameOver = false;
    if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

async function submitAndRefresh(score: number, topSpecies: string | null) {
    const siteToken = getSiteToken();
    if (!siteToken) return;
    await submitMergeWatermelonScore(siteToken, score, topSpecies);
    await loadLeaderboard();
    await loadMyRank(siteToken);
}

async function loadLeaderboard() {
    loading.value = true;
    try {
        leaderboard.value = await fetchMergeWatermelonLeaderboard(100);
    } catch (e) {
        console.error('[MergeWatermelon] leaderboard error', e);
    } finally {
        loading.value = false;
    }
}

async function loadMyRank(siteToken: string) {
    try {
        myRank.value = await fetchMergeWatermelonRank(siteToken);
        myNickname.value = getCookie('nickname');
    } catch (e) {
        console.error('[MergeWatermelon] rank error', e);
    }
}

function onIframeLoad() {
    startWatching();
}

watch(dialogVisible, async (visible) => {
    if (!visible) {
        stopWatching();
        leaderboard.value = [];
        myRank.value = null;
        myNickname.value = null;
        lastSubmittedScore = -1;
        heatPct.value = 0;
        shakePct.value = 0;
        heatReady.value = false;
        shakeReady.value = false;
    }
    if (visible) {
        await nextTick();
        const siteToken = getSiteToken() || 'anonymous-' + Date.now();
        await loadLeaderboard();
        await loadMyRank(siteToken);
        // iframe 可能在 nextTick 前已经加载（缓存），补一次启动
        if (iframeRef.value?.contentDocument?.readyState === 'complete') {
            startWatching();
        }
    }
});

onBeforeUnmount(() => {
    stopWatching();
});
</script>

<style scoped lang="scss">
.merge-watermelon-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
        overflow: hidden;
    }
}

.merge-watermelon-content {
    display: flex;
    width: 100%;
    height: min(80dvh, 860px);
    min-height: 900px;
    background: #150d1f;
    border-radius: 8px;
    overflow: hidden;
}

.merge-watermelon-stage {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: #150d1f;
}

.merge-watermelon-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #150d1f;
    padding: 8px;
    overflow: hidden;

    iframe {
        aspect-ratio: 400 / 620;
        height: 100%;
        max-width: 100%;
        border: 0;
        display: block;
    }
}

/* ===== 操作提示条 ===== */
.merge-watermelon-controls {
    flex: none;
    padding: 10px 14px 12px;
    background: linear-gradient(180deg, rgba(255, 181, 71, 0.08), rgba(127, 216, 255, 0.05));
    border-top: 1px solid rgba(226, 205, 255, 0.14);
    color: #f6ecff;
    font-family: var(--f-body, system-ui);

    html.dark & {
        background: linear-gradient(180deg, rgba(255, 181, 71, 0.05), rgba(127, 216, 255, 0.03));
    }
}

.ctrl-row {
    display: flex;
    gap: 18px;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 8px;
}

.ctrl-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    &.skill {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(226, 205, 255, 0.14);
        transition: border-color 0.25s, background 0.25s;

        &.ready {
            border-color: var(--c);
            background: color-mix(in srgb, var(--c) 18%, transparent);
            animation: skill-pulse 1.6s ease-in-out infinite;
        }
    }
}

.ctrl-label {
    color: #b9a6cc;
    font-size: 11px;
    letter-spacing: 0.04em;
    margin-right: 4px;
}

.ctrl-key {
    display: inline-block;
    min-width: 22px;
    padding: 2px 6px;
    text-align: center;
    border: 1px solid rgba(226, 205, 255, 0.3);
    border-radius: 5px;
    font-family: var(--f-mono, ui-monospace, Menlo, Consolas, monospace);
    font-size: 11px;
    color: #f6ecff;
    background: rgba(255, 255, 255, 0.05);

    &.wide {
        min-width: 56px;
    }
}

.ctrl-desc {
    color: #b9a6cc;
    font-size: 11px;
}

.ctrl-meter {
    width: 70px;
    height: 6px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
    margin: 0 4px;

    i {
        display: block;
        height: 100%;
        width: 0;
        border-radius: 9px;
        background: var(--c, #ffb547);
        transition: width 0.2s linear;
    }
}

.ctrl-status {
    font-size: 10.5px;
    color: var(--c, #b9a6cc);
    font-weight: 700;
    white-space: nowrap;

    &.muted {
        color: #7d6b91;
        font-weight: 400;
    }
}

.ctrl-tip {
    margin-top: 6px;
    font-size: 10.5px;
    color: #7d6b91;
    letter-spacing: 0.02em;
}

@keyframes skill-pulse {
    50% {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 22%, transparent);
    }
}

.merge-watermelon-leaderboard {
    width: 280px;
    flex-shrink: 0;
    background: #fffbe2;
    border-left: 1px solid rgba(70, 123, 76, 0.18);
    display: flex;
    flex-direction: column;
    color: #000;

    html.dark & {
        background: #1e2418;
        border-left-color: var(--el-border-color);
        color: var(--body-color);
    }
}

.leaderboard-header {
    padding: 12px 5px;
    border-bottom: 1px solid rgba(70, 123, 76, 0.18);
    background: linear-gradient(115deg, rgba(255, 248, 201, 0.96), rgba(218, 239, 174, 0.78));
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
        font-weight: 850;
        color: #28553a;
        font-size: 14px;
    }
}

.my-rank-card {
    padding: 10px 14px;
    margin: 10px 10px 6px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px dashed rgba(70, 123, 76, 0.4);
    border-radius: 12px;

    &.top-three {
        background: rgba(195, 228, 154, 0.45);
        border-style: solid;
    }

    .my-rank-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;

        .label {
            color: #6c944b;
            font-size: 11px;
            font-weight: 700;
        }

        .rank {
            color: #28553a;
            font-size: 14px;
        }

        .score {
            color: #28553a;
            font-size: 16px;
            font-weight: 800;
        }
    }
}

.leaderboard-scroll {
    flex: 1;
    min-height: 0;
}

.leaderboard-list {
    padding: 4px 6px 12px;
}

.leaderboard-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 7px 10px;
    margin: 2px 0;
    border-radius: 8px;
    font-size: 11px;
    color: #000;

    .row-main {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;

        .rank-no {
            width: 32px;
            text-align: center;
            font-weight: 800;
            color: #000;
        }

        .nickname {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #000;
            font-weight: 600;
        }

        .score {
            width: 60px;
            font-weight: 800;
            color: #000;
            font-variant-numeric: tabular-nums;
            text-align: right;
        }
    }

    .row-sub {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: 36px;
        padding-top: 2px;
        font-size: 10px;
        color: #666;

        .level {
            color: #666;
            font-weight: 700;
            font-size: 10px;
        }

        .time {
            color: #999;
            font-size: 9px;
        }
    }

    &.top-1 {
        background: linear-gradient(90deg, #ffd86b, #ffb347);
        .rank-no, .score { color: #000; }
    }

    &.top-2 {
        background: linear-gradient(90deg, #d6dce0, #b9c2c8);
        .rank-no, .score { color: #000; }
    }

    &.top-3 {
        background: linear-gradient(90deg, #f4a866, #d68850);
        .rank-no, .score { color: #000; }
    }

    &.is-mine:not(.top-1):not(.top-2):not(.top-3) {
        background: rgba(108, 148, 75, 0.16);
        border: 1px solid rgba(108, 148, 75, 0.4);
    }
}

@media (max-width: 600px) {
    .merge-watermelon-content {
        height: 100%;
        min-height: 100%;
        border-radius: 0;
        flex-direction: column;
    }

    .ctrl-row {
        gap: 10px;
    }

    .ctrl-group.skill {
        flex: 1 1 calc(50% - 5px);
    }

    .ctrl-meter {
        width: 50px;
    }
}

.mobile-leaderboard-close {
    padding: 8px 0;
}

.mobile-leaderboard-close .el-button {
    width: 100%;
    font-size: 14px;
}
</style>
