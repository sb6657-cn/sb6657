<template>
    <Teleport to="body">
        <el-dialog
            v-model="dialogVisible"
            title="合成大猪头"
            :width="isMobile ? '100%' : '760px'"
            :fullscreen="isMobile"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="true"
            :destroy-on-close="true"
            align-center
            class="merge-pig-dialog"
        >
            <div v-if="dialogVisible" class="merge-pig-content">
                <!-- 左侧：游戏 -->
                <div class="merge-pig-wrapper" ref="gameContainer"></div>

                <!-- 右侧：排行榜 -->
                <div class="merge-pig-leaderboard" v-if="!isMobile || showMobileLeaderboard">
                    <div style="padding: 6px 10px; font-size: 12px; color: #28553a; text-align: center;">
                        <span>感谢群友开源:</span>
                        <a style="font-size: 12px;" href="https://github.com/Arch-Tempered-mortis/merge-big-milk-frog" target="_blank">合成大奶蛙   </a>
                        <a style="font-size: 12px;" href="http://106.14.241.182/" target="_blank">原版   </a>
                        <a style="font-size: 12px;" href="https://space.bilibili.com/305672036" target="_blank">B站</a>
                    </div>
                    <div class="leaderboard-header">
                        <span class="title">🏆 排行榜 TOP100</span><span style="font-size: 11px; color: #000;">登录以记录昵称</span>
                        <el-button text type="primary" size="small" @click="loadLeaderboard">
                            刷新
                        </el-button>
                    </div>

                    <!-- 个人位置卡片 -->
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

                    <!-- 列表 -->
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
                                    <span class="level">{{ item.level }}级猪头</span>
                                    <span class="time">{{ formatTime(item.createTime) }}</span>
                                </div>
                            </div>
                            <el-empty v-if="!loading && leaderboard.length === 0" description="暂无排行数据" />
                        </div>
                    </el-scrollbar>

                    <!-- 移动端关闭排行榜按钮 -->
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
import { mergePigDialogVisible } from './state';
import { useIsMobile } from '@/composables/useIsMobile';
import { MergeMilkFrogGame } from './native/game.js';
import { MergePigWsClient, getSiteToken } from './native/wsClient.js';
import { fetchMergePigLeaderboard, fetchMergePigRank, type MergePigLeaderboardItem, type MergePigRankInfo } from '@/apis/mergePig';
import { ElMessageBox } from 'element-plus';
import './native/style.css';

// 格式化时间：2026-08-05T20:07:17.000+08:00 -> 08-05 20:07
function formatTime(iso: string): string {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
}

const isMobile = useIsMobile();
const dialogVisible = mergePigDialogVisible;
const gameContainer = ref<HTMLElement | null>(null);
let gameInstance: InstanceType<typeof MergeMilkFrogGame> | null = null;
let wsClient: MergePigWsClient | null = null;

// 移动端排行榜显示状态
const showMobileLeaderboard = ref(false);

const leaderboard = ref<MergePigLeaderboardItem[]>([]);
const myRank = ref<MergePigRankInfo | null>(null);
const loading = ref(false);
const myNickname = ref<string | null>(null);

async function loadLeaderboard() {
    loading.value = true;
    try {
        leaderboard.value = await fetchMergePigLeaderboard(100);
    } catch (e) {
        console.error('[MergePig] leaderboard error', e);
    } finally {
        loading.value = false;
    }
}

async function loadMyRank(siteToken: string) {
    try {
        myRank.value = await fetchMergePigRank(siteToken);
        // 顺便查出昵称（读 cookie）
        myNickname.value = getCookie('nickname');
    } catch (e) {
        console.error('[MergePig] rank error', e);
    }
}

function getCookie(name: string): string | null {
    const m = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : null;
}

function makeCallbacks() {
    return {
        onRestartRequest: () => {
            ElMessageBox.confirm('重新开始会清空本局进度，确定要继续吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }).then(async () => {
                // 1. 先销毁旧实例
                gameInstance?.destroy();
                // 2. 创建新实例
                gameInstance = new MergeMilkFrogGame(gameContainer.value!, makeCallbacks());
                // 3. 先绑定处理器，确保 handler 就绪
                wire(gameInstance);
                // 4. 最后发送 restart 请求，确保 handler 已就绪
                await nextTick();
                wsClient?.sendRestart();
            }).catch(() => {
                // 用户取消，不做任何操作
            });
        },
        onPlayAgain: () => {
            // 1. 先销毁旧实例
            gameInstance?.destroy();
            // 2. 创建新实例
            gameInstance = new MergeMilkFrogGame(gameContainer.value!, makeCallbacks());
            // 3. 先绑定处理器，确保 handler 就绪
            wire(gameInstance);
            // 4. 最后发送 restart 请求
            nextTick(() => {
                wsClient?.sendRestart();
            });
        },
        onLeaderboardOpen: () => {
            showMobileLeaderboard.value = true;
        },
    };
}

function wire(game: InstanceType<typeof MergeMilkFrogGame>) {
    game.wsClient = wsClient;
    if (wsClient) {
        wsClient.handlers.onInit = (q, b) => game.onServerInit(q, b);
        wsClient.handlers.onNextBall = (level) => game.onServerNextBall(level);
        wsClient.handlers.onGameOver = async (_win, score) => {
            // 游戏结束后刷新榜单 + 个人排名
            await loadLeaderboard();
            const siteToken = getSiteToken();
            if (siteToken) await loadMyRank(siteToken);
        };
        wsClient.handlers.onNetworkStatusChange = (online) => {
            game.setNetworkStatus(online);
        };
    }
    game.start();
}

watch(dialogVisible, async (visible) => {
    if (!visible) {
        wsClient?.close();
        wsClient = null;
        gameInstance?.destroy();
        gameInstance = null;
        if (gameContainer.value) gameContainer.value.innerHTML = '';
    }
    if (visible) {
        await nextTick();
        if (gameContainer.value && !gameInstance) {
            const siteToken = getSiteToken() || 'anonymous-' + Date.now();
            wsClient = new MergePigWsClient(siteToken, {});
            wsClient.connect();
            gameInstance = new MergeMilkFrogGame(gameContainer.value!, makeCallbacks());
            wire(gameInstance);

            // 加载榜单 + 个人位置
            await loadLeaderboard();
            await loadMyRank(siteToken);
        }
    }
});

onBeforeUnmount(() => {
    wsClient?.close();
});
</script>

<style scoped lang="scss">
.merge-pig-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
        overflow: hidden;
    }
}

.merge-pig-content {
    display: flex;
    width: 100%;
    height: min(80dvh, 800px);
    min-height: 650px;
    background: #f8edb8;
    border-radius: 8px;
    overflow: hidden;

    html.dark & {
        box-shadow: inset 0 0 0 1px var(--el-border-color);
    }
}

.merge-pig-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.merge-pig-wrapper :deep(.game-card) {
    width: 100%;
    height: 100%;
    min-height: 650px;
    border-radius: 0;
    border: none;
    box-shadow: none;
}

.merge-pig-wrapper :deep(.page-shell) {
    padding: 0;
    min-height: 100%;
}

.merge-pig-wrapper :deep(.github-link) {
    display: none !important;
}

/* ===== 排行榜 ===== */
.merge-pig-leaderboard {
    width: 280px;
    flex-shrink: 0;
    background: #fffbe2;
    border-left: 1px solid rgba(70, 123, 76, 0.18);
    display: flex;
    flex-direction: column;

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
        color: #000;
        .rank-no, .score { color: #000; }
    }

    &.top-2 {
        background: linear-gradient(90deg, #d6dce0, #b9c2c8);
        color: #000;
        .rank-no, .score { color: #000; }
    }

    &.top-3 {
        background: linear-gradient(90deg, #f4a866, #d68850);
        color: #000;
        .rank-no, .score { color: #000; }
    }

    &.is-mine:not(.top-1):not(.top-2):not(.top-3) {
        background: rgba(108, 148, 75, 0.16);
        border: 1px solid rgba(108, 148, 75, 0.4);
    }
}

/* 移动端全屏时不显示排行榜 */
@media (max-width: 600px) {
    .merge-pig-content {
        height: 100%;
        min-height: 100%;
        border-radius: 0;
    }
}

/* 移动端排行榜按钮 */
.mobile-leaderboard-btn {
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    z-index: 100;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 700;
    background: linear-gradient(90deg, #ffd86b, #ffb347);
    color: #4a2a00;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(255, 179, 71, 0.4);
}

/* 移动端排行榜关闭按钮 */
.mobile-leaderboard-close {
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    z-index: 100;
    padding: 8px 0;
}

.mobile-leaderboard-close .el-button {
    width: 100%;
    font-size: 14px;
}
</style>
