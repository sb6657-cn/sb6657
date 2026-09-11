<template>
    <div class="arena">
        <h2 class="page-title">⚔️ 烂梗对决擂台</h2>
        <p class="page-desc">
            每天 10 组烂梗捉对 PK，你来投票。每周日结算，按总得票排出当周 TOP 10。
            每条烂梗一辈子只上一次擂台，投过就不能再投。
        </p>

        <div v-if="loading" class="loading"><div class="spinner"></div></div>
        <template v-else>
            <!-- 今天的PK -->
            <div class="section">
                <h3 class="section-title">
                    今日对决
                    <span class="today-badge">{{ todayLabel }}</span>
                </h3>

                <div v-if="matches.length" class="pk-grid">
                    <div v-for="m in matches" :key="m.id" class="pk-card" :class="{ done: m.status === 'DONE', voted: m.voted }">
                        <div class="pk-group-no">#{{ m.groupNo }}</div>
                        <div class="pk-vs">
                            <div class="pk-fighter pk-a" :class="{ winner: m.status === 'DONE' && m.winner === 1, picked: m.voted && lastChoice[m.id] === 1 }" @click="vote(m, 1)">
                                <span class="pk-bar" :style="{ width: aPct(m) + '%' }"></span>
                                <span class="pk-text">{{ m.barrageA }}</span>
                                <span class="pk-votes">{{ aPct(m) }}%</span>
                            </div>
                            <div class="pk-vs-badge">VS</div>
                            <div class="pk-fighter pk-b" :class="{ winner: m.status === 'DONE' && m.winner === 2, picked: m.voted && lastChoice[m.id] === 2 }" @click="vote(m, 2)">
                                <span class="pk-bar" :style="{ width: bPct(m) + '%' }"></span>
                                <span class="pk-text">{{ m.barrageB }}</span>
                                <span class="pk-votes">{{ bPct(m) }}%</span>
                            </div>
                        </div>
                        <div class="pk-footer">
                            <span v-if="m.voted" class="voted-mark">✅ 已投</span>
                            <span v-else-if="m.status === 'RUNNING'" class="vote-hint">点击选项投票</span>
                            <span v-else class="done-mark">已结算</span>
                        </div>
                    </div>
                </div>
                <div v-else class="empty">今天还没有PK，零点后生成～</div>
            </div>

            <!-- 本周排行 -->
            <div class="section">
                <h3 class="section-title">
                    本周排行
                    <span class="week-range" v-if="weekStart">{{ weekStart }} ~ {{ weekEnd }}</span>
                </h3>

                <div v-if="weekRank.length" class="rank-table-wrap">
                    <table class="rank-table">
                        <thead>
                            <tr><th>#</th><th>烂梗</th><th>总得票</th><th>战绩</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="(r, ri) in weekRank" :key="ri" class="rank-row" :class="{ top3: ri < 3 }">
                                <td class="rank-no">
                                    <span class="medal" v-if="ri === 0">🥇</span>
                                    <span class="medal" v-else-if="ri === 1">🥈</span>
                                    <span class="medal" v-else-if="ri === 2">🥉</span>
                                    <span v-else>{{ ri + 1 }}</span>
                                </td>
                                <td class="rank-barrage">{{ r.barrage || r.barrageText }}</td>
                                <td class="rank-votes">{{ r.totalVotes || 0 }}</td>
                                <td class="rank-daily">
                                    <template v-if="r.dailyResults">
                                        <span class="daily-chips">
                                            <span v-for="d in dailyParsed(r)" :key="d.pkDate" class="day-chip" :class="{ win: d.won }">
                                                {{ dayShort(d.pkDate) }} {{ d.won ? '胜' : '负' }}
                                            </span>
                                        </span>
                                    </template>
                                    <span v-else>-</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty">本周暂无排行数据</div>
            </div>

            <!-- 历史周排行 -->
            <div class="section">
                <h3 class="section-title">历史周排行</h3>
                <div v-if="historyWeeks.length" class="history-list">
                    <div v-for="h in historyWeeks" :key="h.weekStart" class="history-week" @click="toggleHistory(h)">
                        <div class="hw-bar">
                            <span class="hw-label">{{ h.weekStart }} ~ {{ h.weekEnd }}</span>
                            <span class="hw-arrow" :class="{ open: h.expanded }">▶</span>
                        </div>
                        <div v-if="h.expanded && h.details" class="hw-detail">
                            <div v-for="(r, ri) in h.details" :key="ri" class="hw-item">
                                <span class="hw-no">{{ r.rankNo }}.</span>
                                <span class="hw-text">{{ r.barrage }}</span>
                                <span class="hw-votes">{{ r.totalVotes }}票</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty">还没有历史排行</div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { API } from '@/constants/backend';
import { get, post } from '@/apis/httpInstance';
import { ElMessage } from 'element-plus';

interface Match {
    id: number; groupNo: number;
    barrageIdA: number; barrageA: string;
    barrageIdB: number; barrageB: string;
    voteA: number; voteB: number;
    status: string; voted: boolean; winner: number | null;
    pkDate: string;
}

interface WeekRankItem {
    barrageId?: number; barrage?: string; barrageText?: string;
    totalVotes: number; rankNo?: number;
    dailyResults?: string; // JSON string
    weekStart?: string; weekEnd?: string;
}

const loading = ref(true);
const matches = ref<Match[]>([]);
const todayLabel = ref('');
const weekStart = ref('');
const weekEnd = ref('');
const weekRank = ref<WeekRankItem[]>([]);
const lastChoice = ref<Record<number, number>>({});
const historyWeeks = ref<{ weekStart: string; weekEnd: string; expanded: boolean; details: WeekRankItem[] | null }[]>([]);

const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateLabel(d: string) {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    if (isNaN(date.getTime())) return d;
    const m = date.getMonth() + 1;
    const day = date.getDate();
    const wd = weekDayNames[date.getDay()];
    return `周${wd} ${m}/${day}`;
}

function aPct(m: Match) { const t = (m.voteA || 0) + (m.voteB || 0); return t === 0 ? 50 : Math.round((m.voteA / t) * 100); }
function bPct(m: Match) { return 100 - aPct(m); }

function dayShort(d: string) {
    if (!d) return '';
    const parts = d.split('-');
    return parts.length >= 2 ? `${parseInt(parts[1])}/${parseInt(parts[2])}` : d;
}

function dailyParsed(r: WeekRankItem): any[] {
    if (!r.dailyResults) return [];
    try { return JSON.parse(r.dailyResults); } catch { return []; }
}

async function loadCurrent() {
    loading.value = true;
    const res = await get<any>(API.ARENA_CURRENT);
    loading.value = false;
    if (res._failure || !res.flatData) return;

    const d = res.flatData;
    matches.value = d.matches || [];
    todayLabel.value = formatDateLabel(d.todayPkDate || '');
    weekStart.value = d.weekStart || '';
    weekEnd.value = d.weekEnd || '';
    weekRank.value = d.weekRank || [];
}

async function vote(m: Match, choice: number) {
    if (m.voted) { ElMessage.warning('已经投过票啦'); return; }
    if (m.status === 'DONE') { ElMessage.warning('该对局已结束'); return; }
    const res = await post({ url: API.ARENA_VOTE, data: { matchId: m.id, choice } });
    if (res._failure) { ElMessage.warning('投票失败'); return; }
    lastChoice.value[m.id] = choice;
    ElMessage.success('投票成功！');
    // 刷新数据
    await loadCurrent();
}

async function loadHistory() {
    const res = await get<any[]>(API.ARENA_WEEKLY);
    if (res._failure || !res.flatData) return;

    // 按周分组
    const grouped: Record<string, { weekStart: string; weekEnd: string; items: WeekRankItem[] }> = {};
    for (const item of res.flatData) {
        const key = item.weekStart;
        if (!grouped[key]) {
            grouped[key] = { weekStart: item.weekStart, weekEnd: item.weekEnd, items: [] };
        }
        grouped[key].items.push(item);
    }
    historyWeeks.value = Object.values(grouped).map(g => ({
        weekStart: g.weekStart,
        weekEnd: g.weekEnd,
        expanded: false,
        details: null,
    }));
}

async function toggleHistory(h: typeof historyWeeks.value[0]) {
    h.expanded = !h.expanded;
    if (h.expanded && !h.details) {
        const res = await get<any[]>(API.ARENA_WEEKLY_DETAIL + h.weekStart);
        if (!res._failure && res.flatData) {
            h.details = res.flatData;
        }
    }
}

onMounted(() => {
    loadCurrent();
    loadHistory();
});
</script>

<style scoped lang="scss">
.arena {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background: var(--content-bg);
}
.page-title {
    font-size: 26px; font-weight: 900;
    background: linear-gradient(90deg, #e74c3c, #ff6b35, #ffd700);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 6px;
}
.page-desc {
    color: var(--body-color); font-size: 14px; line-height: 1.7;
    margin: 0 0 20px;
    background: var(--card-bg);
    border-radius: 8px;
    padding: 12px 16px;
    border-left: 3px solid #ff6b35;
    opacity: 0.85;
}
.loading { text-align: center; color: #999; padding: 40px; }
.spinner {
    width: 36px; height: 36px; border: 3px solid #eee; border-top-color: #e74c3c;
    border-radius: 50%; margin: 0 auto; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.section { margin-bottom: 24px; }

.section-title {
    font-size: 18px; font-weight: 700; margin: 0 0 12px;
    display: flex; align-items: center; gap: 10px;
}
.today-badge {
    font-size: 12px; font-weight: 600;
    background: linear-gradient(135deg, #e74c3c, #ff6b35);
    color: #fff; padding: 2px 10px; border-radius: 10px;
}
.week-range { font-size: 13px; color: #999; font-weight: 400; }

/* PK Grid */
.pk-grid { display: flex; flex-direction: column; gap: 10px; }

.pk-card {
    background: var(--card-bg); border: 2px solid var(--el-border-color-lighter, #f0f0f0); border-radius: 12px;
    padding: 14px 16px; position: relative; transition: 0.3s;
}
.pk-card.done { opacity: 0.7; }
.pk-card.voted { border-color: #e8f5e9; }

.pk-group-no {
    position: absolute; top: -6px; left: 12px;
    font-size: 11px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #e74c3c, #ff6b35);
    padding: 1px 8px; border-radius: 8px;
}

.pk-vs {
    display: flex; align-items: stretch; gap: 8px; margin-top: 2px;
}
.pk-fighter {
    flex: 1; position: relative; border: 2px solid #eee; border-radius: 10px;
    padding: 10px 12px; cursor: pointer; overflow: hidden;
    transition: 0.25s; min-height: 56px; display: flex; flex-direction: column;
    justify-content: center;
}
.pk-fighter:hover { border-color: #ff6b35; }
.pk-fighter.picked { border-color: #ff6b35; background: #fff7f0; }
.pk-fighter.winner { border-color: #ffd700; box-shadow: 0 0 12px rgba(255,215,0,0.2); }
.pk-bar {
    position: absolute; left: 0; top: 0; bottom: 0;
    background: linear-gradient(90deg, rgba(255,107,53,0.06), rgba(255,107,53,0.14));
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); z-index: 0;
}
.pk-text { position: relative; font-size: 14px; font-weight: 600; z-index: 1; line-height: 1.4; }
.pk-votes { position: relative; z-index: 1; font-weight: 900; color: #ff6b35; margin-top: 4px; font-size: 16px; }

.pk-vs-badge {
    flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #e74c3c, #ff6b35);
    color: #fff; font-weight: 900; font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    align-self: center;
}

.pk-footer { text-align: center; margin-top: 6px; font-size: 12px; }
.voted-mark { color: #52c41a; font-weight: 600; }
.vote-hint { color: #bbb; }
.done-mark { color: #999; }

/* Week Rank */
.rank-table-wrap { background: var(--card-bg); border-radius: 10px; overflow: hidden; }
.rank-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.rank-table th {
    background: var(--el-fill-color-light, #fafafa); color: var(--body-color); font-weight: 600; font-size: 12px;
    padding: 10px 12px; text-align: left; border-bottom: 2px solid var(--el-border-color-lighter, #f0f0f0);
}
.rank-table td { padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter, #f5f5f5); }
.rank-row.top3 { font-weight: 700; }
.rank-no { text-align: center; width: 36px; }
.medal { font-size: 18px; }
.rank-barrage { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-votes { font-weight: 700; color: #ff6b35; width: 60px; }
.rank-daily { font-size: 12px; }
.daily-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.day-chip {
    font-size: 11px; padding: 1px 6px; border-radius: 6px;
    background: var(--el-fill-color-light, #f0f0f0); color: var(--body-color);
    opacity: 0.6;
}
.day-chip.win { background: #f6ffed; color: #52c41a; }

/* History */
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-week {
    background: var(--card-bg); border-radius: 8px; padding: 10px 14px;
    cursor: pointer; transition: 0.2s;
}
.history-week:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.hw-bar { display: flex; justify-content: space-between; align-items: center; }
.hw-label { font-weight: 600; font-size: 14px; }
.hw-arrow { font-size: 12px; color: #bbb; transition: transform 0.3s; }
.hw-arrow.open { transform: rotate(90deg); }
.hw-detail { margin-top: 10px; border-top: 1px solid #f0f0f0; padding-top: 8px; }
.hw-item { display: flex; gap: 8px; padding: 4px 0; font-size: 13px; align-items: center; }
.hw-no { color: #ff6b35; font-weight: 700; min-width: 20px; }
.hw-text { flex: 1; }
.hw-votes { color: #999; font-size: 12px; }

.empty { color: #bbb; text-align: center; padding: 30px; font-size: 14px; }

@media (max-width: 600px) {
    .pk-vs { flex-direction: column; }
    .pk-vs-badge { width: 100%; height: 28px; border-radius: 6px; }
    .rank-barrage { max-width: 160px; }
}

html.dark .loading,
html.dark .week-range,
html.dark .hw-votes,
html.dark .empty {
    color: var(--el-text-color-secondary);
}

html.dark .spinner {
    border-color: var(--el-border-color);
    border-top-color: #e74c3c;
}

html.dark .pk-fighter {
    border-color: var(--el-border-color);
}

html.dark .pk-fighter.picked {
    background: rgba(255, 107, 53, 0.12);
}

html.dark .day-chip.win {
    background: rgba(82, 196, 26, 0.16);
}

html.dark .hw-detail {
    border-top-color: var(--el-border-color);
}
</style>