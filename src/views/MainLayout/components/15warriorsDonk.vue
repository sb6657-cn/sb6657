<template>
    <div class="container" ref="containerRef">
        <header class="header">
            <h1>
                布雷德十五勇士榜
                <span class="version">3.0</span>
            </h1>
            <div class="year-select-container">
                <el-select v-model="currentYear" placeholder="选择年份" class="year-select" size="small">
                    <el-option v-for="opt in yearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <button class="download-rank-btn" type="button" @click="downloadRankingImage" :disabled="isDownloading">
                    <el-icon>
                        <Download />
                    </el-icon>
                    <span>{{ isDownloading ? '下载中...' : '下载榜单' }}</span>
                </button>
            </div>
            <div class="rules-brief">计算规则：{{ currentYear }}年累计对位KD差 | AWPER不录入 | 仅供娱乐</div>
            <div class="more-info">
                <div class="match-info">
                    <h3 class="match-title">{{ reportData.match.title }}</h3>
                    <span class="match-date">{{ reportData.match.date }}</span>
                </div>
                <div class="author-info">
                    <span class="author-label">作者：</span>
                    <div class="author-links">
                        <a href="https://app.pwesports.cn" target="_blank">完美: @Amatera</a>
                    </div>
                </div>
            </div>
            <div class="quote">
                <img src="https://sb6657oss.wishao.fun/B1ad3.jpg" alt="B1ad3" class="image" />
                <div class="text">
                    <div>"donk? 现在有至少15名步枪手可以轻松在任何位置击杀他"</div>
                    <div class="attribution">- B1ad3, 2025.01.15</div>
                </div>
            </div>
        </header>
        <section :class="['updates-section', { 'show-all': collapse }]" v-if="reportData.updates && reportData.updates.length">
            <span class="section-title">比赛更新</span>
            <span class="description">- 本场对位donk数据变化</span>
            <div class="updates-table-wrapper">
                <table class="updates-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Kills</th>
                            <th>Deaths</th>
                            <th class="updates-diff">Δ K/D Diff</th>
                            <th>Team</th>
                            <th class="maps">Maps</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="u in reportData.updates" :key="u.player">
                            <td>{{ u.player }}</td>
                            <td class="expr">
                                <span class="before">{{ u.kill.before }}</span>
                                <span class="plus">+</span>
                                <span class="added positive">{{ u.kill.added }}</span>
                                <span class="equals">=</span>
                                <span class="after">{{ u.kill.after }}</span>
                            </td>
                            <td class="expr">
                                <span class="before">{{ u.death.before }}</span>
                                <span class="plus">+</span>
                                <span class="added negative">{{ u.death.added }}</span>
                                <span class="equals">=</span>
                                <span class="after">{{ u.death.after }}</span>
                            </td>
                            <td class="updates-diff" :class="u.kill.added - u.death.added >= 0 ? 'positive' : 'negative'">{{ u.kill.added - u.death.added >= 0 ? '+' : '' }}{{ u.kill.added - u.death.added }}</td>
                            <td>{{ u.team }}</td>
                            <td class="maps">{{ u.maps }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="hasCollapseBtn" class="collapse-btn" @click="toggleCollapse">
                <div v-if="collapse">
                    <el-icon>
                        <ArrowUpBold />
                    </el-icon>
                    <span>收起折叠</span>
                </div>
                <div v-else>
                    <el-icon>
                        <ArrowDownBold />
                    </el-icon>
                    <span>展开全部</span>
                </div>
            </div>
        </section>

        <main class="main-content">
            <section class="ranking-section">
                <h2>
                    布雷德十五勇士
                    <span class="description" v-if="reportData.rankings.warriors.length < 15 && !reportData.loading">(目前不足15位😱)</span>
                </h2>
                <p class="description">理论上可以在任何位置轻松击杀donk的选手们</p>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th class="diff-col">K/D Diff</th>
                                <th>Team</th>
                                <th>Kills</th>
                                <th>Deaths</th>
                                <th>Maps</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="player in reportData.rankings.warriors" :key="player.player">
                                <td>{{ player.rank }}</td>
                                <td>{{ player.player }}</td>
                                <td class="positive diff-col">{{ player.k_dDiff > 0 ? '+' : '' }}{{ player.k_dDiff }}</td>
                                <td>{{ player.team }}</td>
                                <td>{{ player.kill }}</td>
                                <td>{{ player.death }}</td>
                                <td>{{ player.maps }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="ranking-section">
                <h2>反向十五勇士</h2>
                <p class="description">驴劲来了, donk的最大受害者们</p>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th class="diff-col">K/D Diff</th>
                                <th>Team</th>
                                <th>Kills</th>
                                <th>Deaths</th>
                                <th>Maps</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="player in reportData.rankings.victims" :key="player.player">
                                <td>{{ player.rank }}</td>
                                <td>{{ player.player }}</td>
                                <td class="negative diff-col">{{ player.k_dDiff }}</td>
                                <td>{{ player.team }}</td>
                                <td>{{ player.kill }}</td>
                                <td>{{ player.death }}</td>
                                <td>{{ player.maps }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import type { ReportData, YearConfig } from '@/types/15warriorsDonk';
import { ArrowDownBold, ArrowUpBold, Download } from '@element-plus/icons-vue';
import { ElIcon, ElMessage } from 'element-plus';
import { toCanvas } from 'html-to-image';
import { computed, ref, watch } from 'vue';
import { useThemeStore } from '@/stores/themeStore';

const theme = useThemeStore();

const url = new URL(window.location.href);
const searchParams = url.searchParams;

const currentYear = ref<number>(2026);
const yearOptions = ref<YearConfig[]>([
    { label: '2026-现在', value: 2026, json: '15warriorsDonk_2026.json' },
    { label: '2025', value: 2025, json: '15warriorsDonk_2025.json' },
]);

const reportData = ref<ReportData>({
    match: { title: '加载中...', date: '加载中...' },
    updates: [
        {
            player: '加载中...',
            team: '加载中...',
            kill: { before: 0, added: 0, after: 0 },
            death: { before: 0, added: 0, after: 0 },
            maps: 0,
        },
    ],
    rankings: {
        warriors: [],
        victims: [],
    },
    loading: true,
});
const containerRef = ref<HTMLElement | null>(null);
const isDownloading = ref(false);

const ossUrl = 'https://sb6657oss.wishao.fun';
const abortController = new AbortController();
async function loadReportData(fileName: string) {
    // 工具站调试逻辑，从postmessage拿数据
    if (searchParams.get('preview') === '1') {
        // 监听父页面发送的数据
        window.addEventListener('message', (event: MessageEvent) => {
            const message = event.data;
            if (message?.type !== 'preview-data') return;

            reportData.value = message.data;
        });
        window.parent.postMessage({ type: 'ready-to-preview' }, 'https://sb6657.cn');
        return;
    }
    // 正常逻辑，从oss拉数据
    try {
        const res = await fetch(`${ossUrl}/${fileName}`, { signal: abortController.signal });
        const data: ReportData = await res.json();
        reportData.value = data;
    } catch (err) {
        console.error('加载15勇士战报数据失败:', err);
        reportData.value.match.title = '15勇士战报加载失败，请稍后重试。。。';
    }
}
loadReportData(yearOptions.value.find((opt) => opt.value === 2026)?.json || '15warriorsDonk_2025.json');
watch(currentYear, (newYear) => {
    loadReportData(yearOptions.value.find((opt) => opt.value === newYear)?.json || '15warriorsDonk_2025.json');
});

// 折叠本场变化
const hasCollapseBtn = computed(() => reportData.value.updates.length > 4);
const collapse = ref(false);
function toggleCollapse() {
    collapse.value = !collapse.value;
}

const captureScale = 2;

function addSourceBanner(canvas: HTMLCanvasElement) {
    const bannerHeight = 42 * captureScale;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height + bannerHeight;

    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = theme.isDark ? '#12141a' : '#f5f5f7';
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    ctx.font = `600 ${13 * captureScale}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.isDark ? '#e6edf3' : '#666';
    ctx.fillText('sb6657.cn · 数据来源', outputCanvas.width / 2, bannerHeight / 2 + 1 * captureScale);
    ctx.drawImage(canvas, 0, bannerHeight);

    return outputCanvas;
}

async function downloadRankingImage() {
    if (!containerRef.value || isDownloading.value) return;

    try {
        isDownloading.value = true;
        const captureWidth = Math.ceil(containerRef.value.getBoundingClientRect().width);
        const captureHeight = Math.ceil(containerRef.value.scrollHeight);
        const canvas = await toCanvas(containerRef.value, {
            width: captureWidth,
            height: captureHeight,
            backgroundColor: theme.isDark ? '#12141a' : '#f5f5f7',
            cacheBust: true,
            pixelRatio: captureScale,
            style: {
                margin: '0',
                marginLeft: '0',
                marginRight: '0',
                maxWidth: 'none',
                width: `${captureWidth}px`,
            },
            fetchRequestInit: {
                mode: 'cors',
                cache: 'no-cache',
            },
            filter: (node) => {
                return !node.classList?.contains('year-select-container');
            },
        });
        const outputCanvas = addSourceBanner(canvas);
        const link = document.createElement('a');
        link.download = `sb6657.cn_布雷德十五勇士榜_${currentYear.value}.png`;
        link.href = outputCanvas.toDataURL('image/png');
        link.click();
        ElMessage.success('榜单图片已开始下载');
    } catch (error) {
        console.error('下载榜单图片失败:', error);
        ElMessage.error('下载失败，请稍后重试');
    } finally {
        isDownloading.value = false;
    }
}
</script>

<style lang="scss" scoped>
.container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    background-color: var(--el-fill-color-light, #f5f5f7);
    color: var(--body-color);
    margin-bottom: 40px;

    .header {
        margin-bottom: 0.5rem;

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;

            .version {
                font-size: 1.2rem;
                font-weight: 800;
                color: #666;
            }
        }

        .year-select-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.85rem;

            .year-select {
                width: 120px;
            }

            .download-rank-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0;
                border: none;
                background: transparent;
                color: #007aff;
                font-size: 0.9rem;
                font-weight: 600;
                line-height: 1;
                cursor: pointer;
                transition: color 0.2s ease;

                .el-icon {
                    font-size: 1rem;
                }

                &:hover:not(:disabled) {
                    color: #005ecb;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                }

                &:disabled {
                    color: #8bbff5;
                    cursor: not-allowed;
                    text-decoration: none;
                }
            }
        }

        .rules-brief {
            text-align: center;
            font-size: 0.85rem;
            color: #888;
            margin-bottom: 1rem;
            font-weight: 400;
        }

        .more-info {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            gap: 1rem;

            .match-info {
                display: flex;
                flex-direction: column;

                .match-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin: 0;
                    color: var(--body-color);
                }

                .match-date {
                    font-size: 0.9rem;
                    color: #666;
                    margin-top: 0.2rem;
                }
            }

            .author-info {
                display: flex;
                flex-direction: column;
                align-items: flex-end;

                .author-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 0.2rem;
                }

                .author-links {
                    a {
                        color: #007aff;
                        text-decoration: none;
                        font-size: 0.9rem;

                        &:hover {
                            text-decoration: underline;
                        }
                    }
                }
            }
        }

        .quote {
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 1rem;

            .image {
                width: 100px;
                height: 100px;
                object-fit: cover;
            }

            .text {
                font-size: 1.1rem;
                font-style: italic;
                color: #555;
                line-height: 1.6;

                .attribution {
                    margin-top: 0.5rem;
                    font-style: normal;
                    font-weight: 600;
                    color: #777;
                    display: block;
                }
            }
        }
    }

    .main-content {
        display: flex;
        gap: 1rem;
        justify-content: center;

        .ranking-section {
            flex: 1;
            min-width: 0;
            background-color: var(--card-bg);
            padding: 1.5rem;
            border: 1px solid #e0e0e0;

            h2 {
                font-size: 1.5rem;
                font-weight: 600;
                border-bottom: 2px solid #ccc;
                padding-bottom: 0.75rem;
                margin-bottom: 0.5rem;
            }

            .description {
                color: #666;
                margin-bottom: 1.5rem;
                font-size: 0.9rem;
            }

            .table-wrapper {
                overflow-x: auto;

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.95rem;
                    min-width: 420px;

                    thead {
                        th {
                            font-weight: 600;
                            color: #555;
                            background-color: var(--el-fill-color-blank, #fafafa);
                            padding: 0.8rem 0.6rem;
                            text-align: left;
                            border-bottom: 1px solid #e8e8e8;

                            &:nth-child(1) {
                                text-align: center;
                                width: 40px;
                            }
                        }
                    }

                    tbody {
                        tr {
                            &:last-child {
                                td {
                                    border-bottom: none;
                                }
                            }

                            &:hover {
                                background-color: var(--el-fill-color-light, #f9f9f9);
                            }

                            td {
                                padding: 0.8rem 0.6rem;
                                text-align: left;
                                border-bottom: 1px solid #e8e8e8;

                                &:nth-child(1) {
                                    text-align: center;
                                    width: 40px;
                                }
                            }
                        }
                    }

                    .diff-col {
                        font-weight: 700;
                        text-align: center;
                        width: 80px;

                        &.positive {
                            color: #2e7d32;
                        }

                        &.negative {
                            color: #c62828;
                        }
                    }
                }
            }
        }
    }
}

.updates-section {
    background-color: transparent;
    padding: 0.1rem 0.4rem;
    border-left: 4px solid #333;
    margin-bottom: 1rem;
    overflow: hidden;
    max-height: 236px;
    position: relative;

    &.show-all {
        height: auto;
        max-height: none;
        padding-bottom: 20px;
    }

    .collapse-btn {
        cursor: pointer;
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 0;
        text-align: center;
        font-size: small;
        font-weight: bold;
        color: #777;
        background: linear-gradient(rgba(245, 245, 247, 0), #f5f5f7);

        html.dark & {
            color: var(--el-text-color-secondary);
            background: linear-gradient(rgba(18, 20, 26, 0), var(--el-fill-color-light, #12141a));
        }
    }

    .section-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--body-color);
        margin-right: 0.5rem;
    }

    .description {
        font-size: 0.9rem;
        color: #666;
    }

    .updates-table-wrapper {
        overflow-x: auto;

        .updates-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
            min-width: 440px;
            table-layout: fixed;

            thead {
                th {
                    font-weight: 600;
                    color: #444;
                    background-color: var(--el-fill-color-light, #f6f6f6);
                    padding: 0.6rem 0.5rem;
                    text-align: left;
                    border-bottom: 1px solid #e8e8e8;

                    &.updates-diff {
                        width: auto;
                    }

                    &.maps {
                        text-align: center;
                    }
                }
            }

            tbody {
                tr {
                    &:nth-child(odd) {
                        background-color: var(--el-fill-color-light, #f7f7f7);
                    }

                    &:hover {
                        background-color: #efefef;
                    }

                    td {
                        padding: 0.5rem 0.4rem;
                        border-bottom: 1px solid #e8e8e8;

                        &.expr {
                            font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;
                            font-size: 0.95em;

                            .before,
                            .after {
                                color: #111;
                                font-weight: 600;
                            }

                            .plus,
                            .equals {
                                color: #888;
                                margin: 0;
                                padding: 0;
                            }

                            .added {
                                font-weight: 700;

                                &.positive {
                                    color: #2e7d32;
                                }

                                &.negative {
                                    color: #c62828;
                                }
                            }
                        }
                    }
                }
            }

            .updates-diff {
                font-weight: 700;

                &.positive {
                    color: #2e7d32;
                }

                &.negative {
                    color: #c62828;
                }
            }

            .maps {
                text-align: center;
            }
        }
    }
}

html.dark {
    .container {
        .ranking-section,
        .updates-section {
            table {
                thead th {
                    color: var(--el-text-color-regular);
                    background-color: var(--el-fill-color);
                    border-bottom-color: var(--el-border-color);
                }

                tbody {
                    tr {
                        &:nth-child(odd) {
                            background-color: rgba(255, 255, 255, 0.04);
                        }

                        &:hover {
                            background-color: rgba(255, 255, 255, 0.08);
                        }

                        td {
                            border-bottom-color: var(--el-border-color);

                            &.expr .before,
                            &.expr .after {
                                color: var(--body-color);
                            }
                        }
                    }
                }
            }
        }
    }
}

@media (max-width: 1024px) {
    .container {
        .main-content {
            flex-direction: column;
        }

        .header {
            h1 {
                font-size: 2rem;

                .version {
                    font-size: 1rem;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .container {
        padding: 1rem;

        .header {
            .year-select-container {
                flex-wrap: wrap;
            }

            h1 {
                font-size: 1.6rem;
                line-height: 1.3;

                .version {
                    font-size: 0.8rem;
                }
            }

            .more-info {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.8rem;

                .author-info {
                    align-items: flex-start;
                    width: 100%;
                }
            }

            .quote {
                .image {
                    width: 80px;
                    height: 80px;
                }

                .text {
                    font-size: 1rem;
                }
            }

            .match-info {
                .match-title {
                    font-size: 1.1rem;
                }
            }
        }

        .main-content {
            gap: 1.5rem;

            .ranking-section {
                padding: 1rem;

                h2 {
                    font-size: 1.3rem;
                }

                .table-wrapper {
                    table {
                        font-size: 0.8rem;

                        thead th {
                            padding: 0.6rem 0.4rem;
                        }

                        tbody td {
                            padding: 0.6rem 0.4rem;
                        }

                        .diff-col {
                            width: 60px;
                        }
                    }
                }
            }
        }

        .updates-section {
            .updates-table-wrapper {
                .updates-table {
                    font-size: 0.75rem;
                    min-width: 380px;

                    thead th,
                    tbody td {
                        font-size: 0.75rem;
                    }

                    tbody td.expr {
                        font-size: 0.75rem;
                    }

                    tbody td.updates-diff {
                        text-align: center;
                    }
                }
            }
        }
    }
}

@media (max-width: 480px) {
    .container {
        .header {
            h1 {
                font-size: 1.4rem;

                .version {
                    font-size: 0.6rem;
                }
            }

            .match-info {
                .match-title {
                    font-size: 1rem;
                }
            }

            .quote {
                .image {
                    width: 60px;
                    height: 60px;
                }

                .text {
                    font-size: 0.9rem;
                }
            }
        }

        .main-content {
            .ranking-section {
                padding: 0.8rem;

                h2 {
                    font-size: 1.2rem;
                }

                .description {
                    font-size: 0.85rem;
                    margin-bottom: 1rem;
                }

                .table-wrapper {
                    table {
                        font-size: 0.75rem;

                        thead th {
                            padding: 0.4rem 0.25rem;
                        }

                        tbody td {
                            padding: 0.4rem 0.25rem;
                        }

                        .diff-col {
                            width: 50px;
                        }
                    }
                }
            }
        }

        .updates-section {
            .updates-table-wrapper {
                .updates-table {
                    font-size: 0.7rem;
                    min-width: 300px;

                    thead th,
                    tbody td {
                        font-size: 0.7rem;
                    }

                    tbody td.expr {
                        font-size: 0.7rem;
                    }

                    tbody td.updates-diff {
                        text-align: center;
                    }
                }
            }
        }
    }
}

@media (max-width: 360px) {
    .container {
        .main-content {
            .ranking-section {
                .table-wrapper {
                    table {
                        font-size: 0.7rem;
                        min-width: 260px;
                        table-layout: fixed;

                        thead th {
                            padding: 0.3rem 0.2rem;
                        }

                        tbody td {
                            padding: 0.3rem 0.2rem;
                        }
                    }
                }
            }
        }

        .updates-section {
            .updates-table-wrapper {
                .updates-table {
                    font-size: 0.65rem;
                    min-width: 260px;
                    table-layout: fixed;

                    thead th {
                        padding: 0.3rem 0.2rem;
                    }

                    tbody td {
                        padding: 0.3rem 0.2rem;
                        word-break: break-word;
                    }

                    thead th.updates-diff,
                    tbody td.updates-diff {
                        width: 60px;
                    }

                    tbody td.updates-diff {
                        text-align: center;
                    }
                }
            }
        }
    }
}
</style>
