<template>
  <div class="ai-chat-wrapper" :class="themeClass">
    <aside class="session-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span v-show="!sidebarCollapsed">会话记录</span>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '▶' : '◀' }}
        </button>
      </div>
      <button v-show="!sidebarCollapsed" class="new-chat-btn" @click="startNewChat">
        + 新建对话
      </button>
      <div v-show="!sidebarCollapsed" class="session-list">
        <div
          v-for="s in sessions"
          :key="s.id"
          :class="['session-item', { active: s.id === currentSessionId }]"
          @click="switchSession(s.id)"
          @contextmenu.prevent="confirmDeleteSession(s.id)"
        >
          <div class="session-title">{{ s.title }}</div>
          <div class="session-meta">
            <span :class="['type-badge', s.sessionType === 'MEME' ? 'meme' : 'chat']">
              {{ s.sessionType === 'MEME' ? '🎯' : '💬' }}
            </span>
            <span class="msg-count">{{ s.messageCount }}条</span>
          </div>
        </div>
        <div v-if="sessions.length === 0" class="empty-hint">暂无会话</div>
      </div>
    </aside>

    <main class="chat-main">
      <header class="chat-header">
        <div class="header-left">
          <h3>{{ currentTitle || '6657 AI 造梗与电竞 Agent' }}</h3>
          <span class="model-badge">串子 Agent · 已接入6657站内工具</span>
        </div>
        <div class="header-right">
          <span class="header-stat-pill" @click="quickPrompt('帮我执行今日签到领梗币，再随机抽3条烂梗乐呵一下', 'chat')">
            🪙 签到领梗币
          </span>
          <span class="header-stat-pill" @click="quickPrompt('看看今天大家都投稿了什么梗', 'chat')">
            🆕 今日新梗
          </span>
        </div>
      </header>

      <div class="chat-window" ref="chatWindow">
        <div v-if="messages.length === 0 && !streaming" class="welcome-msg">
          <div class="welcome-hero-card">
            <div class="welcome-hero-badge">⚡ 6657 AI AGENT WORKSPACE</div>
            <h2>6657 玩机器 AI 造梗搭子 &amp; 站内智能体</h2>
            <p>自主调用站内烂梗库、最新入库投稿、烂梗擂台PK、生命周期、CS2赛事与每日签到，卡片化直出弹幕</p>
          </div>

          <div class="welcome-cards-grid">
            <div
              v-for="(item, idx) in welcomeCards"
              :key="'wc-' + idx"
              class="feature-card"
              @click="quickPrompt(item.prompt, item.mode)"
            >
              <div class="feature-card-top">
                <span class="feature-card-icon">{{ item.icon }}</span>
                <span :class="['feature-card-tag', item.mode]">{{ item.tag }}</span>
              </div>
              <div class="feature-card-title">{{ item.title }}</div>
              <div class="feature-card-desc">{{ item.desc }}</div>
              <div class="feature-card-action">立即唤起 →</div>
            </div>
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="'msg-' + idx" :class="['msg-row', msg.role]">
          <img class="avatar" :src="msg.role === 'user' ? userAvatar : aiAvatar" :alt="msg.role" />
          <div class="msg-body">
            <div v-if="msg.toolEvents && msg.toolEvents.length > 0" class="tool-cards-deck">
              <div
                v-for="(te, tIdx) in getMergedToolEvents(msg.toolEvents)"
                :key="'ht-' + tIdx"
                class="tool-visual-card"
              >
                <div class="tool-visual-header">
                  <div class="tool-visual-title-wrap">
                    <span :class="['tool-status-pill', te.done ? 'done' : 'calling']">
                      {{ te.done ? '✅ 已完成' : '⏳ 调用中' }}
                    </span>
                    <span class="tool-visual-title">{{ te.toolTitle }}</span>
                  </div>
                  <span class="tool-visual-name">{{ te.toolName }}</span>
                </div>

                <div v-if="te.cardType === 'meme_list' && te.cardData?.items?.length" class="data-card-memes">
                  <div class="data-card-subtitle">{{ te.cardData.title }}</div>
                  <div class="meme-items-grid">
                    <div
                      v-for="(m, mIdx) in te.cardData.items"
                      :key="'m-' + mIdx"
                      class="meme-mini-card"
                    >
                      <div class="meme-mini-top">
                        <span v-if="m.id" class="meme-id-chip">#{{ m.id }}</span>
                        <span v-if="m.badge" class="meme-tag-chip">{{ m.badge }}</span>
                        <span v-if="m.time" class="meme-time-chip">{{ formatShortDate(m.time) }}</span>
                      </div>
                      <div class="meme-mini-text">{{ m.barrage }}</div>
                      <div class="meme-mini-footer">
                        <button type="button" class="mini-act-btn" @click="copyText(m.barrage)">📋 复制弹幕</button>
                        <button type="button" class="mini-act-btn accent" @click="quickPrompt('围绕这条烂梗改写5条更有节目效果的新梗：' + m.barrage, 'meme')">✨ 拿去改梗</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'user_wallet' && te.cardData" class="data-card-wallet">
                  <div class="wallet-stats-row">
                    <div class="wallet-stat-box">
                      <div class="wallet-stat-label">今日签到</div>
                      <div :class="['wallet-stat-val', te.cardData.todayCheckedIn ? 'ok' : 'warn']">
                        {{ te.cardData.todayCheckedIn ? '已签到 ✅' : '未签到' }}
                      </div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.todayCheckinDetail">
                      <div class="wallet-stat-label">连续签到</div>
                      <div class="wallet-stat-val">{{ te.cardData.todayCheckinDetail.continuous || 1 }} 天 (+{{ te.cardData.todayCheckinDetail.coin || 0 }}币)</div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.myWallet">
                      <div class="wallet-stat-label">梗币余额</div>
                      <div class="wallet-stat-val gold">🪙 {{ te.cardData.myWallet.memeCoin ?? te.cardData.myWallet.balance ?? 0 }}</div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.myGrowth">
                      <div class="wallet-stat-label">梗王段位</div>
                      <div class="wallet-stat-val">👑 {{ te.cardData.myGrowth.levelTitle || ('Lv.' + (te.cardData.myGrowth.level ?? 1)) }}</div>
                    </div>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'arena_pk' && te.cardData" class="data-card-arena">
                  <div v-if="te.cardData.currentMatch" class="arena-vs-box">
                    <div class="arena-side left">
                      <div class="arena-badge">🔴 红方擂台</div>
                      <div class="arena-barrage">{{ te.cardData.currentMatch.leftBarrage || te.cardData.currentMatch.barrageA || '红方烂梗' }}</div>
                      <div class="arena-votes">{{ te.cardData.currentMatch.leftVotes ?? te.cardData.currentMatch.votesA ?? 0 }} 票</div>
                    </div>
                    <div class="arena-vs-divider">VS</div>
                    <div class="arena-side right">
                      <div class="arena-badge">🔵 蓝方擂台</div>
                      <div class="arena-barrage">{{ te.cardData.currentMatch.rightBarrage || te.cardData.currentMatch.barrageB || '蓝方烂梗' }}</div>
                      <div class="arena-votes">{{ te.cardData.currentMatch.rightVotes ?? te.cardData.currentMatch.votesB ?? 0 }} 票</div>
                    </div>
                  </div>
                  <div v-else class="tool-plain-summary">{{ te.summary }}</div>
                </div>

                <div v-else-if="te.cardType === 'lifecycle_dna' && te.cardData?.stageList?.length" class="data-card-stages">
                  <div class="stages-pill-grid">
                    <div v-for="(st, sIdx) in te.cardData.stageList" :key="'st-' + sIdx" class="stage-pill-card">
                      <div class="stage-pill-name">{{ st.stage }}</div>
                      <div class="stage-pill-count">{{ st.count }} 条</div>
                    </div>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'tags_wordcloud' && te.cardData?.words?.length" class="data-card-tags">
                  <div class="tags-cloud-wrap">
                    <span
                      v-for="(w, wIdx) in te.cardData.words"
                      :key="'w-' + wIdx"
                      class="word-cloud-chip"
                      @click="quickPrompt('围绕热搜词“' + (w.word || w.name || w) + '”造6条能刷屏的弹幕烂梗', 'meme')"
                    >
                      🔥 {{ w.word || w.name || w }}
                    </span>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'web_search' && te.cardData?.items?.length" class="data-card-websearch">
                  <div class="data-card-subtitle">
                    🌐 联网搜索实时结果：「{{ te.cardData.query }}」
                    <span v-if="te.cardData.remaining !== undefined" class="websearch-quota-chip">
                      今日剩余 {{ te.cardData.remaining }}/{{ te.cardData.maxLimit || 10 }} 次
                    </span>
                  </div>
                  <div class="websearch-items-list">
                    <a
                      v-for="(ws, wIdx) in te.cardData.items"
                      :key="'hws-' + wIdx"
                      :href="ws.url || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="websearch-item-card"
                    >
                      <div class="websearch-item-title">{{ ws.title }}</div>
                      <div class="websearch-item-snippet">{{ ws.snippet }}</div>
                    </a>
                  </div>
                </div>

                <div v-else class="tool-plain-summary">{{ te.summary }}</div>
              </div>
            </div>

            <details v-if="msg.thinkingContent" class="thinking-block">
              <summary>🧠 思考与工具链路</summary>
              <div class="thinking-text markdown-body" v-html="renderMd(msg.thinkingContent)"></div>
            </details>

            <div class="msg-content-card">
              <div class="msg-content markdown-body" v-html="renderMd(msg.content)"></div>

              <div v-if="msg.role === 'assistant' && extractCandidateMemes(msg.content).length > 0" class="ai-generated-meme-deck">
                <div class="deck-header">
                  <span>✨ AI 造梗候选卡片组（点击一键复制或投稿）</span>
                  <span class="deck-count">共 {{ extractCandidateMemes(msg.content).length }} 条</span>
                </div>
                <div class="deck-cards-grid">
                  <div
                    v-for="(cand, cIdx) in extractCandidateMemes(msg.content)"
                    :key="'cand-' + cIdx"
                    class="candidate-meme-card"
                  >
                    <div class="candidate-index">#{{ String(cIdx + 1).padStart(2, '0') }}</div>
                    <div class="candidate-text">{{ cand }}</div>
                    <div class="candidate-actions">
                      <button type="button" class="cand-btn" @click="copyText(cand)">📋 复制</button>
                      <button type="button" class="cand-btn submit" @click="quickPrompt('直接调用投稿工具帮我把这条烂梗提交到站内审核库：' + cand, 'chat')">📤 投稿入库</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="msg-footer-bar">
              <span class="msg-time">{{ formatTime(msg.createTime) }}</span>
              <button v-if="msg.role === 'assistant' && msg.content" type="button" class="msg-copy-all" @click="copyText(msg.content)">
                复制全文
              </button>
            </div>
          </div>
        </div>

        <div v-if="streaming" class="msg-row assistant">
          <img class="avatar" :src="aiAvatar" alt="AI" />
          <div class="msg-body">
            <div v-if="streamTools.length > 0" class="tool-cards-deck">
              <div
                v-for="(te, tIdx) in getMergedToolEvents(streamTools)"
                :key="'st-' + tIdx"
                class="tool-visual-card"
              >
                <div class="tool-visual-header">
                  <div class="tool-visual-title-wrap">
                    <span :class="['tool-status-pill', te.done ? 'done' : 'calling']">
                      {{ te.done ? '✅ 已完成' : '⏳ 调用中' }}
                    </span>
                    <span class="tool-visual-title">{{ te.toolTitle }}</span>
                  </div>
                  <span class="tool-visual-name">{{ te.toolName }}</span>
                </div>

                <div v-if="te.cardType === 'meme_list' && te.cardData?.items?.length" class="data-card-memes">
                  <div class="data-card-subtitle">{{ te.cardData.title }}</div>
                  <div class="meme-items-grid">
                    <div
                      v-for="(m, mIdx) in te.cardData.items"
                      :key="'sm-' + mIdx"
                      class="meme-mini-card"
                    >
                      <div class="meme-mini-top">
                        <span v-if="m.id" class="meme-id-chip">#{{ m.id }}</span>
                        <span v-if="m.badge" class="meme-tag-chip">{{ m.badge }}</span>
                        <span v-if="m.time" class="meme-time-chip">{{ formatShortDate(m.time) }}</span>
                      </div>
                      <div class="meme-mini-text">{{ m.barrage }}</div>
                    </div>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'user_wallet' && te.cardData" class="data-card-wallet">
                  <div class="wallet-stats-row">
                    <div class="wallet-stat-box">
                      <div class="wallet-stat-label">今日签到</div>
                      <div :class="['wallet-stat-val', te.cardData.todayCheckedIn ? 'ok' : 'warn']">
                        {{ te.cardData.todayCheckedIn ? '已签到 ✅' : '未签到' }}
                      </div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.todayCheckinDetail">
                      <div class="wallet-stat-label">连续签到</div>
                      <div class="wallet-stat-val">{{ te.cardData.todayCheckinDetail.continuous || 1 }} 天 (+{{ te.cardData.todayCheckinDetail.coin || 0 }}币)</div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.myWallet">
                      <div class="wallet-stat-label">梗币余额</div>
                      <div class="wallet-stat-val gold">🪙 {{ te.cardData.myWallet.memeCoin ?? te.cardData.myWallet.balance ?? 0 }}</div>
                    </div>
                    <div class="wallet-stat-box" v-if="te.cardData.myGrowth">
                      <div class="wallet-stat-label">梗王段位</div>
                      <div class="wallet-stat-val">👑 {{ te.cardData.myGrowth.levelTitle || ('Lv.' + (te.cardData.myGrowth.level ?? 1)) }}</div>
                    </div>
                  </div>
                </div>

                <div v-else-if="te.cardType === 'web_search' && te.cardData?.items?.length" class="data-card-websearch">
                  <div class="data-card-subtitle">
                    🌐 联网搜索实时结果：「{{ te.cardData.query }}」
                    <span v-if="te.cardData.remaining !== undefined" class="websearch-quota-chip">
                      今日剩余 {{ te.cardData.remaining }}/{{ te.cardData.maxLimit || 10 }} 次
                    </span>
                  </div>
                  <div class="websearch-items-list">
                    <a
                      v-for="(ws, wIdx) in te.cardData.items"
                      :key="'sws-' + wIdx"
                      :href="ws.url || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="websearch-item-card"
                    >
                      <div class="websearch-item-title">{{ ws.title }}</div>
                      <div class="websearch-item-snippet">{{ ws.snippet }}</div>
                    </a>
                  </div>
                </div>

                <div v-else class="tool-plain-summary">{{ te.summary }}</div>
              </div>
            </div>

            <details v-if="streamThinking" class="thinking-block" open>
              <summary>🧠 实时思考与工具执行过程...</summary>
              <div class="thinking-text markdown-body" v-html="renderMd(streamThinking)"></div>
            </details>

            <div class="msg-content-card">
              <div class="msg-content markdown-body">
                <span v-if="!streamContent" class="waiting-text">
                  {{ streamThinking ? 'AI 正在结合检索情报深度思考，即将输出正文...' : 'Agent 正在调取数据与建立流式连接...' }}
                </span>
                <div v-else v-html="renderMd(streamContent)"></div>
              </div>
              <span class="cursor-blink">|</span>
            </div>
          </div>
        </div>
      </div>

      <form class="input-area" @submit.prevent="sendMessage">
        <div class="options-bar">
          <div class="mode-group">
            <span class="option-label">模式</span>
            <div class="mode-toggle">
              <button
                type="button"
                :class="['mode-btn', chatMode === 'chat' ? 'active' : '']"
                @click="chatMode = 'chat'"
                :disabled="streaming"
              >
                <span class="mode-icon">💬</span>
                <span class="mode-text">闲聊/Agent</span>
              </button>
              <button
                type="button"
                :class="['mode-btn', chatMode === 'meme' ? 'active' : '']"
                @click="chatMode = 'meme'"
                :disabled="streaming"
              >
                <span class="mode-icon">🎯</span>
                <span class="mode-text">造梗</span>
              </button>
            </div>
          </div>

          <div class="options-divider"></div>

          <div v-if="chatMode === 'meme'" class="meme-count-group">
            <span class="option-label">数量</span>
            <select v-model.number="memesNum" :disabled="streaming" class="meme-count-select">
              <option :value="6">6条</option>
              <option :value="8">8条</option>
              <option :value="10">10条</option>
              <option :value="12">12条</option>
            </select>
          </div>

          <div v-if="chatMode === 'meme'" class="options-divider"></div>

          <div class="advanced-options">
            <label class="toggle-item">
              <input type="checkbox" v-model="enableAgentTools" :disabled="streaming" />
              <span class="toggle-label">
                <span class="toggle-icon">🛠️</span>
                <span>站内工具</span>
              </span>
            </label>

            <label class="toggle-item">
              <input type="checkbox" v-model="showThinking" :disabled="streaming" />
              <span class="toggle-label">
                <span class="toggle-icon">🧠</span>
                <span>思考过程</span>
              </span>
            </label>

            <label class="toggle-item" :title="'联网搜索Custom版：每人每天限用 ' + dailySearchLimit + ' 次'">
              <input type="checkbox" v-model="enableWebSearch" :disabled="streaming || dailySearchRemaining <= 0" />
              <span class="toggle-label">
                <span class="toggle-icon">🔍</span>
                <span>联网搜索 ({{ dailySearchRemaining }}/{{ dailySearchLimit }})</span>
              </span>
            </label>
          </div>

          <div class="usage-info">
            <span class="usage-badge">
              <span class="usage-dot"></span>
              今日剩余 {{ dailyRemaining }} 次
            </span>
          </div>
        </div>

        <div class="polish-actions">
          <template v-if="chatMode === 'meme'">
            <button type="button" @click="quickPrompt('基于上一轮，保留最强方向，整体更狠一点', 'meme')" :disabled="streaming">🔥 更狠</button>
            <button type="button" @click="quickPrompt('基于上一轮，改成更像6657直播间弹幕复读的版本', 'meme')" :disabled="streaming">💬 更弹幕</button>
            <button type="button" @click="quickPrompt('基于上一轮，换一个对象重新造，但保持同样风格', 'meme')" :disabled="streaming">🔄 换对象</button>
            <button type="button" @click="quickPrompt('从上一轮里挑1条最适合投稿的烂梗，直接调用投稿工具帮我提交到站内审核库', 'chat')" :disabled="streaming">📤 一键投稿入库</button>
          </template>
          <template v-else>
            <button
              v-for="tool in agentCatalog"
              :key="tool.name"
              type="button"
              @click="quickPrompt(tool.prompt, 'chat')"
              :disabled="streaming"
            >
              ⚡ {{ tool.title }}
            </button>
          </template>
        </div>

        <div class="input-row">
          <textarea
            ref="inputRef"
            v-model="prompt"
            :placeholder="inputPlaceholder"
            :disabled="streaming"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.shift.enter.prevent="prompt += '\n'"
            @input="autoResize"
          ></textarea>
          <button type="submit" :disabled="streaming || !prompt.trim() || dailyRemaining <= 0" class="send-btn">
            <span v-if="!streaming">发送</span>
            <span v-else class="loading-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import httpInstance from '@/apis/httpInstance';
import { getToken } from '@/utils/cookieUtils';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useThemeStore } from '@/stores/themeStore';
import aiAvatarUrl from '@/assets/imgs/user-img-0.png';
import userAvatarUrl from '@/assets/icons/ai_chat_user.svg';

const SITE_MODULE = 'machine';
const AI_SIGN_SALT = 'SB6657_DGQ63136_AI_AGENT_GUARD_2026';

marked.setOptions({ breaks: true, gfm: true });

interface ToolEventItem {
  type: string;
  toolName: string;
  toolTitle: string;
  summary: string;
  cardType?: string;
  cardData?: any;
}

interface MergedToolCard {
  toolName: string;
  toolTitle: string;
  summary: string;
  done: boolean;
  cardType?: string;
  cardData?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinkingContent?: string;
  toolEvents?: ToolEventItem[];
  createTime?: string;
}

interface SessionItem {
  id: number;
  title: string;
  sessionType: string;
  messageCount: number;
  updateTime: string;
}

interface ToolCatalogItem {
  name: string;
  title: string;
  prompt: string;
}

const theme = useThemeStore();
const themeClass = computed(() => (theme.isDark ? 'theme-dark' : 'theme-light'));

const chatMode = ref<'chat' | 'meme'>('meme');
const chatWindow = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const prompt = ref('');
const messages = ref<Message[]>([]);
const streaming = ref(false);
const streamContent = ref('');
const streamThinking = ref('');
const streamTools = ref<ToolEventItem[]>([]);
const showThinking = ref(true);
const enableWebSearch = ref(false);
const enableAgentTools = ref(true);
const memesNum = ref(8);
const currentSessionId = ref<number | null>(null);
const currentTitle = ref('');
const sessions = ref<SessionItem[]>([]);
const sidebarCollapsed = ref(false);
const dailyRemaining = ref(15);
const dailySearchRemaining = ref(10);
const dailySearchLimit = ref(10);
const aiAvatar = aiAvatarUrl;
const userAvatar = userAvatarUrl;

const welcomeCards = [
  {
    icon: '🎯',
    tag: '造梗工坊',
    mode: 'meme' as const,
    title: '查库造新梗',
    desc: '检索站内关于 donk / 玩机器 的经典烂梗，结合近况整一组可直接发弹幕的新梗',
    prompt: '搜一下站内关于donk的烂梗，再围绕最近CS2比赛造一组能直接投稿的新梗',
  },
  {
    icon: '🎲',
    tag: '盲盒抽梗',
    mode: 'chat' as const,
    title: '随机抽5条烂梗',
    desc: '从6657站内全量曲库随机盲抽5条烂梗卡片，附带AI毒舌锐评与弹幕改写',
    prompt: '随机抽5条6657站内烂梗给我乐呵一下，顺便毒舌锐评一下',
  },
  {
    icon: '🆕',
    tag: '最新入库',
    mode: 'chat' as const,
    title: '大家今天投了什么梗',
    desc: '实时调取站内最新审核入库的投稿烂梗卡片，看看老哥们最近都在整什么活',
    prompt: '看看今天大家都投稿了什么梗',
  },
  {
    icon: '⚔️',
    tag: '擂台赛况',
    mode: 'chat' as const,
    title: '烂梗对决擂台PK',
    desc: '红蓝双方烂梗实时票数对决卡片与本周胜率榜，看看哪条梗正在统治赛场',
    prompt: '查一下今天烂梗对决擂台PK的实时票数赛况和本周排行，哪条梗快赢了？',
  },
  {
    icon: '🪙',
    tag: '每日福利',
    mode: 'chat' as const,
    title: '一键签到 + 抽梗',
    desc: '自动执行今日签到领梗币、展示个人梗币钱包与段位卡片，再抽3条烂梗助兴',
    prompt: '帮我执行今日签到领梗币，再随机抽3条烂梗乐呵一下',
  },
  {
    icon: '🏆',
    tag: '赛事速报',
    mode: 'chat' as const,
    title: 'CS2 赛事与热搜词云',
    desc: '查看站内近期CS2比赛赛况与全站热搜词云，直接围绕焦点战役产出节奏弹幕',
    prompt: '查一下站内最近的CS2赛事列表和正在进行的比赛，再整几个赛况梗',
  },
];

const agentCatalog = ref<ToolCatalogItem[]>([
  { name: 'get_random_memes', title: '随机抽取烂梗', prompt: '随机抽5条6657站内烂梗给我乐呵一下，再锐评几句' },
  { name: 'get_recent_submitted_memes', title: '最新入库投稿', prompt: '看看今天大家都投稿了什么梗' },
  { name: 'get_arena_pk_status', title: '今日擂台PK', prompt: '查一下今天烂梗对决擂台PK的实时票数赛况和本周排行，哪条梗快赢了？' },
  { name: 'get_lifecycle_and_dna', title: '生命周期看板', prompt: '看看站内梗生命周期看板现在新芽、升温、巅峰、典藏各有多少条梗' },
  { name: 'get_tags_and_wordcloud', title: '热搜词云', prompt: '查一下现在全站热搜词云大家都在搜什么词，结合热搜给我造5条新梗' },
  { name: 'do_daily_checkin', title: '一键签到领币', prompt: '帮我执行今日签到领梗币，再随机抽3条烂梗乐呵一下' },
]);

const inputPlaceholder = computed(() => chatMode.value === 'meme'
  ? '输入造梗主题，例如：搜一下donk相关烂梗再围绕最近比赛造一组弹幕梗...'
  : '输入问题或指令，例如：看看今天大家都投稿了什么梗 / 帮我每日签到...');

onMounted(() => {
  loadSessions();
  loadDailyRemaining();
});

function getMergedToolEvents(events: ToolEventItem[]): MergedToolCard[] {
  const map = new Map<string, MergedToolCard>();
  const list: MergedToolCard[] = [];
  for (const ev of events) {
    const key = ev.toolName || ev.toolTitle;
    const existing = map.get(key);
    if (existing) {
      if (ev.type === 'tool_result') {
        existing.done = true;
        existing.summary = ev.summary || existing.summary;
        if (ev.cardType) existing.cardType = ev.cardType;
        if (ev.cardData) existing.cardData = ev.cardData;
      }
    } else {
      const card: MergedToolCard = {
        toolName: ev.toolName,
        toolTitle: ev.toolTitle,
        summary: ev.summary,
        done: ev.type === 'tool_result',
        cardType: ev.cardType,
        cardData: ev.cardData,
      };
      map.set(key, card);
      list.push(card);
    }
  }
  return list;
}

function extractCandidateMemes(content: string): string[] {
  if (!content) return [];
  const lines = content.split('\n');
  const results: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const m = line.match(/^(?:\d+[\.\、\)]|\-\s+|\*\s+)(.+)$/);
    if (m && m[1]) {
      const cleaned = m[1]
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^["'“”「」『』]+|["'“”「」『』]+$/g, '')
        .trim();
      if (
        cleaned.length >= 6 &&
        cleaned.length <= 95 &&
        !cleaned.startsWith('想更') &&
        !cleaned.startsWith('最佳投稿') &&
        !cleaned.startsWith('理由') &&
        !cleaned.startsWith('继续微调') &&
        !cleaned.includes('：http')
      ) {
        results.push(cleaned);
      }
    }
  }
  return results.slice(0, 12);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.info('复制成功');
  }
}

function formatShortDate(raw: any): string {
  if (!raw) return '';
  const s = String(raw);
  if (s.includes('T')) return s.replace('T', ' ').substring(0, 16);
  return s.substring(0, 16);
}

function renderMd(text: string): string {
  if (!text) return '';
  try {
    const rawHtml = marked.parse(text) as string;
    const wrapped = rawHtml
      .replace(/<table>/g, '<div class="md-table-wrap"><table>')
      .replace(/<\/table>/g, '</table></div>');
    return DOMPurify.sanitize(wrapped, { ADD_ATTR: ['target', 'rel'] });
  } catch {
    return text.replace(/\n/g, '<br>');
  }
}

function formatTime(t: string | undefined): string {
  if (!t) return '';
  if (t.includes('T')) return t.replace(/.*T/, '').substring(0, 5);
  return t;
}

async function scrollToBottom() {
  await nextTick();
  if (chatWindow.value) {
    if (streaming.value) {
      chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
    } else {
      chatWindow.value.scrollTo({ top: chatWindow.value.scrollHeight, behavior: 'smooth' });
    }
  }
}

function autoResize() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 150) + 'px';
  }
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(ascii: string): string {
  const utf8 = unescape(encodeURIComponent(ascii));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = utf8.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  let padded = utf8 + '\x80';
  while ((padded.length % 64) - 56) padded += '\x00';
  for (let i = 0; i < padded.length; i++) {
    const j = padded.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      void i2;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

async function computeSha256Hex(raw: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const data = new TextEncoder().encode(raw);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  return sha256Fallback(raw);
}

async function buildAntiProxyPayload(userPrompt: string, modeStr: string) {
  const timestamp = Date.now().toString();
  const nonce = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const promptHead = userPrompt.trim().substring(0, 32);
  const raw = `${timestamp}:${nonce}:${SITE_MODULE}:${modeStr}:${promptHead}:${AI_SIGN_SALT}`;
  const sign = await computeSha256Hex(raw);
  return {
    timestamp,
    nonce,
    sign,
  };
}

async function loadSessions() {
  const token = getToken();
  if (!token) return;
  try {
    const res: any = await httpInstance.get('/machine/ai/sessions');
    const list = res.data;
    sessions.value = Array.isArray(list) ? list : [];

    if (sessions.value.length > 0 && currentSessionId.value === null) {
      const latest = sessions.value[0];
      currentSessionId.value = latest.id;
      currentTitle.value = latest.title || '';
      await loadMessages(latest.id);
    }
  } catch {
    sessions.value = [];
  }
}

async function loadMessages(sessionId: number) {
  try {
    const res: any = await httpInstance.get(`/machine/ai/sessions/${sessionId}/messages`);
    const list = res.data;
    if (Array.isArray(list)) {
      messages.value = list.map((m: any) => ({
        role: (m.role || '').toLowerCase() === 'user' ? 'user' : 'assistant',
        content: m.content || '',
        thinkingContent: m.thinkingContent || undefined,
        createTime: m.createTime || '',
      }));
    } else {
      messages.value = [];
    }
    await scrollToBottom();
  } catch {
    messages.value = [];
  }
}

async function switchSession(sessionId: number) {
  if (currentSessionId.value === sessionId) return;
  currentSessionId.value = sessionId;
  const s = sessions.value.find(item => item.id === sessionId);
  currentTitle.value = s?.title || '';
  messages.value = [];
  streamContent.value = '';
  streamThinking.value = '';
  streamTools.value = [];
  await loadMessages(sessionId);
}

function startNewChat() {
  currentSessionId.value = null;
  currentTitle.value = '';
  messages.value = [];
  streamContent.value = '';
  streamThinking.value = '';
  streamTools.value = [];
}

async function confirmDeleteSession(sessionId: number) {
  try {
    await ElMessageBox.confirm('确定删除此会话？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await httpInstance.delete(`/machine/ai/sessions/${sessionId}`);
    ElMessage.success('已删除');
    if (currentSessionId.value === sessionId) {
      startNewChat();
      const remaining = sessions.value.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        await switchSession(remaining[0].id);
      }
    }
    await loadSessions();
  } catch {}
}

function quickPrompt(text: string, mode: 'chat' | 'meme' = 'chat') {
  chatMode.value = mode;
  prompt.value = text;
  nextTick(() => inputRef.value?.focus());
}

async function sendMessage() {
  if (!prompt.value.trim() || streaming.value) return;
  if (dailyRemaining.value <= 0) {
    ElMessage.warning('今日使用次数已用完，明天再来整活吧！');
    return;
  }

  const userPrompt = prompt.value.trim();
  const optimisticUserMessage: Message = {
    role: 'user',
    content: userPrompt,
    createTime: new Date().toLocaleTimeString(),
  };
  messages.value.push(optimisticUserMessage);
  prompt.value = '';
  streaming.value = true;
  streamContent.value = '';
  streamThinking.value = '';
  streamTools.value = [];
  await scrollToBottom();

  const token = getToken();
  if (!token) {
    ElMessage.warning('请先登录！');
    messages.value.pop();
    prompt.value = userPrompt;
    streaming.value = false;
    return;
  }

  try {
    const modeStr = chatMode.value === 'meme' ? 'MEME' : 'CHAT';
    const securityPayload = await buildAntiProxyPayload(userPrompt, modeStr);

    const resp = await fetch(`${httpInstance.defaults.baseURL}/machine/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'dpahjdoiaw': 'eAR48ZFJwfRTy6SyQPFj',
      },
      body: JSON.stringify({
        prompt: userPrompt,
        needReasoning: showThinking.value,
        sessionId: currentSessionId.value,
        enableWebSearch: enableWebSearch.value,
        enableAgentTools: enableAgentTools.value,
        memesNum: chatMode.value === 'meme' ? memesNum.value : undefined,
        skill: chatMode.value === 'meme' ? 'MEME_MAKER' : null,
        mode: modeStr,
        module: SITE_MODULE,
        ...securityPayload,
      }),
    });

    if (!resp.ok) {
      ElMessage.error(resp.status === 401 ? '请先登录' : '请求失败: ' + resp.status);
      streaming.value = false;
      return;
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalSessionId: number | null = null;
    let sseFailed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      const eventBlocks = buffer.split('\n\n');
      buffer = eventBlocks.pop() || '';

      for (const block of eventBlocks) {
        if (!block.trim()) continue;
        let eventName = '';
        let dataStr = '';

        for (const line of block.split('\n')) {
          if (line.startsWith('event:') || line.startsWith('event: ')) {
            eventName = line.replace(/^event:\s*/, '').trim();
          } else if (line.startsWith('data:') || line.startsWith('data: ')) {
            dataStr += line.replace(/^data:\s?/, '');
          }
        }

        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          handleSseEvent(eventName || data.type || 'content', data);
          if ((eventName || data.type) === 'error') sseFailed = true;
          if (data.sessionId) finalSessionId = data.sessionId;
          if (data.title) currentTitle.value = data.title;
        } catch {}
      }
    }

    if (streamContent.value) {
      messages.value.push({
        role: 'assistant',
        content: streamContent.value,
        thinkingContent: streamThinking.value || undefined,
        toolEvents: streamTools.value.length > 0 ? [...streamTools.value] : undefined,
        createTime: new Date().toLocaleTimeString(),
      });
    }

    if (finalSessionId) {
      currentSessionId.value = finalSessionId;
    }

    if (sseFailed && !streamContent.value) {
      messages.value = messages.value.filter(item => item !== optimisticUserMessage);
      prompt.value = userPrompt;
    }

    await loadSessions();
    await loadDailyRemaining();
  } catch (e: any) {
    ElMessage.error('请求异常: ' + (e.message || '未知错误'));
    messages.value = messages.value.filter(item => item !== optimisticUserMessage);
    prompt.value = userPrompt;
  } finally {
    streaming.value = false;
    streamContent.value = '';
    streamThinking.value = '';
    streamTools.value = [];
    await scrollToBottom();
  }
}

function handleSseEvent(eventType: string, data: any) {
  switch (eventType) {
    case 'tool':
    case 'tool_call':
    case 'tool_result':
      streamTools.value.push({
        type: data.type || eventType,
        toolName: data.toolName || '',
        toolTitle: data.toolTitle || data.toolName || '站内工具',
        summary: data.summary || '',
        cardType: data.cardType || undefined,
        cardData: data.cardData || undefined,
      });
      scrollToBottom();
      break;
    case 'thinking':
      streamThinking.value += data.content || '';
      scrollToBottom();
      break;
    case 'content':
    case 'message':
      if (data.content) {
        streamContent.value += data.content;
        scrollToBottom();
      }
      break;
    case 'error':
      ElMessage.warning(data.message || data.content || '服务异常');
      streaming.value = false;
      break;
    case 'done':
      break;
    default:
      if ((data.type === 'content' || data.type === 'message') && data.content) {
        streamContent.value += data.content;
        scrollToBottom();
      } else if (data.type === 'thinking' && data.content) {
        streamThinking.value += data.content;
        scrollToBottom();
      }
      break;
  }
}

async function loadDailyRemaining() {
  const token = getToken();
  if (!token) return;
  try {
    const res: any = await httpInstance.get('/machine/ai/daily-remaining');
    if (res?.data !== undefined) {
      if (typeof res.data === 'object' && res.data !== null) {
        dailyRemaining.value = res.data.remaining ?? 15;
        dailySearchRemaining.value = res.data.searchRemaining ?? 10;
        dailySearchLimit.value = res.data.searchLimit ?? 10;
        if (dailySearchRemaining.value <= 0) {
          enableWebSearch.value = false;
        }
      } else {
        dailyRemaining.value = res.data;
      }
    }
  } catch {}
}
</script>

<style scoped>
.theme-light {
  --bg-primary: #f4f6fa;
  --bg-secondary: #ffffff;
  --bg-sidebar: #eef1f6;
  --bg-input: #ffffff;
  --bg-msg-user: linear-gradient(135deg, #1677ff, #0958d9);
  --bg-msg-ai: #ffffff;
  --bg-card-inner: #f8fafd;
  --bg-thinking: #edf5ff;
  --bg-hover: #e6ebf2;
  --bg-active: #dce8ff;

  --text-primary: #1d2129;
  --text-secondary: #4e5969;
  --text-muted: #86909c;
  --text-msg-user: #ffffff;
  --text-msg-ai: #1d2129;
  --text-thinking: #1677ff;
  --text-accent: #1677ff;
  --text-accent-alt: #ff6b35;

  --border-color: #e5e8ef;
  --border-input: #d9dfe8;
  --border-focus: #1677ff;

  --badge-meme: #ff8800;
  --badge-chat: #1677ff;
  --accent: #1677ff;
  --accent-hover: #0958d9;
  --danger: #ff3b30;
  --card-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.theme-dark {
  --bg-primary: #0f1420;
  --bg-secondary: #161d2f;
  --bg-sidebar: #0b101b;
  --bg-input: #111827;
  --bg-msg-user: linear-gradient(135deg, #e94560, #c81e45);
  --bg-msg-ai: #172035;
  --bg-card-inner: #1d2842;
  --bg-thinking: #111c30;
  --bg-hover: #1f2b47;
  --bg-active: #233559;

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-msg-user: #ffffff;
  --text-msg-ai: #f1f5f9;
  --text-thinking: #38bdf8;
  --text-accent: #f43f5e;
  --text-accent-alt: #fbbf24;

  --border-color: #222f49;
  --border-input: #293856;
  --border-focus: #f43f5e;

  --badge-meme: #fbbf24;
  --badge-chat: #38bdf8;
  --accent: #e94560;
  --accent-hover: #d63851;
  --danger: #ff453a;
  --card-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.ai-chat-wrapper {
  display: flex;
  height: calc(100vh - 60px);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: background 0.3s, color 0.3s;
}

.session-sidebar {
  width: 250px;
  min-width: 250px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.25s;
}
.session-sidebar.collapsed {
  width: 44px;
  min-width: 44px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  border-bottom: 1px solid var(--border-color);
  font-weight: bold;
  font-size: 14px;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}
.toggle-btn:hover { color: var(--text-primary); }

.new-chat-btn {
  margin: 10px;
  padding: 9px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}
.new-chat-btn:hover { background: var(--accent-hover); }

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.session-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}
.session-item:hover { background: var(--bg-hover); }
.session-item.active {
  background: var(--bg-active);
  border-left: 3px solid var(--accent);
}

.session-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.type-badge { font-size: 12px; }
.type-badge.meme { color: var(--badge-meme); }
.type-badge.chat { color: var(--badge-chat); }

.empty-hint {
  text-align: center;
  color: var(--text-muted);
  padding: 30px 0;
  font-size: 13px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.model-badge {
  font-size: 11px;
  padding: 3px 10px;
  background: var(--bg-active);
  border-radius: 999px;
  color: var(--text-accent);
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-stat-pill {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.header-stat-pill:hover {
  border-color: var(--accent);
  color: var(--text-accent);
  transform: translateY(-1px);
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.welcome-msg {
  max-width: 920px;
  margin: 12px auto 28px;
}
.welcome-hero-card {
  text-align: center;
  padding: 28px 24px;
  border-radius: 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  margin-bottom: 18px;
}
.welcome-hero-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--bg-active);
  color: var(--text-accent);
  margin-bottom: 10px;
}
.welcome-hero-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
}
.welcome-hero-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13.5px;
}

.welcome-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.feature-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
}
.feature-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
}
.feature-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feature-card-icon {
  font-size: 24px;
}
.feature-card-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.feature-card-tag.meme {
  background: rgba(255, 136, 0, 0.14);
  color: var(--badge-meme);
}
.feature-card-tag.chat {
  background: var(--bg-active);
  color: var(--text-accent);
}
.feature-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.feature-card-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}
.feature-card-action {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-accent);
}

.msg-row {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  align-items: flex-start;
}
.msg-row.user { flex-direction: row-reverse; }

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: var(--card-shadow);
}

.msg-body {
  max-width: 78%;
  min-width: 60px;
}
.msg-row.user .msg-body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tool-cards-deck {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
.tool-visual-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: var(--card-shadow);
}
.tool-visual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.tool-visual-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-status-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.tool-status-pill.done {
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
}
.tool-status-pill.calling {
  background: rgba(245, 158, 11, 0.16);
  color: #f59e0b;
}
.tool-visual-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.tool-visual-name {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}
.tool-plain-summary {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.data-card-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 600;
}
.meme-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 8px;
}
.meme-mini-card {
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.meme-mini-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.meme-id-chip {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-accent);
  background: var(--bg-active);
  padding: 1px 6px;
  border-radius: 6px;
}
.meme-tag-chip {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 1px 6px;
  border-radius: 6px;
}
.meme-time-chip {
  font-size: 10.5px;
  color: var(--text-muted);
  margin-left: auto;
}
.meme-mini-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
  flex: 1;
}
.meme-mini-footer {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}
.mini-act-btn {
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.mini-act-btn:hover {
  border-color: var(--accent);
  color: var(--text-accent);
}
.mini-act-btn.accent {
  color: var(--text-accent);
}

.wallet-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}
.wallet-stat-box {
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
}
.wallet-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.wallet-stat-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.wallet-stat-val.ok { color: #10b981; }
.wallet-stat-val.warn { color: #f59e0b; }
.wallet-stat-val.gold { color: #f59e0b; }

.arena-vs-box {
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.arena-side {
  flex: 1;
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.arena-badge {
  font-size: 11px;
  font-weight: 700;
}
.arena-barrage {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
}
.arena-votes {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-accent);
}
.arena-vs-divider {
  display: flex;
  align-items: center;
  font-weight: 900;
  font-size: 14px;
  color: var(--text-accent-alt);
}

.stages-pill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.stage-pill-card {
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.stage-pill-name {
  font-size: 12px;
  color: var(--text-secondary);
}
.stage-pill-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-accent);
}

.tags-cloud-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.word-cloud-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.word-cloud-chip:hover {
  border-color: var(--accent);
  color: var(--text-accent);
}

.thinking-block {
  background: var(--bg-thinking);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-thinking);
}
.thinking-block summary {
  cursor: pointer;
  font-weight: 600;
}
.thinking-text {
  margin-top: 6px;
  white-space: pre-wrap;
  color: var(--text-secondary);
  max-height: 200px;
  overflow-y: auto;
}

.msg-content-card {
  background: var(--bg-msg-ai);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: var(--card-shadow);
}
.msg-row.user .msg-content-card {
  background: var(--bg-msg-user);
  border: none;
  color: var(--text-msg-user);
  border-bottom-right-radius: 4px;
}
.msg-row.assistant .msg-content-card {
  border-bottom-left-radius: 4px;
}

.msg-content {
  line-height: 1.65;
  font-size: 14px;
  word-break: break-word;
}

.markdown-body :deep(> *:first-child) {
  margin-top: 0 !important;
}

.markdown-body :deep(> *:last-child) {
  margin-bottom: 0 !important;
}

.markdown-body :deep(h1) {
  font-size: 18px;
  font-weight: 800;
  margin: 14px 0 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-primary);
  line-height: 1.35;
}

.markdown-body :deep(h2) {
  font-size: 16px;
  font-weight: 700;
  margin: 16px 0 10px;
  padding-left: 10px;
  border-left: 4px solid var(--accent);
  color: var(--text-primary);
  line-height: 1.35;
}

.markdown-body :deep(h3) {
  font-size: 14.5px;
  font-weight: 700;
  margin: 12px 0 6px;
  color: var(--text-primary);
  line-height: 1.4;
}

.markdown-body :deep(h4) {
  font-size: 13.5px;
  font-weight: 600;
  margin: 10px 0 4px;
  color: var(--text-secondary);
}

.markdown-body :deep(p) {
  margin: 8px 0;
  line-height: 1.7;
}

.markdown-body :deep(strong) {
  font-weight: 700;
  color: var(--text-primary);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.65;
}

.markdown-body :deep(li::marker) {
  color: var(--accent);
  font-weight: 700;
}

.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 10px 14px;
  border-left: 4px solid var(--accent);
  background: var(--bg-thinking);
  border-radius: 0 10px 10px 0;
  color: var(--text-secondary);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px dashed var(--border-color);
  margin: 14px 0;
}

.markdown-body :deep(.md-table-wrap) {
  width: 100%;
  overflow-x: auto;
  margin: 12px 0;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-card-inner);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.55;
}

.markdown-body :deep(thead) {
  background: var(--bg-active);
}

.markdown-body :deep(th) {
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--text-accent);
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  white-space: nowrap;
}

.markdown-body :deep(th:last-child) {
  border-right: none;
}

.markdown-body :deep(td) {
  padding: 9px 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  vertical-align: top;
}

.markdown-body :deep(td:last-child) {
  border-right: none;
}

.markdown-body :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.markdown-body :deep(tbody tr:nth-child(even)) {
  background: var(--bg-secondary);
}

.markdown-body :deep(tbody tr:hover) {
  background: var(--bg-hover);
}

.markdown-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  background: var(--bg-thinking);
  color: var(--text-accent);
  padding: 2px 6px;
  border-radius: 5px;
}

.markdown-body :deep(pre) {
  background: #1a1e29;
  color: #e6edf3;
  padding: 12px 14px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 10px 0;
}

.markdown-body :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 12.5px;
}

.markdown-body :deep(a) {
  color: var(--text-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ai-generated-meme-deck {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}
.deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-accent);
  margin-bottom: 10px;
}
.deck-count {
  font-size: 11px;
  color: var(--text-muted);
}
.deck-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.candidate-meme-card {
  background: var(--bg-card-inner);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s;
}
.candidate-meme-card:hover {
  border-color: var(--accent);
}
.candidate-index {
  font-size: 11px;
  font-weight: 800;
  color: var(--badge-meme);
}
.candidate-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
  flex: 1;
}
.candidate-actions {
  display: flex;
  gap: 6px;
}
.cand-btn {
  padding: 3px 9px;
  font-size: 11px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.cand-btn:hover {
  border-color: var(--accent);
  color: var(--text-accent);
}
.cand-btn.submit {
  color: var(--text-accent);
  font-weight: 600;
}

.msg-footer-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}
.msg-time {
  font-size: 11px;
  color: var(--text-muted);
}
.msg-copy-all {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
}
.msg-copy-all:hover {
  color: var(--text-accent);
}

.waiting-text {
  color: var(--text-muted);
  font-style: italic;
}

.cursor-blink {
  animation: blink 0.8s infinite;
  color: var(--accent);
  font-weight: bold;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.input-area {
  padding: 12px 20px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.options-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.option-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-toggle {
  display: inline-flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.mode-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.mode-btn.active {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}
.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.options-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
}

.meme-count-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meme-count-select {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}

.advanced-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-item {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.toggle-item input[type="checkbox"] {
  display: none;
}
.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}
.toggle-item input[type="checkbox"]:checked + .toggle-label {
  background: var(--bg-active);
  color: var(--text-accent);
  border-color: var(--accent);
  font-weight: 600;
}

.usage-info {
  margin-left: auto;
}

.usage-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.usage-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34c759;
}

.polish-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.polish-actions button {
  padding: 5px 11px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}
.polish-actions button:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent);
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.input-row textarea {
  flex: 1;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-input);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  max-height: 150px;
}
.input-row textarea:focus { border-color: var(--border-focus); }

.send-btn {
  padding: 10px 22px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.send-btn:hover:not(:disabled) { background: var(--accent-hover); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background: #fff;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.data-card-websearch {
  margin-top: 8px;
}

.websearch-quota-chip {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--accent-soft);
  color: var(--accent);
}

.websearch-items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
  margin-top: 6px;
}

.websearch-item-card {
  display: block;
  text-decoration: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.websearch-item-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.websearch-item-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.websearch-item-snippet {
  font-size: 11.5px;
  color: var(--text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .session-sidebar { display: none; }
  .welcome-cards-grid { grid-template-columns: 1fr; }
  .msg-body { max-width: 90%; }
  .arena-vs-box { flex-direction: column; }
}
</style>
