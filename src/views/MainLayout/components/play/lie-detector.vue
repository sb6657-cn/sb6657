<template>
    <div class="lie">
        <!-- 左：测谎仪主体（始终可见） -->
        <aside class="lie-aside">
            <header class="brand">
                <div class="brand-mark">
                    <span class="brand-dot"></span>
                    <span class="brand-name">测谎仪</span>
                </div>
                <div class="brand-meta">
                    <span class="brand-meta-row"><span class="meta-key">机号</span><span class="meta-val">HG-6657</span></span>
                    <span class="brand-meta-row"><span class="meta-key">编号</span><span class="meta-val mono">{{ sessionId }}</span></span>
                    <span class="brand-meta-row"><span class="meta-key">状态</span><span class="meta-val status-{{ sessionStatus }}">{{ statusLabel }}</span></span>
                </div>
            </header>

            <section class="gauge-wrap" :class="gaugeState">
                <div class="gauge-frame">
                    <!-- 经典测谎仪：实心绿/红半圆 + 沿弧文字 + 深色表壳 -->
                    <svg class="gauge-arc" viewBox="-118 -128 236 138" preserveAspectRatio="xMidYMax meet">
                        <defs>
                            <!-- 沿弧文字的隐藏路径（半径 82，避免压到刻度数字） -->
                            <path id="truth-curve" d="M -78,-22 A 82,82 0 0,1 -22,-78" />
                            <path id="lie-curve" d="M 22,-78 A 82,82 0 0,1 78,-22" />
                        </defs>
                        <!-- 1. 外圈表壳 bezel（深色 housing） -->
                        <path d="M -110,0 A 110,110 0 0,1 110,0 Z" class="arc-bezel" />
                        <path d="M -106,0 A 106,106 0 0,1 106,0 Z" class="arc-bezel-inner" />
                        <!-- 2. 左侧绿色 TRUTH 半圆（实心填满整个左半圆） -->
                        <path d="M -100,0 A 100,100 0 0,1 0,-100 L 0,0 Z" class="arc-truth" />
                        <!-- 3. 右侧红色 LIE 半圆（实心填满整个右半圆） -->
                        <path d="M 0,-100 A 100,100 0 0,1 100,0 L 0,0 Z" class="arc-lie" />
                        <!-- 4. 中央白色分隔线 -->
                        <line x1="0" y1="-100" x2="0" y2="0" class="arc-divider" />
                        <!-- 5. 沿弧文字 TRUTH / LIE -->
                        <text class="arc-text">
                            <textPath href="#truth-curve" startOffset="50%" text-anchor="middle"
                                      class="arc-text-truth">TRUTH</textPath>
                        </text>
                        <text class="arc-text">
                            <textPath href="#lie-curve" startOffset="50%" text-anchor="middle"
                                      class="arc-text-lie">LIE</textPath>
                        </text>
                        <!-- 6. 刻度线：长短交替，主刻度更明显 -->
                        <g class="arc-ticks">
                            <line v-for="n in 11" :key="'tk'+n"
                                  :x1="Math.cos((n * 18 - 90) * Math.PI / 180) * (n % 2 === 0 ? 86 : 94)"
                                  :y1="Math.sin((n * 18 - 90) * Math.PI / 180) * (n % 2 === 0 ? 86 : 94)"
                                  :x2="Math.cos((n * 18 - 90) * Math.PI / 180) * 100"
                                  :y2="Math.sin((n * 18 - 90) * Math.PI / 180) * 100"
                                  :class="n === 6 ? 'tick-major' : 'tick-minor'" />
                        </g>
                        <!-- 7. 刻度数字：-90 / -45 / 0 / 45 / 90 -->
                        <g class="arc-numbers">
                            <text x="-78" y="-50" class="arc-num" text-anchor="middle">-90</text>
                            <text x="-47" y="-97" class="arc-num" text-anchor="middle">-45</text>
                            <text x="0" y="-106" class="arc-num arc-num-mid" text-anchor="middle">0</text>
                            <text x="47" y="-97" class="arc-num" text-anchor="middle">45</text>
                            <text x="78" y="-50" class="arc-num" text-anchor="middle">90</text>
                        </g>
                    </svg>
                    <!-- 指针：经典黑色三角针（clip-path 切三角） -->
                    <div class="gauge-needle" :style="{ transform: 'rotate(' + needleAngle + 'deg)' }">
                        <span class="needle-spike"></span>
                    </div>
                    <!-- 圆心轴：外环 + 内芯螺丝 -->
                    <div class="gauge-pivot">
                        <span class="pivot-ring"></span>
                        <span class="pivot-screw"></span>
                    </div>
                    <!-- 中心度数（圆心下方，随状态变色） -->
                    <div class="gauge-cap">
                        <span class="cap-num mono" :class="'cap-' + gaugeState">{{ Math.abs(Math.round(needleAngle)) }}</span>
                        <span class="cap-unit">°</span>
                    </div>
                </div>
                <div class="gauge-readout">
                    <span class="readout-row"><span class="dot dot-pulse"></span>心率基线 · 正常</span>
                    <span class="readout-row"><span class="mono">{{ pulse }}</span> BPM</span>
                </div>
                <!-- 心电图：顶栏 + 双层网格 + 波形 + 扫描光标 -->
                <div class="ecg-wrap">
                    <header class="ecg-header">
                        <span class="ecg-lead">LEAD II · CS2</span>
                        <span class="ecg-meta">
                            <span class="ecg-meta-key">HR</span>
                            <span class="ecg-bpm mono" :style="{ color: ecgStroke }">{{ pulse }}</span>
                            <span class="ecg-meta-unit">BPM</span>
                        </span>
                    </header>
                    <svg class="ecg" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
                        <!-- 网格：细线（10 单位） -->
                        <g class="ecg-grid-fine">
                            <line v-for="i in 16" :key="'hf'+i" x1="0" :y1="i * 5" x2="300" :y2="i * 5" />
                            <line v-for="i in 31" :key="'vf'+i" :x1="i * 10" y1="0" :x2="i * 10" y2="80" />
                        </g>
                        <!-- 网格：粗线（50 单位） -->
                        <g class="ecg-grid-major">
                            <line v-for="i in 7" :key="'hm'+i" x1="0" :y1="i * 10 + 5" x2="300" :y2="i * 10 + 5" />
                            <line v-for="i in 7" :key="'vm'+i" :x1="i * 50" y1="0" :x2="i * 50" y2="80" />
                        </g>
                        <!-- 扫描线（从右往左动） -->
                        <line class="ecg-scan" x1="0" y1="0" x2="0" y2="80" />
                        <!-- 心电图波形 -->
                        <polyline class="ecg-line" :points="ecgPoints" />
                        <!-- 当前位置指示圆 -->
                        <circle :cx="ecgCursorX" cy="40" r="3" :style="{ fill: ecgStroke }">
                            <animate attributeName="r" :values="`2.5;4;2.5`" dur="0.9s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.9s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                </div>
            </section>

            <section class="ticker">
                <div class="ticker-label">对话记录</div>
                <div class="ticker-body">
                    <div v-for="(d, i) in visibleDialogs" :key="i" class="ticker-row">
                        <span class="ticker-ts mono">{{ String(i + 1).padStart(2, '0') }}</span>
                        <span class="ticker-speaker">{{ d.speaker }}</span>
                        <span class="ticker-text">{{ d.content }}</span>
                    </div>
                </div>
            </section>
        </aside>

        <!-- 右：操作台 -->
        <main class="lie-main">
            <!-- 顶部模式 -->
            <nav class="modes">
                <button v-for="m in modeList" :key="m.id"
 class="mode-btn"
                        :class="{ active: mode===m.id && !showRank }"
                        @click="switchMode(m.id)">
                    <span class="mode-num mono">{{ m.num }}</span>
                    <span class="mode-name">{{ m.name }}</span>
                </button>
                <button class="mode-btn leader" :class="{ active:showRank }" @click="showRank = !showRank">
                    <span class="mode-num mono">04</span>
                    <span class="mode-name">排行榜</span>
                </button>
            </nav>

            <!-- 难度条 -->
            <div class="difficulty">
                <span class="diff-key">题目难度</span>
                <div class="diff-track">
                    <button v-for="d in 3" :key="d"
 class="diff-stop" :class="{ on: difficulty===d, filled: difficulty>=d }"
                            @click="setDifficulty(d)">
                        <span class="diff-num mono">{{ ['简单','一般','硬核'][d-1] }}</span>
                    </button>
                </div>
                <span class="diff-tag mono">{{ ['入门','熟练','地狱'][difficulty-1] }}</span>
            </div>

            <!-- 战绩条 -->
            <div class="record" v-if="myRecord">
                <div class="record-cell">
                    <span class="cell-key">答对</span>
                    <span class="cell-val mono">{{ myRecord.score }}</span>
                </div>
                <div class="record-sep"></div>
                <div class="record-cell">
                    <span class="cell-key">总题</span>
                    <span class="cell-val mono">{{ myRecord.total }}</span>
                </div>
                <div class="record-sep"></div>
                <div class="record-cell">
                    <span class="cell-key">准确率</span>
                    <span class="cell-val mono">{{ accuracy }}%</span>
                </div>
            </div>

            <!-- 排行 -->
            <section v-if="showRank" class="rank-section">
                <header class="panel-head">
                    <span class="panel-num mono">04</span>
                    <span class="panel-title">排行榜</span>
                </header>
                <div v-if="rankList.length" class="rank-table">
                    <div class="rank-row rank-head">
                        <span class="rk-no">#</span>
                        <span class="rk-name">玩家</span>
                        <span class="rk-acc mono">答对</span>
                        <span class="rk-tot mono">答题</span>
                    </div>
                    <div v-for="(r, i) in rankList" :key="r.userId" class="rank-row" :class="{ top:i<3 }">
                        <span class="rk-no mono">{{ String(i+1).padStart(2,'0') }}</span>
                        <span class="rk-name">{{ r.nickName }}</span>
                        <span class="rk-acc mono">{{ r.score }}</span>
                        <span class="rk-tot mono">{{ r.total }}</span>
                    </div>
                </div>
                <div v-else class="empty-panel">还没有人上榜 — 你来当第一个</div>
            </section>

            <!-- 选队伍（入场 · 只在未进入出题时显示） -->
            <section v-if="canShowEntry" class="entry">
                <header class="panel-head">
                    <span class="panel-num mono">{{ entryStep }}</span>
                    <span class="panel-title">选一支队伍</span>
                </header>
                <div class="team-pool">
                    <button class="team-chip team-chip-random" @click="start(0)">
                        <span class="chip-num mono">全</span>
                        <span class="chip-name">随机抽</span>
                        <span class="chip-sub">40 队随便问</span>
                    </button>
                    <button v-for="t in teams" :key="t.id" class="team-chip" @click="start(t.id)">
                        <span class="chip-num mono">{{ String(t.place).padStart(2,'0') }}</span>
                        <span class="chip-name">{{ t.name }}</span>
                        <span class="chip-sub">{{ t.points }} 积分</span>
                    </button>
                </div>
            </section>

            <!-- 判真假：出题 -->
            <section v-if="mode==='lie' && stage===2 && round && !showRank" class="case">
                <header class="panel-head">
                    <span class="panel-num mono">{{ entryStep }}</span>
                    <span class="panel-title">下面这句是真是假</span>
                    <span class="panel-tag mono">{{ factLabelText(round.factLabel) }}</span>
                </header>
                <article class="claim">
                    <p class="claim-body">{{ round.claim }}</p>
                    <p class="claim-ref">关于选手 <strong>{{ round.playerName }}</strong></p>
                </article>
                <div class="action-bar">
                    <button class="action action-truth" :disabled="judging" @click="judge(true)">
                        <span class="action-label">真话</span>
                        <span class="action-sub">我相信他说的是真话</span>
                    </button>
                    <button class="action action-lie" :disabled="judging" @click="judge(false)">
                        <span class="action-label">假话</span>
                        <span class="action-sub">他在说谎</span>
                    </button>
                </div>
                <div v-if="judging" class="scan-line">
                    <span class="scan-text">指针正在读取心率</span>
                    <span class="scan-bar"></span>
                </div>
            </section>

            <!-- 他是谁：线索 + 选项 -->
            <section v-if="mode==='who' && whoStage===2 && whoQ && !showRank" class="case">
                <header class="panel-head">
                    <span class="panel-num mono">{{ entryStep }}</span>
                    <span class="panel-title">猜猜这位选手是谁</span>
                </header>
                <ul class="clues">
                    <li v-for="(c, i) in whoQ.clues" :key="i" class="clue">
                        <span class="clue-num mono">{{ String(i+1).padStart(2,'0') }}</span>
                        <span class="clue-text">{{ c }}</span>
                    </li>
                </ul>
                <div class="option-grid">
                    <button v-for="o in whoQ.options" :key="o.id" class="option"
                            :disabled="whoJudging" @click="guess(o.id)">
                        <span class="opt-name">{{ o.name }}</span>
                        <span class="opt-meta mono">第 {{ o.teamPlace }} 名战队</span>
                    </button>
                </div>
            </section>

            <!-- 猜 rating -->
            <section v-if="mode==='rating' && ratingStage===2 && ratingRound && !showRank" class="case">
                <header class="panel-head">
                    <span class="panel-num mono">{{ entryStep }}</span>
                    <span class="panel-title">这两人谁的评分更高</span>
                </header>
                <div class="duel">
                    <button class="duel-side" :disabled="ratingJudging"
                            @click="judgeRating(ratingRound.playerAId)">
                        <span class="duel-name">{{ ratingRound.playerAName }}</span>
                        <span class="duel-meta mono">选手 A</span>
                    </button>
                    <div class="duel-vs">
                        <span class="vs-num mono">VS</span>
                        <span class="vs-sub">谁的评分更高</span>
                    </div>
                    <button class="duel-side" :disabled="ratingJudging"
                            @click="judgeRating(ratingRound.playerBId)">
                        <span class="duel-name">{{ ratingRound.playerBName }}</span>
                        <span class="duel-meta mono">选手 B</span>
                    </button>
                </div>
                <div v-if="ratingJudging" class="scan-line">
                    <span class="scan-text">揭晓中</span>
                    <span class="scan-bar"></span>
                </div>
            </section>

            <!-- 揭晓（共用） -->
            <section v-if="revealVisible && reveal && !showRank" class="verdict" :class="reveal.correct ? 'is-truth' : 'is-lie'">
                <header class="panel-head">
                    <span class="panel-num mono">{{ entryStep }}</span>
                    <span class="panel-title">揭晓答案</span>
                    <span class="panel-tag mono">{{ reveal.correct ? '答对了' : '答错了' }}</span>
                </header>
                <p class="verdict-head">{{ reveal.correct ? '你的判断是对的' : '你的判断是错的' }}</p>
                <template v-if="reveal.player">
                    <dl class="verdict-data">
                        <div><dt>选手</dt><dd>{{ reveal.player.name }}</dd></div>
                        <div><dt>所在战队</dt><dd class="mono">第 {{ reveal.player.teamPlace }} 名</dd></div>
                        <div><dt>身份</dt><dd>{{ roleText(reveal.player.role) }}</dd></div>
                        <div><dt>效力时间</dt><dd>{{ reveal.player.timeOnTeam }}</dd></div>
                        <div><dt>出场次数</dt><dd class="mono">{{ reveal.player.mapsPlayed }} 场</dd></div>
                    </dl>
                </template>
                <p v-if="mode==='lie' && round" class="verdict-note">这句陈述本身：<strong>{{ round.isTrueStmt ? '是真的' : '是假的' }}</strong></p>
                <p v-if="mode==='rating' && ratingRound" class="verdict-note">
                    <span class="mono">{{ ratingRound.playerAName }} 评分 {{ ratingRound.ratingA.toFixed(2) }}</span>
                    ·
                    <span class="mono">{{ ratingRound.playerBName }} 评分 {{ ratingRound.ratingB.toFixed(2) }}</span>
                </p>
                <div class="verdict-row">
                    <button class="ghost-btn" @click="nextRound()">下一题</button>
                    <button class="ghost-btn ghost-btn-alt" @click="backToPick()">换支队伍</button>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import {
    lieDetectorAPI, type LieRound, type LieAnswer, type Cs2Team,
    type WhoQuestion, type WhoAnswer, type LieScore, type RatingRound,
} from '@/apis/lieDetector'
import { ElMessage } from 'element-plus'

const mode = ref<'lie' | 'who' | 'rating'>('lie')
const difficulty = ref<number>(2)
const teams = ref<Cs2Team[]>([])
const stage = ref<number>(1)
const whoStage = ref<number>(1)
const ratingStage = ref<number>(1)
const round = ref<LieRound | null>(null)
const whoQ = ref<WhoQuestion | null>(null)
const ratingRound = ref<RatingRound | null>(null)
const reveal = ref<{ correct: boolean; player: any | null } | null>(null)
const revealVisible = ref<boolean>(false)
const judging = ref<boolean>(false)
const whoJudging = ref<boolean>(false)
const ratingJudging = ref<boolean>(false)
const needleAngle = ref<number>(-90)
const visibleDialogs = ref<{ speaker: string; content: string }[]>([])
const myRecord = ref<LieScore | null>(null)
const rankList = ref<LieScore[]>([])
const showRank = ref<boolean>(false)

// 选队区只在"选队阶段 + 未揭晓 + 未开排行榜" 时显示
const canShowEntry = computed(() => {
    if (revealVisible.value) return false
    if (showRank.value) return false
    if (mode.value === 'rating') return false
    if (mode.value === 'lie') return stage.value === 1
    if (mode.value === 'who') return whoStage.value === 1
    return false
})

// 当前阶段的编号（跟着状态走）
// 仪表盘状态：决定半圆的整体色调
const gaugeState = computed(() => {
    if (needleAngle.value < -10) return 'truth'
    if (needleAngle.value > 10) return 'lie'
    return 'idle'
})

const entryStep = computed(() => {
    if (revealVisible.value) return '03'
    if (canShowEntry.value) return '01'
    // 出题中：判真假/他是谁 是 02，猜 rating 也是 02（直接开局）
    return '02'
})

const sessionId = computed(() => String(Date.now()).slice(-6))
const sessionStatus = computed(() => {
    if (revealVisible.value) return 'verdict'
    if (judging.value || ratingJudging.value || whoJudging.value) return 'reading'
    if (stage.value === 2 || whoStage.value === 2 || ratingStage.value === 2) return 'live'
    return 'idle'
})
const statusLabel = computed(() => ({
    idle: '待审',
    live: '审讯中',
    reading: '采集中',
    verdict: '已裁决',
}[sessionStatus.value]))
const pulse = ref(72)
const ecgPoints = ref<string>('0,40 50,40 60,40 70,40')
const ecgCursorX = ref(0)

// ECG 颜色随阶段联动：默认绿 / 采集中琥珀 / 裁决后按对错变绿/红
const ecgStroke = computed(() => {
    if (sessionStatus.value === 'verdict') {
        return reveal.value?.correct ? '#2BC97A' : '#E04A38'
    }
    if (sessionStatus.value === 'reading') return '#F2B83D'
    return '#2BC97A'
})

// 指针尖端颜色（与仪表盘色调统一）
const gaugeNeedleColor = computed(() => {
    if (needleAngle.value < -10) return 'var(--green)'
    if (needleAngle.value > 10) return 'var(--red)'
    return 'var(--ink)'
})

// 心电图常量
const ECG_W = 300
const ECG_H = 80
const ECG_BEAT = 90
let ecgOffset = 0

/**
 * 心电图波形：给定 phase ∈ [0, ECG_BEAT)，返回 y 偏移量（基线=0）
 * 真实人体 PQRST 形态：P波圆顶 / QRS 锐利尖峰 / T波宽缓 / 基线带噪点
 */
function ecgY(phase: number): number {
    // P波：12-26，圆顶小波，峰高 ~7
    if (phase >= 12 && phase < 26) {
        const t = (phase - 12) / 14
        return -7 * Math.sin(t * Math.PI)
    }
    // Q波：30-33，轻微下探 ~3
    if (phase >= 30 && phase < 33) {
        const t = (phase - 30) / 3
        return 3 * Math.sin(t * Math.PI * 0.5)
    }
    // R波：33-38，大尖峰（朝上 = 负 y）
    if (phase >= 33 && phase < 38) {
        const t = (phase - 33) / 5
        // 急升 (0→0.3) → 峰 (-38) → 急降 (0.3→0.7) → 弱反 (0.7→1.0)
        if (t < 0.3) return -38 * (t / 0.3)
        if (t < 0.55) return -38 + 38 * ((t - 0.3) / 0.25)
        if (t < 0.8) return 0 - 6 * ((t - 0.55) / 0.25)
        return -6 + 14 * ((t - 0.8) / 0.2)
    }
    // S波：38-44，深谷 + 回升
    if (phase >= 38 && phase < 44) {
        const t = (phase - 38) / 6
        return 8 * Math.sin(t * Math.PI)
    }
    // T波：55-75，宽缓圆顶，峰高 ~6
    if (phase >= 55 && phase < 75) {
        const t = (phase - 55) / 20
        return -6 * Math.sin(t * Math.PI)
    }
    // 基线：±0.6 随机噪点（模拟人体微抖）
    return (Math.random() - 0.5) * 1.2
}

function startEcg(): void {
    setInterval(() => {
        ecgOffset = (ecgOffset + 2) % ECG_BEAT
        const xs: number[] = []
        const ys: number[] = []
        // 2px 步进：波形更平滑；y 用小数保留细节
        for (let x = 0; x <= ECG_W; x += 2) {
            const phase = (x + ecgOffset) % ECG_BEAT
            xs.push(x)
            ys.push(40 + Math.round(ecgY(phase) * 10) / 10)
        }
        ecgPoints.value = xs.map((xx, i) => `${xx},${ys[i]}`).join(' ')
        ecgCursorX.value = ECG_W - (ecgOffset % ECG_W)
        // BPM 根据状态做软收敛 + 偶尔微抖
        if (Math.random() < 0.08) {
            const target = sessionStatus.value === 'verdict'
                ? (reveal.value?.correct ? 78 : 96)
                : sessionStatus.value === 'reading' ? 88
                : 72
            const jitter = (Math.random() - 0.5) * 3
            pulse.value = Math.round(
                Math.max(58, Math.min(120, pulse.value + (target - pulse.value) * 0.25 + jitter))
            )
        }
    }, 33)  // ~30fps，比之前 25fps 更顺滑
}
const accuracy = computed(() => {
    const r = myRecord.value
    if (!r || !r.total) return 0
    return Math.round((r.score / r.total) * 100)
})
const modeList = [
    { id: 'lie' as const, num: '01', name: '判真假' },
    { id: 'who' as const, num: '02', name: '他是谁' },
    { id: 'rating' as const, num: '03', name: '评级对决' },
]
const stageFlowLocked = ref<boolean>(false)

const avatar = (s: string): string => (s === '测谎仪' ? '·' : '#')

function factLabelText(label: string): string {
    return ({
        '效力时长': '问效力时间',
        '出战地图数': '问出场次数',
        '队内位置': '问职位',
        '国籍': '问国籍',
    } as Record<string, string>)[label] || label
}

function roleText(role: string | null | undefined): string {
    if (!role) return '选手'
    const r = role.toUpperCase()
    if (r === 'STARTER') return '首发选手'
    if (r === 'BENCHED') return '替补'
    if (r === 'COACH') return '教练'
    if (r === 'RETIRED') return '已退役'
    return role
}

function pushDialog(speaker: string, content: string): void {
    visibleDialogs.value.push({ speaker, content })
    if (visibleDialogs.value.length > 8) visibleDialogs.value.shift()
}

function getAnonymousUserId(): number {
    const KEY = 'lie_anon_uid'
    try {
        // 优先用已有的 siteToken cookie（httpInstance 拦截器已自动维护）
        const cookies = (document.cookie || '').split(';')
        let siteToken = ''
        for (const c of cookies) {
            const [k, v] = c.trim().split('=')
            if (k === 'siteToken' && v) { siteToken = v; break }
        }
        if (siteToken) {
            // 把 siteToken 哈希成稳定短数字（10位以内）
            let hash = 0
            for (let i = 0; i < siteToken.length; i++) {
                hash = ((hash << 5) - hash) + siteToken.charCodeAt(i)
                hash |= 0
            }
            return Math.abs(hash) % 900000000
        }
        // fallback：自己生成并存
        let v = localStorage.getItem(KEY)
        if (v) return parseInt(v, 10)
        v = Math.floor(100000 + Math.random() * 900000).toString()
        localStorage.setItem(KEY, v)
        return parseInt(v, 10)
    } catch (e) {
        return Math.floor(100000 + Math.random() * 900000)
    }
}

const anonId = ref<number>(getAnonymousUserId())

async function scrollToCase(): Promise<void> {
    await nextTick()
    const el = document.querySelector('.lie-main') as HTMLElement | null
    const target = document.querySelector('.case') as HTMLElement | null
    if (!el || !target) return
    const top = target.offsetTop - 12
    el.scrollTo({ top, behavior: 'smooth' })
}

async function load(): Promise<void> {
    try {
        const t = await lieDetectorAPI.getTeams(40)
        if (t.code === 200) teams.value = t.data || []
        const s = await lieDetectorAPI.myScore(anonId.value)
        if (s.code === 200) myRecord.value = s.data || null
        const r = await lieDetectorAPI.getRank(10)
        if (r.code === 200) rankList.value = r.data || []
    } catch (e) { /* 忽略 */ }
    pushDialog('6657', '欢迎来到测谎仪。请选择受审对象。')
    pushDialog('测谎仪', '系统就绪。')
}

function setDifficulty(d: number): void {
    difficulty.value = d
}

function switchMode(m: 'lie' | 'who' | 'rating'): void {
    mode.value = m
    revealVisible.value = false
    showRank.value = false
    // 重置所有舞台，避免上一个模式的残留显示
    if (m === 'lie') {
        stage.value = 1
        whoStage.value = 1
        ratingStage.value = 1
    } else if (m === 'who') {
        stage.value = 1
        whoStage.value = 1
        ratingStage.value = 1
    } else {
        stage.value = 1
        whoStage.value = 1
        ratingStage.value = 1
        // rating 模式：直接开局
        start(0)
    }
    pushDialog('6657', `切换至【${modeList.find(x=>x.id===m)?.name}】模式`)
}

async function start(teamId: number): Promise<void> {
    revealVisible.value = false
    reveal.value = null
    needleAngle.value = -90
    if (mode.value === 'lie') {
        stage.value = 2
        round.value = null
        pushDialog('6657', '下面听好了，这句是真是假？')
        const r = await lieDetectorAPI.getRound(teamId, difficulty.value)
        if (r.code === 200 && r.data) {
            round.value = r.data
            pushDialog('测谎仪', `采到陈述 — ${r.data.claim}`)
            void scrollToCase()
        } else {
            ElMessage.warning('出题失败')
            stage.value = 1
        }
    } else if (mode.value === 'who') {
        whoStage.value = 2
        whoQ.value = null
        pushDialog('6657', '看线索，猜这是哪位选手。')
        const q = await lieDetectorAPI.getWho(teamId, difficulty.value)
        if (q.code === 200 && q.data) {
            whoQ.value = q.data
            void scrollToCase()
        } else {
            ElMessage.warning('出题失败')
            whoStage.value = 1
        }
    } else {
        ratingStage.value = 2
        ratingRound.value = null
        pushDialog('6657', '谁的 rating 更高？')
        const rr = await lieDetectorAPI.getRatingRound(difficulty.value)
        if (rr.code === 200 && rr.data) {
            ratingRound.value = rr.data
            void scrollToCase()
        } else {
            ElMessage.warning('出题失败')
            ratingStage.value = 1
        }
    }
}

function judge(picked: boolean): void {
    const current = round.value
    if (!current || judging.value) return
    judging.value = true
    // 真话 → 指针偏左(TRUTH)；假话 → 指针偏右(LIE)
    const target = picked ? -75 : 75
    needleAngle.value = picked ? -40 : 40
    setTimeout(() => { needleAngle.value = target }, 250)
    setTimeout(async () => {
        const isTrueStmt = current.isTrueStmt
        const correct = picked === isTrueStmt
        try {
            const res = await lieDetectorAPI.submitAnswer(current.playerId, picked, isTrueStmt, anonId.value)
            if (res.code === 200 && res.data) {
                reveal.value = { correct: res.data.correct, player: res.data.player }
            } else {
                reveal.value = { correct, player: null }
            }
        } catch (e) {
            reveal.value = { correct, player: null }
        }
        revealVisible.value = true
        stage.value = 3
        judging.value = false
        pulse.value = 88
        pushDialog('测谎仪', correct ? '指针平稳 — 判定：真话' : '指针大幅摆动 — 判定：说谎')
        void refreshScore()
    }, 800)
}

async function judgeRating(guessId: number): Promise<void> {
    const current = ratingRound.value
    if (!current || ratingJudging.value) return
    ratingJudging.value = true
    try {
        const res = await lieDetectorAPI.submitRatingAnswer(current.higherId, guessId, anonId.value)
        if (res.code === 200 && res.data) {
            reveal.value = { correct: res.data.correct, player: null }
        } else {
            reveal.value = { correct: guessId === current.higherId, player: null }
        }
    } catch (e) {
        reveal.value = { correct: guessId === current.higherId, player: null }
    }
    revealVisible.value = true
    ratingStage.value = 3
    ratingJudging.value = false
    const ok = reveal.value?.correct ?? false
    pushDialog('6657', ok ? '你看得很准。' : '看走眼了吧。')
    void refreshScore()
}

async function guess(guessId: number): Promise<void> {
    const current = whoQ.value
    if (!current || whoJudging.value) return
    whoJudging.value = true
    const ok = guessId === current.playerId
    try {
        const res = await lieDetectorAPI.submitWhoAnswer(current.playerId, guessId, anonId.value)
        if (res.code === 200 && res.data) {
            reveal.value = { correct: res.data.correct, player: res.data.player }
        }
    } catch (e) {
        reveal.value = { correct: ok, player: null }
    }
    revealVisible.value = true
    whoStage.value = 3
    whoJudging.value = false
    const finalCorrect = reveal.value?.correct ?? false
    pushDialog('6657', finalCorrect ? '有点东西。' : '哈哈，猜错了。')
    void refreshScore()
}

function nextRound(): void {
    if (mode.value === 'lie') {
        start(round.value?.teamId || 0)
    } else if (mode.value === 'who') {
        start(whoQ.value?.teamId || 0)
    } else {
        start(0)
    }
}

function backToPick(): void {
    revealVisible.value = false
    if (mode.value === 'lie') stage.value = 1
    else if (mode.value === 'who') whoStage.value = 1
    else ratingStage.value = 1
}

async function refreshScore(): Promise<void> {
    try {
        const s = await lieDetectorAPI.myScore(anonId.value)
        if (s.code === 200) myRecord.value = s.data || null
        const r = await lieDetectorAPI.getRank(10)
        if (r.code === 200) rankList.value = r.data || []
    } catch (e) { /* 忽略 */ }
}

onMounted(() => {
    load()
    startEcg()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap');

/* ===================== 设计 token ===================== */
.lie {
    --bg: #0B1320;
    --panel: #14223A;
    --panel-2: #1C2D4A;
    --line: rgba(242, 234, 211, 0.10);
    --line-strong: rgba(242, 234, 211, 0.22);
    --ink: #F2EAD3;
    --ink-dim: #B9AE93;
    --ink-mute: #837A66;
    --green: #2BC97A;
    --green-glow: rgba(43, 201, 122, 0.35);
    --red: #E04A38;
    --red-glow: rgba(224, 74, 56, 0.35);
    --amber: #F2B83D;

    background: var(--bg);
    color: var(--ink);
    font-family: 'Noto Sans SC', system-ui, sans-serif;
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(320px, 35%) 1fr;
    gap: 0;
    align-items: stretch;
}

/* 通用字号系统 */
.mono {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
}

/* ===================== 左侧：测谎仪主体 ===================== */
.lie-aside {
    background: var(--panel);
    border-right: 1px solid var(--line-strong);
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 100vh;
}

.brand {
    border-bottom: 1px solid var(--line);
    padding-bottom: 18px;
}

.brand-mark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    letter-spacing: 0.4em;
    color: var(--ink-dim);
    text-transform: uppercase;
}

.brand-dot {
    width: 8px;
    height: 8px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
}

.brand-name {
    color: var(--ink);
}

.brand-meta {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.brand-meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--ink-mute);
}

.meta-key {
    letter-spacing: 0.3em;
    text-transform: uppercase;
}

.meta-val {
    color: var(--ink);
}

/* 表盘 */
.gauge-wrap {
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    padding: 32px 20px 20px;
    position: relative;
}

.gauge-frame {
    position: relative;
    width: 240px;
    height: 140px;
    margin: 0 auto 30px;
}

.gauge-arc {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
}

/* 外圈表壳 bezel：深色金属外壳 */
.arc-bezel {
    fill: #0A1422;
    stroke: #1C2D4A;
    stroke-width: 1.5;
}
/* bezel 内圈：略浅，做台阶效果 */
.arc-bezel-inner {
    fill: #14223A;
    stroke: rgba(242, 234, 211, 0.12);
    stroke-width: 0.8;
}

/* 左半圆：实心绿（参考图经典测谎仪） */
.arc-truth {
    fill: #2BC97A;
    stroke: #1F8A52;
    stroke-width: 2;
    filter: drop-shadow(0 0 6px rgba(43, 201, 122, 0.35));
    transition: filter 0.4s, fill 0.4s;
}

/* 右半圆：实心红 */
.arc-lie {
    fill: #E04A38;
    stroke: #B03828;
    stroke-width: 2;
    filter: drop-shadow(0 0 6px rgba(224, 74, 56, 0.35));
    transition: filter 0.4s, fill 0.4s;
}

/* 状态联动：未选中侧变暗（仍有色，但低饱） */
.gauge-wrap.truth .arc-truth {
    filter: drop-shadow(0 0 14px rgba(43, 201, 122, 0.65)) brightness(1.08);
}
.gauge-wrap.truth .arc-lie {
    fill: #6B2A22;
    filter: none;
}
.gauge-wrap.lie .arc-lie {
    filter: drop-shadow(0 0 14px rgba(224, 74, 56, 0.65)) brightness(1.08);
}
.gauge-wrap.lie .arc-truth {
    fill: #1F5A38;
    filter: none;
}

/* 中央分隔线：白色细线，凸显绿红边界 */
.arc-divider {
    stroke: rgba(255, 255, 255, 0.85);
    stroke-width: 1.5;
    filter: drop-shadow(0 0 2px rgba(0,0,0,0.4));
}

/* 刻度 */
.arc-ticks line {
    stroke: var(--ink-dim);
    stroke-width: 1.5;
}
.tick-minor {
    stroke: rgba(185, 174, 147, 0.45);
    stroke-width: 1;
}
.tick-major {
    stroke: var(--ink);
    stroke-width: 2;
}

/* 刻度数字 */
.arc-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    fill: var(--ink-dim);
    letter-spacing: 0.05em;
    font-weight: 500;
}
.arc-num-mid {
    fill: var(--ink);
    font-weight: 700;
    font-size: 10px;
}

/* 沿弧文字：TRUTH / LIE 跟着弧线斜排（白色粗体） */
.arc-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-anchor: middle;
    font-style: italic;
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.45);
    stroke-width: 1.5;
    stroke-linejoin: round;
}
.arc-text-truth { fill: #FFFFFF; }
.arc-text-lie { fill: #FFFFFF; }

/* 指针：底端在圆心，向上展开（整体作为旋转锚点） */
.gauge-needle {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 12px;
    height: 92px;
    margin-left: -6px;
    transform-origin: 50% 100%;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2;
    pointer-events: none;
}

/* 经典黑色三角针：clip-path 切出对称三角形 */
.needle-spike {
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 60%, #0a0a0a 100%);
    clip-path: polygon(50% 0%, 100% 100%, 0 100%);
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(0,0,0,0.3));
}

/* 圆心轴：外环 + 中心螺丝（参考图风格） */
.gauge-pivot {
    position: absolute;
    left: 50%;
    bottom: -12px;
    width: 26px;
    height: 26px;
    transform: translateX(-50%);
    z-index: 3;
    pointer-events: none;
}
.pivot-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #4a5568 0%, #1a2030 60%, #060d1a 100%);
    box-shadow: 0 2px 5px rgba(0,0,0,0.7), inset 0 1px 1.5px rgba(255,255,255,0.25);
}
.pivot-screw {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2a2a2a, #050505);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18);
}

/* 中心数字 + 单位（指针底部显示） */
.gauge-cap {
    position: absolute;
    left: 50%;
    bottom: -54px;
    transform: translateX(-50%);
    display: flex;
    align-items: baseline;
    gap: 2px;
    color: var(--ink-dim);
}

.cap-num {
    color: var(--ink);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    animation: cap-blink 0.9s ease-in-out infinite;
    transition: color 0.3s;
}
/* 联动状态：跟指针同色 */
.cap-num.cap-truth { color: var(--green); text-shadow: 0 0 8px var(--green-glow); }
.cap-num.cap-lie   { color: var(--red);   text-shadow: 0 0 8px var(--red-glow); }
.cap-num.cap-idle  { color: var(--ink); }

@keyframes cap-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
}

.cap-unit {
    color: var(--ink-mute);
    font-size: 11px;
    font-weight: 500;
}

.gauge-readout {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--ink-dim);
}

.dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    margin-right: 6px;
    vertical-align: middle;
}

.dot-pulse {
    animation: pulse 1.4s ease-in-out infinite;
}

/* 心电图 */
.ecg-wrap {
    margin-top: 14px;
    padding: 0;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
}

/* ECG 顶栏：导联名 + BPM */
.ecg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: rgba(43, 201, 122, 0.06);
    border-bottom: 1px solid rgba(43, 201, 122, 0.12);
    font-size: 10px;
    letter-spacing: 0.18em;
    color: var(--ink-dim);
}
.ecg-lead {
    color: var(--ink-dim);
    font-weight: 700;
}
.ecg-meta {
    display: flex;
    align-items: baseline;
    gap: 4px;
}
.ecg-meta-key {
    color: var(--ink-mute);
    font-size: 9px;
}
.ecg-bpm {
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 0 6px currentColor;
    transition: color 0.3s;
}
.ecg-meta-unit {
    color: var(--ink-mute);
    font-size: 9px;
}

.ecg {
    width: 100%;
    height: 80px;
    display: block;
    background-image:
        linear-gradient(rgba(43, 201, 122, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(43, 201, 122, 0.025) 1px, transparent 1px);
    background-size: 10px 10px;
}

/* 细网格 */
.ecg-grid-fine line {
    stroke: rgba(43, 201, 122, 0.08);
    stroke-width: 0.4;
}
/* 粗网格（每 50 单位） */
.ecg-grid-major line {
    stroke: rgba(43, 201, 122, 0.22);
    stroke-width: 0.7;
}
.ecg-scan {
    stroke: rgba(43, 201, 122, 0.55);
    stroke-width: 1.2;
    stroke-dasharray: 2 4;
    animation: ecg-sweep 3.6s linear infinite;
}
@keyframes ecg-sweep {
    from { transform: translateX(0); }
    to { transform: translateX(300px); }
}
.ecg-line {
    fill: none;
    stroke: var(--green);
    stroke-width: 1.4;
    stroke-linejoin: round;
    stroke-linecap: round;
    filter: drop-shadow(0 0 5px var(--green-glow));
    transition: stroke 0.3s;
}

/* 审讯日志 */
.ticker {
    flex: 1;
    border-top: 1px solid var(--line);
    padding-top: 18px;
}

.ticker-label {
    font-size: 11px;
    letter-spacing: 0.4em;
    color: var(--ink-dim);
    text-transform: uppercase;
    margin-bottom: 12px;
}

.ticker-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ticker-row {
    display: grid;
    grid-template-columns: 24px 70px 1fr;
    gap: 10px;
    align-items: baseline;
    font-size: 13px;
    padding: 6px 0;
    border-bottom: 1px dashed var(--line);
}

.ticker-ts {
    color: var(--ink-mute);
    font-size: 11px;
}

.ticker-speaker {
    color: var(--amber);
    font-size: 12px;
    letter-spacing: 0.05em;
}

.ticker-text {
    color: var(--ink);
    line-height: 1.5;
}

/* ===================== 右侧：操作台 ===================== */
.lie-main {
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    height: 100vh;
    max-height: 100vh;
    scroll-behavior: smooth;
}

/* 模式条 */
.modes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--line-strong);
    background: var(--panel);
}

.mode-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 14px 18px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--line-strong);
    color: var(--ink-dim);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: left;
}

.mode-btn:last-child {
    border-right: none;
}

.mode-btn:hover:not(.disabled) {
    background: var(--panel-2);
    color: var(--ink);
}

.mode-btn.active {
    background: var(--panel-2);
    color: var(--ink);
    box-shadow: inset 0 -2px 0 var(--amber);
}

.mode-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.mode-num {
    font-size: 11px;
    color: var(--ink-mute);
    letter-spacing: 0.2em;
}

.mode-btn.active .mode-num {
    color: var(--amber);
}

.mode-name {
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.05em;
}

/* 难度 */
.difficulty {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    background: var(--panel);
    border: 1px solid var(--line-strong);
}

.diff-key {
    font-size: 11px;
    letter-spacing: 0.3em;
    color: var(--ink-dim);
    text-transform: uppercase;
}

.diff-track {
    display: flex;
    gap: 8px;
}

.diff-stop {
    width: 56px;
    height: 32px;
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    color: var(--ink-mute);
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.15em;
}

.diff-stop:hover {
    color: var(--ink);
    border-color: var(--ink-dim);
}

.diff-stop.filled {
    background: var(--panel-2);
    color: var(--ink-dim);
    border-color: var(--ink-dim);
}

.diff-stop.on {
    background: var(--amber);
    color: var(--bg);
    border-color: var(--amber);
}

.diff-tag {
    font-size: 11px;
    color: var(--amber);
    letter-spacing: 0.3em;
}

/* 战绩 */
.record {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: center;
    background: var(--panel);
    border: 1px solid var(--line-strong);
    padding: 14px 24px;
}

.record-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.cell-key {
    font-size: 11px;
    letter-spacing: 0.3em;
    color: var(--ink-dim);
    text-transform: uppercase;
}

.cell-val {
    font-size: 22px;
    color: var(--ink);
    font-weight: 500;
}

.record-sep {
    width: 1px;
    height: 32px;
    background: var(--line-strong);
}

/* 通用面板头 */
.panel-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line-strong);
    margin-bottom: 16px;
}

.panel-num {
    font-size: 12px;
    color: var(--amber);
    letter-spacing: 0.2em;
}

.panel-title {
    font-size: 13px;
    letter-spacing: 0.25em;
    color: var(--ink-dim);
    text-transform: uppercase;
}

.panel-tag {
    margin-left: auto;
    font-size: 11px;
    color: var(--ink-dim);
    letter-spacing: 0.25em;
    border: 1px solid var(--line-strong);
    padding: 3px 10px;
}

/* 选队伍 */
.entry {
    background: var(--panel);
    border: 1px solid var(--line-strong);
    padding: 20px;
}

.team-pool {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 8px;
}

.team-chip {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: left;
}

.team-chip:hover {
    border-color: var(--amber);
    background: var(--bg);
}

.team-chip-random {
    border-color: var(--ink-dim);
    background: var(--bg);
}

.chip-num {
    font-size: 12px;
    color: var(--amber);
    font-weight: 700;
    text-align: center;
}

.chip-name {
    font-size: 14px;
    font-weight: 500;
}

.chip-sub {
    font-size: 11px;
    color: var(--ink-mute);
    letter-spacing: 0.1em;
}

/* 出题卡 */
.case {
    background: var(--panel);
    border: 1px solid var(--line-strong);
    padding: 24px 28px;
}

.claim {
    margin: 20px 0 24px;
}

.claim-body {
    font-size: 22px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--ink);
    margin: 0 0 12px;
}

.claim-ref {
    font-size: 13px;
    color: var(--ink-dim);
    margin: 0;
}

.claim-ref strong {
    color: var(--amber);
    font-weight: 500;
}

/* 真假按钮 */
.action-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.action {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 24px;
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
}

.action-truth:hover:not(:disabled) {
    border-color: var(--green);
    background: var(--bg);
}

.action-truth:hover:not(:disabled) .action-label {
    color: var(--green);
}

.action-lie:hover:not(:disabled) {
    border-color: var(--red);
    background: var(--bg);
}

.action-lie:hover:not(:disabled) .action-label {
    color: var(--red);
}

.action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.action-label {
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.05em;
}

.action-sub {
    font-size: 11px;
    color: var(--ink-mute);
    letter-spacing: 0.25em;
}

/* 扫描线 */
.scan-line {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--ink-dim);
    letter-spacing: 0.2em;
}

.scan-bar {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--amber), transparent);
    animation: scan 1s linear infinite;
}

@keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* 他是谁 */
.clues {
    list-style: none;
    padding: 0;
    margin: 0 0 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.clue {
    display: grid;
    grid-template-columns: 28px 1fr;
    align-items: baseline;
    gap: 12px;
    padding: 10px 14px;
    background: var(--panel-2);
    border-left: 2px solid var(--amber);
}

.clue-num {
    font-size: 11px;
    color: var(--amber);
    letter-spacing: 0.15em;
}

.clue-text {
    font-size: 15px;
    color: var(--ink);
}

.option-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 18px;
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.15s;
    text-align: left;
}

.option:hover:not(:disabled) {
    border-color: var(--amber);
}

.option:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.opt-name {
    font-size: 16px;
    font-weight: 500;
}

.opt-meta {
    font-size: 11px;
    color: var(--ink-mute);
    letter-spacing: 0.2em;
}

/* 评级对决 */
.duel {
    display: grid;
    grid-template-columns: 1fr 80px 1fr;
    align-items: center;
    gap: 16px;
    margin: 20px 0;
}

.duel-side {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 20px 16px;
    background: var(--panel-2);
    border: 1px solid var(--line-strong);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.15s;
    text-align: center;
}

.duel-side:hover:not(:disabled) {
    border-color: var(--amber);
}

.duel-side:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.duel-name {
    font-size: 18px;
    font-weight: 500;
}

.duel-meta {
    font-size: 11px;
    color: var(--ink-mute);
    letter-spacing: 0.25em;
}

.duel-vs {
    text-align: center;
}

.vs-num {
    font-size: 22px;
    color: var(--amber);
    font-weight: 700;
    letter-spacing: 0.1em;
}

.vs-sub {
    font-size: 11px;
    color: var(--ink-dim);
    margin-top: 4px;
    letter-spacing: 0.15em;
}

/* 揭晓 */
.verdict {
    background: var(--panel);
    border: 1px solid var(--line-strong);
    padding: 24px 28px;
}

.verdict.is-truth {
    border-left: 4px solid var(--green);
}

.verdict.is-lie {
    border-left: 4px solid var(--red);
}

.verdict-head {
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 0.05em;
    margin: 0 0 18px;
}

.verdict.is-truth .verdict-head {
    color: var(--green);
}

.verdict.is-lie .verdict-head {
    color: var(--red);
}

.verdict-data {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin: 0 0 18px;
    padding: 16px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
}

.verdict-data > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.verdict-data dt {
    font-size: 11px;
    letter-spacing: 0.25em;
    color: var(--ink-dim);
    text-transform: uppercase;
}

.verdict-data dd {
    font-size: 14px;
    color: var(--ink);
    margin: 0;
}

.verdict-note {
    font-size: 13px;
    color: var(--ink-dim);
    margin: 0 0 18px;
}

.verdict-note strong {
    color: var(--amber);
    font-weight: 500;
}

.verdict-row {
    display: flex;
    gap: 10px;
}

.ghost-btn {
    flex: 1;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid var(--line-strong);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    font-size: 13px;
    letter-spacing: 0.15em;
}

.ghost-btn:hover {
    border-color: var(--amber);
}

.ghost-btn-alt:hover {
    background: var(--panel-2);
}

/* 排行 */
.rank-section {
    background: var(--panel);
    border: 1px solid var(--line-strong);
    padding: 20px 24px;
}

.rank-table {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.rank-row {
    display: grid;
    grid-template-columns: 50px 1fr 80px 80px;
    align-items: center;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--line);
    font-size: 14px;
}

.rank-row:last-child {
    border-bottom: none;
}

.rank-row.rank-head {
    color: var(--ink-mute);
    font-size: 11px;
    letter-spacing: 0.25em;
    border-bottom: 1px solid var(--line-strong);
}

.rank-row.top {
    color: var(--amber);
}

.rk-no {
    font-size: 13px;
    color: var(--ink-dim);
}

.rank-row.top .rk-no {
    color: var(--amber);
    font-weight: 700;
}

.rk-name {
    color: inherit;
}

.rk-acc,
.rk-tot {
    text-align: right;
    color: var(--ink);
}

.empty-panel {
    padding: 40px 0;
    text-align: center;
    color: var(--ink-dim);
    font-size: 13px;
    letter-spacing: 0.15em;
}

/* ===================== 响应式 ===================== */
@media (max-width: 960px) {
    .lie {
        grid-template-columns: 1fr;
    }
    .lie-aside {
        min-height: auto;
    }
    .verdict-data {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>