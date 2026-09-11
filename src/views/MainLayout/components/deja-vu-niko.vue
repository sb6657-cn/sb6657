<template>
    <article class="container">
        <header class="header">
            <div class="header-top">
                <div class="title-section">
                    <h1 class="title">{{ reportData.issueTitle }}</h1>
                </div>
                <div class="author-section">
                    <span class="author-label">作者：</span>
                    <div class="author-links">
                        <a href="https://space.bilibili.com/505122023" target="_blank">bilibili: @Mr_皮乐</a>
                        <a href="https://tieba.baidu.com/home/main?id=tb.1.e7e1a59e.6wTN3gPNJQkiSeJQQkzyow" target="_blank">贴吧: @浪泼独流</a>
                        <a href="https://news.wmpvp.com/community-detail.html?id=347406749" target="_blank">完美: @永远喜欢尼古拉科维奇</a>
                    </div>
                </div>
            </div>
            <div class="match-info">
                <h3 class="match-title">{{ reportData.match.title }}</h3>
                <span class="match-date">{{ reportData.match.date }}</span>
            </div>
        </header>
        <section class="pause-notice" role="status" aria-live="polite">
            <div class="notice-content">
                <img src="https://sb6657oss.wishao.fun/nikoshrimp.webp" alt="停更公告配图" class="notice-image" />
                <div class="notice-text">
                    <h3 class="notice-title">停更公告</h3>
                    <p class="notice-desc">
                        鲜虾榜停更至 12.22，专心备战考研去了。（作者原话，见
                        <a style="text-decoration: underline" href="https://www.bilibili.com/opus/1123112580507762704">b站动态</a>
                        😭）
                    </p>
                    <h3>2026.2.20 本站验证暂未恢复更新，催更请联系原作者🙏</h3>
                </div>
            </div>
        </section>
        <section class="briefing">
            <div class="briefing-content">{{ reportData.briefing }}</div>
        </section>
        <section class="main-content">
            <div v-if="dejaVuType === 0" class="ranking-section">
                <div class="section-header">
                    <h3 class="section-title">目前美味鲜虾点数排行榜(top30):</h3>
                    <div class="section-actions">
                        <button class="btn-link" @click="showDialog(shrimpRuleTitle, shrimpRuleDescription)">鲜虾点数计算规则</button>
                        <button class="btn-switch" @click="changeDejaVuType(1)">切换到非top30版</button>
                    </div>
                </div>
                <div class="ranking-table">
                    <table>
                        <tbody>
                            <tr v-for="item in reportData.rankings.top30" :key="item.rank">
                                <td>{{ item.rank }}</td>
                                <td>{{ item.player }}</td>
                                <td>{{ item.team }}</td>
                                <td v-html="item.emoji + '👉🦐👈'"></td>
                                <td>{{ item.points }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-if="dejaVuType === 1" class="ranking-section">
                <div class="section-header">
                    <h3 class="section-title">非top30版荣誉提名鲜虾榜:</h3>
                    <div class="section-actions">
                        <button class="btn-link" @click="showDialog(shrimpRuleTitle, shrimpRuleDescription)">鲜虾点数计算规则</button>
                        <button class="btn-switch" @click="changeDejaVuType(0)">切换到top30版</button>
                    </div>
                </div>
                <div class="ranking-table">
                    <table>
                        <tbody>
                            <tr v-for="item in reportData.rankings.nonTop30" :key="item.rank">
                                <td>{{ item.rank }}</td>
                                <td>{{ item.player }}</td>
                                <td>{{ item.team }}</td>
                                <td v-html="item.emoji + '👉🦐👈'"></td>
                                <td>{{ item.points }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="ranking-section">
                <div class="section-header">
                    <h3 class="section-title">目前虾钳反夹，痛风点数榜:</h3>
                    <div class="section-actions">
                        <button class="btn-link" @click="showDialog(goutRuleTitle, goutRuleDescription)">痛风点数计算规则</button>
                    </div>
                </div>
                <div class="ranking-table">
                    <table>
                        <tbody>
                            <tr v-for="item in reportData.rankings.gout" :key="item.rank">
                                <td>{{ item.rank }}</td>
                                <td>{{ item.player }}</td>
                                <td>{{ item.team }}</td>
                                <td v-html="item.emoji"></td>
                                <td>{{ item.points }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="ranking-section">
                <div class="section-header">
                    <h3 class="section-title">捕虾战队哪家强：捕虾队评级</h3>
                    <div class="section-actions">
                        <span class="rule-text">规则：只会评级和Falcons有重复交手记录的队伍。</span>
                    </div>
                </div>
                <div class="ranking-table team-rating-table">
                    <table>
                        <tbody>
                            <tr v-for="item in reportData.teamRatings" :key="item.team">
                                <td>{{ item.team }}</td>
                                <td>{{ item.score }}</td>
                                <td>{{ item.opponent }}</td>
                                <td>{{ item.rating }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        <section class="commentary">
            <h3 class="commentary-title">野榜杂谈</h3>
            <div class="commentary-content">{{ reportData.commentary }}</div>
        </section>
        <el-dialog class="dialog" v-model="dialogVisible" :title="dialogTitle" width="50%">
            <p>{{ dialogText }}</p>
        </el-dialog>
    </article>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogText = ref('');
const showDialog = (title: string, text: string) => {
    dialogTitle.value = title;
    dialogText.value = text;
    dialogVisible.value = true;
};

// 规则前端写死
const shrimpRuleTitle = '鲜虾点数计算规则';
const shrimpRuleDescription = '每场比赛对位优于NiKo时，对位差大于等于3计1点，每额外超过3再多计1点。若本场比赛未有人对位优于NiKo，则无人获得鲜虾点数。(分为top30版和非top30荣誉提名版)';
const goutRuleTitle = '痛风点数计算规则';
const goutRuleDescription = '每场比赛的(24年)top30选手对位劣于NiKo时，对位差大于等于3计1点，每额外超过3再多计1点。若本场比赛未有top30选手或未有对位劣于NiKo的top30选手，则无人获得痛风点数。';

const dejaVuType = ref(0);
function changeDejaVuType(type: number) {
    dejaVuType.value = type;
}

const reportData = ref<any>({
    issueTitle: '加载中...',
    match: { title: '加载中...', date: '加载中...' },
    briefing: '加载中...',
    rankings: {
        top30: [],
        nonTop30: [],
        gout: [],
    },
    teamRatings: [],
    commentary: '加载中...',
});
const ossUrl = 'https://sb6657oss.wishao.fun/dejaVuNiko.json';
const abortController = new AbortController();
async function loadReportData() {
    try {
        const res = await fetch(ossUrl, { signal: abortController.signal });
        const data = await res.json();
        reportData.value = data;
    } catch (err) {
        console.error('加载战报数据失败:', err);
        reportData.value.issueTitle = '超级逮虾户战报加载失败，请稍后重试。。。';
    }
}
loadReportData();
// 组件卸载时中止请求，防止资源泄露
onUnmounted(() => {
    abortController.abort();
});
</script>

<style lang="scss" scoped>
.container {
    max-width: 1000px;
    margin: 0 auto;
    background-color: var(--card-bg);
    border: 1px solid #cccccc;
    font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--body-color);

    html.dark & {
        border-color: var(--el-border-color);
    }
}

// Header 样式
.header {
    background-color: var(--el-fill-color-light, #f5f5f5);
    border-bottom: 2px solid #0066cc;
    padding: 15px 20px;

    .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
        gap: 20px;

        @media (max-width: 768px) {
            flex-direction: column;
            gap: 15px;
        }

        .title-section {
            flex: 1;

            .title {
                margin: 0;
                font-size: 26px;
                font-weight: bold;
                color: #cc6600;
                line-height: 1.3;

                @media (max-width: 768px) {
                    font-size: 18px;
                }
            }
        }

        .author-section {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;

            @media (max-width: 768px) {
                align-items: flex-start;
                width: 100%;
            }

            .author-label {
                font-weight: bold;
                color: #666666;
                font-size: 13px;
            }

            .author-links {
                display: flex;
                flex-direction: column;
                gap: 4px;

                a {
                    color: #0066cc;
                    text-decoration: none;
                    font-size: 12px;

                    &:hover {
                        text-decoration: underline;
                        color: #004499;
                    }
                }
            }
        }
    }

    .match-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
        border-top: 1px solid #dddddd;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
        }

        .match-title {
            margin: 0;
            font-size: 20px;
            font-weight: bolder;
            color: var(--body-color);
        }

        .match-date {
            color: #666666;
            font-size: 12px;
            font-style: italic;
        }
    }
}

// 简报样式
.briefing {
    background-color: var(--el-fill-color-lighter, #ffffcc);
    border: 1px solid #ffcc00;
    margin: 0;
    padding: 15px 20px;

    .briefing-content {
        font-weight: bold;
        color: #cc6600;
        text-align: center;
        font-size: 15px;
    }
}

// 主要内容样式
.main-content {
    padding: 20px 20px 0 20px;
}

// 排行榜区域样式
.ranking-section {
    margin-bottom: 30px;
    border: 1px solid #dddddd;
    background-color: var(--el-fill-color-blank, #fafafa);

    .section-header {
        background-color: #e6e6e6;
        border-bottom: 1px solid #cccccc;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .section-title {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }

        .section-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;

            .btn-link {
                background: none;
                border: none;
                color: #0066cc;
                text-decoration: underline;
                cursor: pointer;
                font-size: 12px;
                padding: 0;

                &:hover {
                    color: #004499;
                }
            }

            .btn-switch {
                background-color: #0066cc;
                color: white;
                border: 1px solid #0066cc;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;

                &:hover {
                    background-color: #004499;
                    border-color: #004499;
                }
            }

            .rule-text {
                font-size: 12px;
                color: #666666;
                font-style: italic;
            }
        }
    }

    .ranking-table {
        padding: 15px;
        background-color: var(--card-bg);
        overflow-x: auto;

        @media (max-width: 768px) {
            padding: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            table-layout: auto; // 让表格根据内容自动调整列宽

            @media (max-width: 768px) {
                font-size: 13px;
            }

            td {
                padding: 6px 2px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
                vertical-align: middle;
                white-space: nowrap;
            }

            tbody tr:hover {
                background-color: var(--el-fill-color-light, #f9f9f9);
            }

            tbody tr:nth-child(even) {
                background-color: var(--el-fill-color-blank, #fafafa);
            }

            // 列样式控制（不设固定宽度，让内容撑开）
            td:nth-child(1) {
                // 排名
                text-align: center;
                font-weight: 500;
                width: 1%;
                padding: 6px 4px;
            }

            td:nth-child(2) {
                // 选手
                font-weight: 500;
            }

            td:nth-child(4) {
                // 表情
                text-align: center;
                width: 1%;
            }

            td:nth-child(5) {
                // 点数
                text-align: center;
                font-weight: 500;
                // 不设固定宽度，让内容自动撑开
            }
        }

        // 捕虾队评级表格的特殊样式
        &.team-rating-table table {
            table-layout: fixed;
            width: 100%;

            td:nth-child(1) {
                // 队伍
                font-weight: 500;
                width: 15%;
            }

            td:nth-child(2) {
                // 比分
                text-align: center;
                font-weight: 500;
                width: 20%;
                padding: 6px 10px;
            }

            td:nth-child(3) {
                // 对手
                width: 20%;
                padding-right: 15px;
            }

            td:nth-child(4) {
                // 评级
                text-align: left;
                font-weight: 500;
                width: 40%;
                padding-left: 10px;
            }
        }
    }
}

.commentary {
    background-color: #e6e6e6;
    border: 1px solid #b0d4f1;
    margin: 20px;
    padding: 0;

    .commentary-title {
        background-color: #d6ebff;
        border-bottom: 1px solid #b0d4f1;
        margin: 0;
        padding: 12px 15px;
        font-size: 16px;
        font-weight: bold;
        color: #0066cc;
    }

    .commentary-content {
        padding: 15px;
        line-height: 1.8;
        color: var(--body-color);
        text-indent: 2em;
    }
}

// 响应式调整
@media (max-width: 768px) {
    .container {
        margin: 0;
        border-left: none;
        border-right: none;
    }

    .header {
        padding: 12px 15px;
    }

    .briefing {
        padding: 12px 15px;
    }

    .main-content {
        padding: 15px;
    }

    .commentary {
        margin: 15px;
    }
}

@media (max-width: 480px) {
    .ranking-section .section-header {
        flex-direction: column;
        align-items: flex-start;

        .section-actions {
            width: 100%;
            justify-content: flex-start;
        }
    }
}

:deep(.dialog) {
    width: 90%;
    max-width: 600px;

    .el-dialog__header {
        font-weight: bold;
    }

    .el-dialog__body {
        padding: 15px;
    }
}

.pause-notice {
    background: linear-gradient(90deg, #fff4e6 0%, #ffe9e6 100%);
    border: 1px solid #ffb48a;
    margin: 0;
    padding: 15px 20px;

    .notice-content {
        display: flex;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
    }

    .notice-image {
        width: 120px;
        height: auto;
        border-radius: 6px;
        border: 1px solid #ffd1b3;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .notice-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .notice-title {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
        color: #d24d00;
    }

    .notice-desc {
        margin: 0;
        font-size: 14px;
        color: #8a4b2e;
    }
}

@media (max-width: 768px) {
    .pause-notice {
        padding: 12px 15px;

        .notice-image {
            width: 100px;
        }
    }
}
</style>
