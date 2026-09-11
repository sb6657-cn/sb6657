<template>
    <div class="checkin">
        <h2 class="page-title">💰 签到 & 梗币钱包</h2>
        <p class="page-sub">
            每天签到领梗币，连续签到奖励更多。梗币可以给喜欢的烂梗打赏，让作者更有动力投稿！
        </p>

        <!-- Wallet Card -->
        <div class="wallet-card holo-card">
            <div class="wallet-chip"></div>
            <div class="wallet-balance">
                <span class="balance-num">{{ wallet?.balance ?? 0 }}</span>
                <span class="balance-unit">梗币</span>
            </div>
            <div class="wallet-meta">
                <div><span class="meta-label">累计获得</span><span class="meta-value">{{ wallet?.totalEarned ?? 0 }}</span></div>
                <div><span class="meta-label">累计花费</span><span class="meta-value">{{ wallet?.totalSpent ?? 0 }}</span></div>
            </div>
            <div class="holo-shine"></div>
        </div>

        <!-- Checkin Section -->
        <div class="checkin-card" :class="{ 'celebrate': justSigned }">
            <template v-if="!checked">
                <button class="sign-btn" @click="sign">
                    <span class="sign-icon">📅</span>
                    <span class="sign-text">今日签到 +{{ todayCoin }} 梗币</span>
                    <span class="sign-sparkle"></span>
                </button>
                <div class="streak-bar">
                    <span v-for="d in 7" :key="d" class="streak-dot" :class="{ active: continuous >= d, today: d === continuous + 1 }">
                        {{ d }}
                    </span>
                </div>
                <div class="streak-info">
                    连续签到 <b>{{ continuous }}</b> 天（连续 7 天额外 +15 梗币🔥）
                </div>
            </template>
            <template v-else>
                <div class="signed-badge">
                    <div class="signed-icon">✅</div>
                    <div class="signed-text">今日已签到</div>
                    <div class="signed-continuous">连续 {{ continuous }} 天</div>
                </div>
            </template>
        </div>

        <!-- Coin Rain (on sign) -->
        <div v-if="showCoinRain" class="coin-rain">
            <span v-for="n in 12" :key="n" class="coin-particle" :style="{ left: Math.random() * 100 + '%', animationDelay: Math.random() * 0.5 + 's' }">🪙</span>
        </div>

        <!-- Reward Section -->
        <div class="reward-box">
            <h3 class="reward-title">🎁 给烂梗打赏</h3>
            <div class="reward-form">
                <el-select
                    v-model="rewardBarrageId"
                    filterable remote reserve-keyword clearable
                    placeholder="🔍 搜索烂梗内容来选择"
                    :remote-method="searchMeme"
                    :loading="searching"
                    style="width: 260px"
                >
                    <el-option v-for="m in memeOptions" :key="m.id" :label="m.barrage" :value="m.id" />
                </el-select>
                <el-input-number v-model="rewardAmount" :min="1" :max="Math.max(1, wallet?.balance || 1)" :disabled="!wallet || (wallet?.balance || 0) < 1" />
                <button class="reward-btn" @click="reward">💰 打赏</button>
            </div>
            <p class="reward-tip">打赏会从你的梗币余额中扣除，直接送给烂梗作者。</p>
        </div>

        <div v-if="!wallet" class="login-tip">🔒 登录后可签到、领梗币、打赏</div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API } from '@/constants/backend';
import { get, post } from '@/apis/httpInstance';
import { ElMessage } from 'element-plus';

interface Wallet { balance: number; totalEarned: number; totalSpent: number; }
interface CheckinResult { continuous: number; coin: number; }

const wallet = ref<Wallet | null>(null);
const checked = ref(false);
const continuous = ref(0);
const todayCoin = ref(5);
const justSigned = ref(false);
const showCoinRain = ref(false);

const rewardBarrageId = ref<number | null>(null);
const rewardAmount = ref(5);
const memeOptions = ref<{ id: number; barrage: string }[]>([]);
const searching = ref(false);

async function searchMeme(keyword: string) {
    if (!keyword) { memeOptions.value = []; return; }
    searching.value = true;
    const res = await post({ url: API.SEARCH_MEME, data: { barrage: keyword, pageNum: 1, pageSize: 20, sort: 0 } });
    searching.value = false;
    if (!res._failure && res.flatData) { const d = res.flatData as any; memeOptions.value = d.list || []; }
}
async function loadWallet() {
    const res = await get<Wallet>(API.CHECKIN_WALLET);
    if (!res._failure && res.flatData) wallet.value = res.flatData;
}
async function loadStatus() {
    const res = await get<CheckinResult | null>(API.CHECKIN_STATUS);
    if (!res._failure) { checked.value = !!res.flatData; continuous.value = res.flatData?.continuous || 0; }
}
async function sign() {
    const res = await post({ url: API.CHECKIN_SIGN, data: {} });
    if (res._failure) { ElMessage.warning('签到失败'); return; }
    const r = res.flatData as CheckinResult;
    checked.value = true;
    continuous.value = r.continuous;
    justSigned.value = true;
    showCoinRain.value = true;
    setTimeout(() => { justSigned.value = false; showCoinRain.value = false; }, 2500);
    ElMessage.success(`🎉 签到成功！连续 ${r.continuous} 天，获得 ${r.coin} 梗币`);
    loadWallet();
}
async function reward() {
    if (!rewardBarrageId.value) { ElMessage.warning('请填写烂梗 ID'); return; }
    const res = await post({ url: API.CHECKIN_REWARD, data: { barrageId: rewardBarrageId.value, amount: rewardAmount.value } });
    if (res._failure) { ElMessage.warning('打赏失败'); return; }
    ElMessage.success('🎁 打赏成功！');
    rewardBarrageId.value = null;
    loadWallet();
}

onMounted(() => { loadWallet(); loadStatus(); });
</script>

<style scoped lang="scss">
.checkin {
    max-width: 640px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
    overflow: hidden;
}
.page-title {
    font-size: 26px; font-weight: 900;
    background: linear-gradient(90deg, #ffd666, #ff9f43, #f7ba1e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin: 0 0 4px;
}
.page-sub { color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }

html.dark .page-sub,
html.dark .reward-tip,
html.dark .login-tip {
    color: var(--el-text-color-secondary);
}

/* Holographic Wallet */
.wallet-card {
    position: relative; border-radius: 18px; padding: 22px; margin-bottom: 16px;
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    color: #fff; overflow: hidden;
}
.wallet-chip {
    width: 36px; height: 26px; border-radius: 4px;
    background: linear-gradient(135deg, #ffd700, #daa520);
    margin-bottom: 14px;
}
.wallet-balance { display: flex; align-items: baseline; gap: 6px; }
.balance-num { font-size: 40px; font-weight: 900; font-variant-numeric: tabular-nums; }
.balance-unit { font-size: 15px; opacity: 0.7; }
.wallet-meta { display: flex; gap: 20px; margin-top: 12px; }
.meta-label { display: block; font-size: 11px; opacity: 0.6; }
.meta-value { font-size: 14px; font-weight: 600; }
.holo-shine {
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
    animation: holo-sweep 4s ease-in-out infinite;
    pointer-events: none;
}
@keyframes holo-sweep {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

/* Checkin Card */
.checkin-card {
    background: var(--card-bg); border: 2px solid var(--el-border-color-lighter, #f0f0f0); border-radius: 16px;
    padding: 24px; text-align: center; margin-bottom: 16px;
    transition: all 0.3s;
}
.checkin-card.celebrate {
    border-color: #52c41a;
    animation: celebrate-pulse 0.6s ease;
}
@keyframes celebrate-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }

/* Sign Button */
.sign-btn {
    position: relative; background: linear-gradient(135deg, #52c41a, #36cfc9);
    color: #fff; border: none; padding: 14px 32px; border-radius: 30px;
    font-size: 17px; font-weight: 700; cursor: pointer; overflow: hidden;
    transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
}
.sign-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(82,196,26,0.35); }
.sign-icon { font-size: 20px; }
.sign-sparkle {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: btn-shine 2s ease infinite;
}
@keyframes btn-shine { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

/* Streak Bar */
.streak-bar {
    display: flex; justify-content: center; gap: 8px; margin: 14px 0 8px;
}
.streak-dot {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--el-fill-color-light, #f0f0f0); color: var(--body-color); font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s;
    opacity: 0.5;
}
.streak-dot.active {
    background: linear-gradient(135deg, #ffd666, #ff9f43);
    color: #fff; box-shadow: 0 2px 8px rgba(255,159,67,0.4);
}
.streak-dot.today {
    border: 2px dashed #ff9f43; color: #ff9f43; background: #fff7e6;
    animation: dot-pulse 1.5s ease infinite;
}
@keyframes dot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.streak-info { font-size: 13px; color: #666; }

/* Signed Badge */
.signed-badge { padding: 10px; }
.signed-icon { font-size: 36px; margin-bottom: 6px; }
.signed-text { font-size: 18px; font-weight: 700; color: #52c41a; }
.signed-continuous { font-size: 14px; color: #999; margin-top: 4px; }

/* Coin Rain */
.coin-rain {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999;
}
.coin-particle {
    position: absolute; top: -20px; font-size: 24px;
    animation: coin-drop 1.5s ease-in forwards;
}
@keyframes coin-drop {
    0% { transform: translateY(0) rotate(0); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* Reward Section */
.reward-box {
    background: var(--card-bg); border: 2px solid var(--el-border-color-lighter, #f0f0f0); border-radius: 14px;
    padding: 18px; transition: border-color 0.3s;
}
.reward-box:hover { border-color: #ffd666; }
.reward-title { margin: 0 0 12px; font-size: 17px; font-weight: 700; }
.reward-form { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.reward-btn {
    background: linear-gradient(135deg, #f7ba1e, #ff9f43); color: #fff;
    border: none; padding: 8px 20px; border-radius: 20px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.25s;
}
.reward-btn:hover { transform: scale(1.05); box-shadow: 0 4px 14px rgba(247,186,30,0.4); }
.reward-tip { margin: 10px 0 0; font-size: 12px; color: #999; }
.login-tip { text-align: center; color: #bbb; margin-top: 16px; font-size: 14px; }

@media (max-width: 600px) {
    .reward-form { flex-direction: column; align-items: stretch; }
    .wallet-meta { flex-direction: column; gap: 8px; }
}
</style>
