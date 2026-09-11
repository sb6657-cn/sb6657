<template>
    <div class="hotwall">
        <h2 class="page-title">⚡ 实时弹幕热度墙</h2>
        <p class="page-sub">
            此刻全站正在玩什么梗？弹幕实时滚动，下面是最近 5 分钟的热门梗排行，谁最火一目了然。
        </p>

        <!-- Connection Status -->
        <div class="live-bar">
            <span class="live-dot" :class="{ off: !connected }">
                <span v-if="connected" class="dot-ping"></span>
            </span>
            <span v-if="connected">已连接，实时更新中</span>
            <span v-else>连接已断开，正在重连…</span>
            <span class="online-count">在线事件：{{ eventCount }}</span>
        </div>

        <!-- Real-time Stream -->
        <div class="stream" ref="streamRef">
            <div v-for="ev in stream" :key="ev.key" class="stream-item" :class="'ev-' + ev.type">
                <span class="ev-badge" :class="'badge-' + ev.type">{{ typeName(ev.type) }}</span>
                <span class="ev-text">{{ ev.barrage }}</span>
                <span class="ev-time">{{ ev.timeStr }}</span>
            </div>
            <div v-if="!stream.length" class="stream-empty">等待事件推送…</div>
        </div>

        <!-- Hot Ranking -->
        <h3 class="rank-title">🔥 最近 5 分钟热度榜</h3>
        <ul class="rank-list">
            <li v-for="(m, i) in ranking" :key="m.barrageId" class="rank-item slide-in" :style="{ animationDelay: i * 0.06 + 's' }">
                <span class="rank-no" :class="{ fire: i === 0 }">{{ i + 1 }}</span>
                <el-popover v-if="m.tags || m.submitTime" placement="top" :width="'auto'" trigger="hover">
                    <template #default>
                        <div v-if="m.tags" class="tag-list">
                            <div v-for="item in getDisplayTags(m.tags, allTags)" :key="item.label">
                                <el-tag round effect="dark" class="tag-item">
                                    <div class="tag-icon-wrapper">
                                        <img v-if="item.iconUrl" :src="item.iconUrl" class="tag-icon" />
                                        <span class="tag-label">{{ item.label }}</span>
                                    </div>
                                </el-tag>
                            </div>
                        </div>
                        <div v-if="m.submitTime" class="submit-time">📅 {{ fmtTimeFromTs(m.submitTime) }}</div>
                    </template>
                    <template #reference>
                        <span class="rank-text">{{ m.barrage }}</span>
                    </template>
                </el-popover>
                <span v-else class="rank-text">{{ m.barrage }}</span>
                <span class="rank-bar-wrap">
                    <span class="rank-bar" :style="{ width: barWidth(m.count) + '%' }"></span>
                </span>
                <span class="rank-count">{{ m.count }}</span>
            </li>
            <li v-if="!ranking.length" class="empty">暂无热度数据</li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { API } from '@/constants/backend';
import httpInstance from '@/apis/httpInstance';
import { useMemeTagsStore } from '@/stores/memeTags';
import { getDisplayTags } from '@/utils/tags';
import type { getMemeTags as memeTag } from '@/types/meme';

const memeTagsStore = useMemeTagsStore();
const allTags = ref<memeTag[]>([]);
memeTagsStore.tagsLoaded.then(() => { allTags.value = memeTagsStore.memeTags; });

interface StreamEv { key: string; type: string; barrage: string; timeStr: string; }
interface RankItem { barrageId: number; barrage: string; count: number; live?: boolean; tags?: string; submitTime?: number; }

const connected = ref(false);
const eventCount = ref(0);
const stream = ref<StreamEv[]>([]);
const ranking = ref<RankItem[]>([]);
const streamRef = ref<HTMLElement | null>(null);
let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let abort: AbortController | null = null;
let reconnectTimer: any = null;
let alive = true;

function typeName(t: string) {
    return { submit: '投稿', copy: '复制', search: '搜索', view: '浏览', pick: '选梗', burst: '爆发' }[t] || t;
}
function fmtTime(ts: number) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
function fmtTimeFromTs(ts: number) {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function barWidth(count: number) {
    const max = ranking.value.length > 0 ? Math.max(...ranking.value.map(r => r.count), 1) : 1;
    return Math.round((count / max) * 100);
}

async function connect() {
    try {
        abort = new AbortController();
        const token = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1] || '';
        const base = httpInstance.defaults.baseURL || '';
        const resp = await fetch(`${base}${API.HOTWALL_STREAM}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, dpahjdoiaw: 'eAR48ZFJwfRTy6SyQPFj' },
            signal: abort.signal,
        });
        if (!resp.ok || !resp.body) { scheduleReconnect(); return; }
        connected.value = true;
        reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (alive) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';
            for (const block of blocks) {
                if (!block.trim()) continue;
                let eventName = '';
                let dataStr = '';
                for (const line of block.split('\n')) {
                    if (line.startsWith('event:')) eventName = line.replace(/^event:\s*/, '').trim();
                    else if (line.startsWith('data:')) dataStr += line.replace(/^data:\s?/, '');
                }
                if (!dataStr) continue;
                try {
                    const data = JSON.parse(dataStr);
                    if (eventName === 'snapshot') {
                        if (data && data.items) ranking.value = data.items;
                    } else if (eventName === 'event') {
                        eventCount.value++;
                        stream.value.unshift({
                            key: data.id + '-' + Date.now(),
                            type: data.type,
                            barrage: data.barrage,
                            timeStr: fmtTime(data.time),
                        });
                        if (stream.value.length > 40) stream.value.pop();
                        await nextTick();
                        if (streamRef.value) streamRef.value.scrollTop = 0;
                    }
                } catch { /* ignore non-json */ }
            }
        }
    } catch { scheduleReconnect(); }
    finally { connected.value = false; }
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, 3000);
}
function disconnect() {
    alive = false;
    abort?.abort();
    reader?.cancel().catch(() => {});
    if (reconnectTimer) clearTimeout(reconnectTimer);
}

onMounted(() => { alive = true; connect(); });
onUnmounted(disconnect);
</script>

<style scoped lang="scss">
.hotwall {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background: var(--content-bg);
}
.page-title {
    font-size: 24px; font-weight: 900;
    background: linear-gradient(90deg, #ffd666, #ff6b35, #e74c3c);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin: 0 0 4px;
}
.page-sub { color: #666; font-size: 14px; margin: 0 0 16px; }

html.dark .page-sub,
html.dark .online-count {
    color: var(--el-text-color-secondary);
}

/* Live Bar */
.live-bar {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--body-color); margin-bottom: 12px;
    background: var(--el-fill-color-light, #f8f8f8); border-radius: 10px; padding: 8px 14px;
    opacity: 0.8;
}
.live-dot {
    position: relative; width: 12px; height: 12px; border-radius: 50%;
    background: #52c41a; flex-shrink: 0;
}
.live-dot.off { background: #bbb; }
.dot-ping {
    position: absolute; inset: -3px; border-radius: 50%;
    border: 2px solid #52c41a;
    animation: ping 1.5s ease-out infinite;
}
@keyframes ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
.online-count { margin-left: auto; font-weight: 600; color: #999; }

/* Stream */
.stream {
    background: linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e);
    border-radius: 14px; padding: 12px; height: 300px;
    overflow-y: auto; margin-bottom: 18px;
    box-shadow: inset 0 2px 12px rgba(0,0,0,0.4);
}
.stream-empty { color: #555; text-align: center; padding: 40px; }
.stream-item {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 4px; font-size: 14px; color: #ddd;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    animation: stream-in 0.3s ease;
}
@keyframes stream-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.ev-badge {
    font-size: 11px; padding: 1px 8px; border-radius: 8px;
    white-space: nowrap; font-weight: 600;
}
.badge-submit { background: rgba(114,46,209,0.3); color: #b37feb; }
.badge-copy { background: rgba(255,215,0,0.3); color: #ffd666; }
.badge-search { background: rgba(64,158,255,0.3); color: #69b1ff; }
.badge-view { background: rgba(82,196,26,0.3); color: #95de64; }
.badge-pick { background: rgba(255,159,67,0.3); color: #ffc069; }
.badge-burst { background: rgba(231,76,60,0.35); color: #ff6b6b; font-weight: 700; }
.ev-text { flex: 1; }
.ev-time { color: #666; font-size: 12px; white-space: nowrap; min-width: 48px; text-align: right; }

/* Rank */
.rank-title { font-size: 17px; font-weight: 700; margin: 0 0 10px; }
.rank-list { list-style: none; margin: 0; padding: 0; }
.rank-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 6px; border-bottom: 1px dashed var(--el-border-color-lighter, #f0f0f0);
    opacity: 0; animation: slide-in 0.35s ease forwards;
}
@keyframes slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.rank-no {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--el-fill-color-light, #f0f0f0); color: var(--body-color); font-weight: 700; font-size: 13px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    opacity: 0.7;
}
.rank-no.fire {
    background: linear-gradient(135deg, #ff6b35, #ffd666);
    color: #fff; box-shadow: 0 2px 10px rgba(255,107,53,0.4);
    animation: fire-glow 1.5s ease infinite;
}
@keyframes fire-glow { 0%,100% { box-shadow: 0 2px 10px rgba(255,107,53,0.4); } 50% { box-shadow: 0 2px 20px rgba(255,107,53,0.7); } }
.rank-text { flex: 1; font-size: 14px; }
.rank-bar-wrap {
    width: 100px; height: 6px; background: var(--el-fill-color-light, #f0f0f0); border-radius: 3px; overflow: hidden;
}
.rank-bar {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #36cfc9, #409eff, #722ed1);
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.rank-count { color: #ff6b35; font-weight: 700; font-size: 14px; min-width: 30px; text-align: right; }
.empty { color: #bbb; text-align: center; padding: 16px; }
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
</style>