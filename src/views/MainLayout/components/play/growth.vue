<template>
    <div class="growth">
        <h2 class="page-title glow-text">梗王段位 & 勋章墙</h2>
        <p class="page-sub">
            投稿过审、上热榜、烂梗被复制都能获得经验。经验越多段位越高，从「梗民」一路升到「梗神」。
            达成特定成就还能点亮专属勋章！
        </p>

        <div v-if="loading" class="loading"><div class="spinner"></div></div>
        <template v-else-if="me">
            <div class="level-card" :class="tierClass(me.level)">
                <div class="level-icon pulse-ring">Lv.{{ me.level }}</div>
                <div class="level-info">
                    <div class="level-title">{{ me.levelName }}</div>
                    <div class="exp-bar">
                        <div class="exp-fill fire-bar" :style="{ width: expPct + '%' }">
                            <span class="fire-tip"></span>
                        </div>
                    </div>
                    <div class="exp-text">
                        <template v-if="me.nextLevelExp">{{ me.exp }} / {{ me.nextLevelExp }} 经验（距下一级还差 {{ Math.max(0, me.nextLevelExp - me.exp) }}）</template>
                        <template v-else>{{ me.exp }} 经验 · 已满级</template>
                    </div>
                </div>
                <div class="sparkles">
                    <span v-for="n in 6" :key="n" class="sparkle"></span>
                </div>
            </div>

            <div class="stat-row">
                <div class="stat-item lift-card">
                    <span class="stat-icon">📝</span>
                    <span class="stat-num count-up">{{ me.totalSubmit }}</span>
                    <span class="stat-label">投稿过审</span>
                </div>
                <div class="stat-item lift-card">
                    <span class="stat-icon">💰</span>
                    <span class="stat-num count-up">{{ coinBalance ?? 0 }}</span>
                    <span class="stat-label">梗币余额</span>
                </div>
                <div class="stat-item lift-card">
                    <span class="stat-icon">🔥</span>
                    <span class="stat-num count-up">{{ me.hotCount }}</span>
                    <span class="stat-label">上热榜</span>
                </div>
                <div class="stat-item lift-card">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-num count-up">#{{ me.rank }}</span>
                    <span class="stat-label">全站排名</span>
                </div>
            </div>

            <h3 class="section-title">我的勋章（{{ ownedMedals.length }}/{{ allMedals.length }}）</h3>
            <div class="medals">
                <div v-for="m in allMedals" :key="m.code" class="medal flip-card" :class="{ owned: isOwned(m.code) }" :title="m.desc">
                    <div class="medal-inner">
                        <div class="medal-front">
                            <div class="medal-icon">{{ medalIcon(m.code) }}</div>
                            <div class="medal-name">{{ m.name }}</div>
                        </div>
                        <div class="medal-back">
                            <div class="medal-icon">🏅</div>
                            <div class="medal-name">{{ m.name }}</div>
                            <div class="medal-desc">{{ m.desc }}</div>
                        </div>
                    </div>
                    <div v-if="isOwned(m.code)" class="unlock-glow"></div>
                </div>
            </div>
        </template>

        <h3 class="section-title">经验排行榜</h3>
        <ul class="rank-list">
            <li v-for="(u, i) in rank" :key="u.userId" class="rank-item slide-in" :class="{ self: me && u.userId === me.userId }" :style="{ animationDelay: i * 0.05 + 's' }">
                <span class="rank-no" :class="{ crown: i < 3 }">{{ i < 3 ? ['👑', '🥈', '🥉'][i] : i + 1 }}</span>
                <span class="rank-name">{{ u.userName }}</span>
                <span class="rank-tier badge">{{ u.levelName }}</span>
                <span class="rank-exp">{{ u.exp }} 经验</span>
            </li>
            <li v-if="!rank.length" class="empty">暂无排行数据</li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { API } from '@/constants/backend';
import { get } from '@/apis/httpInstance';

interface GrowthMe {
    userId: number;
    exp: number;
    level: number;
    levelName: string;
    nextLevelExp: number | null;
    rank: number;
    totalSubmit: number;
    hotCount: number;
}
interface Medal {
    code: string;
    name: string;
    desc: string;
    owned: boolean;
}
interface RankUser {
    userId: number;
    userName: string;
    exp: number;
    levelName: string;
}

const loading = ref(true);
const me = ref<GrowthMe | null>(null);
const allMedals = ref<Medal[]>([]);
const ownedMedals = ref<string[]>([]);
const rank = ref<RankUser[]>([]);
const coinBalance = ref<number>(0);

const expPct = computed(() => {
    if (!me.value || !me.value.nextLevelExp) return 0;
    return Math.min(100, Math.round((me.value.exp / me.value.nextLevelExp) * 100));
});

function isOwned(code: string): boolean {
    return ownedMedals.value.includes(code);
}
function tierClass(level: number): string {
    return ['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5', 'tier-6', 'tier-7'][level - 1] || 'tier-1';
}
function medalIcon(code: string): string {
    return {
        first_submit: '🚀', copy_100: '📈', copy_500: '🔥', copy_1000: '💎', copy_5000: '👑',
        hot_top: '🏆', sign_7: '📅', sign_30: '🗓️', arena_champ: '⚔️', arena_win5: '🛡️',
        arena_win10: '🏰', submit_10: '🌟', submit_50: '⭐', submit_100: '💫',
        chain_king: '🔗', exp_10000: '✨', exp_max: '💥'
    }[code] || '🏅';
}

async function loadMe() {
    const res = await get<GrowthMe>(API.GROWTH_ME);
    loading.value = false;
    if (!res._failure && res.flatData) me.value = res.flatData;
}
async function loadMedals() {
    const res = await get<{ all: Medal[]; owned: string[] }>(API.GROWTH_MEDALS);
    if (!res._failure && res.flatData) {
        allMedals.value = res.flatData.all || [];
        ownedMedals.value = res.flatData.owned || [];
    }
}
async function loadRank() {
    const res = await get<RankUser[]>(API.GROWTH_RANK);
    if (!res._failure && res.flatData) rank.value = res.flatData || [];
}

onMounted(async () => {
    loadMe();
    loadMedals();
    loadRank();
    // 加载梗币余额
    try {
        const r = await get<{ balance: number }>(API.CHECKIN_WALLET);
        if (!r._failure && r.flatData) coinBalance.value = r.flatData.balance;
    } catch {}
});
</script>

<style scoped lang="scss">
.growth {
    max-width: 820px;
    margin: 0 auto;
    padding: 20px;
}
.page-title {
    font-size: 24px;
    margin: 0 0 4px;
}
.glow-text {
    background: linear-gradient(90deg, #ff6b35, #ffd666, #36cfc9, #409eff, #ff6b35);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-scroll 4s linear infinite;
}
@keyframes gradient-scroll {
    0% { background-position: 0% 50%; }
    100% { background-position: 300% 50%; }
}
.page-sub {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 16px;
}
.loading {
    text-align: center;
    color: #999;
    padding: 40px;
}
.spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #eee;
    border-top-color: #ff6b35;
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Level Card */
.level-card {
    display: flex;
    align-items: center;
    gap: 16px;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    color: #fff;
    position: relative;
    overflow: hidden;
}
.tier-1 { background: linear-gradient(135deg, #667eea, #764ba2); }
.tier-2 { background: linear-gradient(135deg, #6b8dd6, #8e37d7); }
.tier-3 { background: linear-gradient(135deg, #f7ba1e, #ff6b35); }
.tier-4 { background: linear-gradient(135deg, #ff6b35, #e74c3c); }
.tier-5 { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.tier-6 { background: linear-gradient(135deg, #c0392b, #8e44ad); }
.tier-7 { background: linear-gradient(135deg, #ffd700, #ff6b35, #e74c3c, #8e44ad); background-size: 400% 400%; animation: tier7-glow 3s ease infinite; }
@keyframes tier7-glow {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
.level-icon {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    flex-shrink: 0;
    position: relative;
}
.pulse-ring::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.5);
    animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}
.level-info { flex: 1; }
.level-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.exp-bar {
    height: 10px;
    background: rgba(255,255,255,0.3);
    border-radius: 5px;
    overflow: hidden;
}
.exp-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}
.fire-bar {
    background: linear-gradient(90deg, #ffd666, #ff6b35, #e74c3c);
    background-size: 200% 100%;
    animation: fire-shift 1.5s ease infinite;
}
@keyframes fire-shift {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
.fire-tip {
    position: absolute;
    right: 0;
    top: -3px;
    width: 16px;
    height: 16px;
    background: radial-gradient(circle, #ffd700, transparent 70%);
    border-radius: 50%;
    animation: fire-spark 0.8s ease-in-out infinite alternate;
}
@keyframes fire-spark {
    0% { transform: scale(0.8); opacity: 0.7; }
    100% { transform: scale(1.4); opacity: 1; }
}
.exp-text {
    font-size: 12px;
    margin-top: 6px;
    opacity: 0.9;
}
.sparkles {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #fff;
    border-radius: 50%;
    animation: sparkle-float 3s ease-in-out infinite;
}
.sparkle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 30%; right: 15%; animation-delay: 0.5s; }
.sparkle:nth-child(3) { bottom: 20%; left: 30%; animation-delay: 1s; }
.sparkle:nth-child(4) { top: 15%; right: 25%; animation-delay: 1.5s; }
.sparkle:nth-child(5) { bottom: 35%; left: 10%; animation-delay: 2s; }
.sparkle:nth-child(6) { top: 50%; right: 5%; animation-delay: 2.5s; }
@keyframes sparkle-float {
    0%,100% { opacity: 0; transform: translateY(0) scale(0); }
    50% { opacity: 1; transform: translateY(-15px) scale(1); }
}

/* Stats */
.stat-row {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
}
.stat-item {
    flex: 1;
    background: var(--card-bg);
    border: 1px solid var(--el-border-color-lighter, #f0f0f0);
    border-radius: 12px;
    padding: 14px 10px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}
.stat-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(255,107,53,0.12);
}
.stat-icon {
    display: block;
    font-size: 20px;
    margin-bottom: 4px;
}
.stat-num {
    display: block;
    font-size: 24px;
    font-weight: 900;
    background: linear-gradient(135deg, #ff6b35, #ffd666);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.stat-label {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}
.section-title {
    font-size: 16px;
    font-weight: 700;
    margin: 18px 0 10px;
    color: var(--body-color);
}

/* Medals */
.medals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
}
.medal {
    position: relative;
    perspective: 600px;
    height: 100px;
}
.medal-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}
.medal:hover .medal-inner {
    transform: rotateY(180deg);
}
.medal-front, .medal-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    padding: 10px;
}
.medal-front {
    background: var(--el-fill-color-light, #f5f5f5);
    border: 1px solid var(--el-border-color-lighter, #eee);
    filter: grayscale(1);
    opacity: 0.5;
}
.medal-back {
    background: linear-gradient(135deg, #fff7e6, #ffd666);
    border: 2px solid #ffd666;
    transform: rotateY(180deg);
}
.medal.owned .medal-front {
    background: linear-gradient(135deg, #fff7e6, #ffd666);
    border: 2px solid #ffd666;
    filter: none;
    opacity: 1;
}
.medal-icon {
    font-size: 30px;
    margin-bottom: 4px;
}
.medal-name {
    font-weight: 700;
    font-size: 13px;
    color: var(--body-color);
}
.medal-desc {
    font-size: 10px;
    color: #999;
    text-align: center;
    margin-top: 4px;
    line-height: 1.3;
    max-width: 110px;
}
.unlock-glow {
    position: absolute;
    inset: -2px;
    border-radius: 14px;
    background: linear-gradient(45deg, #ffd700, #ff6b35, #ffd700);
    background-size: 300% 300%;
    animation: glow-border 2s ease infinite;
    z-index: -1;
    filter: blur(4px);
    opacity: 0.5;
}
@keyframes glow-border {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Rank */
.rank-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.rank-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 8px;
    border-bottom: 1px dashed #f0f0f0;
    opacity: 0;
    animation: slide-in 0.4s ease forwards;
}
@keyframes slide-in {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}
.rank-item.self {
    background: linear-gradient(90deg, #fff7e6, transparent);
    border-radius: 8px;
    border-left: 3px solid #ffd666;
}
.rank-no {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #ff6b35;
    flex-shrink: 0;
}
.rank-no.crown {
    font-size: 18px;
    animation: crown-bounce 1.5s ease infinite;
}
@keyframes crown-bounce {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}
.rank-name { flex: 1; font-weight: 500; }
.rank-tier {
    background: linear-gradient(135deg, #e8f4fd, #d4eafc);
    color: #409eff;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
}
.rank-exp {
    color: #999;
    font-size: 13px;
    min-width: 70px;
    text-align: right;
}
.empty {
    color: #bbb;
    text-align: center;
    padding: 20px;
}

@media (max-width: 600px) {
    .stat-row { flex-wrap: wrap; }
    .stat-item { min-width: 45%; }
    .medals { grid-template-columns: repeat(2, 1fr); }
}

html.dark .page-sub,
html.dark .loading,
html.dark .rank-exp,
html.dark .empty {
    color: var(--el-text-color-secondary);
}

html.dark .spinner {
    border-color: var(--el-border-color);
    border-top-color: #ff6b35;
}

html.dark .rank-item {
    border-bottom-color: var(--el-border-color);
}

html.dark .rank-item.self {
    background: linear-gradient(90deg, rgba(255, 214, 102, 0.16), transparent);
}

html.dark .rank-tier {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}
</style>
