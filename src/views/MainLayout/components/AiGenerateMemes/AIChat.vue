<template>
  <div class="ai-chat-wrapper" :class="themeClass">
    <!-- ========== 左侧：会话列表 ========== -->
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

    <!-- ========== 右侧：聊天主区域 ========== -->
    <main class="chat-main">
      <!-- 顶部标题栏 -->
      <header class="chat-header">
        <h3>{{ currentTitle || 'AI造梗助手' }}</h3>
      </header>

      <!-- 消息列表 -->
      <div class="chat-window" ref="chatWindow">
        <div v-if="messages.length === 0 && !streaming" class="welcome-msg">
          <div class="welcome-icon">🎯</div>
          <h2>AI造梗搭子</h2>
          <div class="quick-actions">
            <button @click="quickPrompt('围绕最近CS2比赛造一组能投稿的烂梗，帮我挑最佳', 'meme')">🎯 投稿梗</button>
            <button @click="quickPrompt('最近A+级CS2赛事赛况如何，顺便提炼几个赛况梗', 'chat')">🏆 赛事速报</button>
            <button @click="quickPrompt('围绕CS2选手名场面整一组弹幕复读梗，要抽象一点', 'meme')">💬 弹幕梗</button>
            <button @click="quickPrompt('给我一组黑Niko但不低俗的地狱笑话风格烂梗', 'meme')">🔥 狠一点</button>
          </div>
        </div>

        <!-- 历史消息 -->
        <div v-for="(msg, idx) in messages" :key="'msg-' + idx" :class="['msg-row', msg.role]">
          <img class="avatar" :src="msg.role === 'user' ? userAvatar : aiAvatar" :alt="msg.role" />
          <div class="msg-body">
            <details v-if="msg.thinkingContent" class="thinking-block">
              <summary>🧠 思考过程</summary>
              <div class="thinking-text">{{ msg.thinkingContent }}</div>
            </details>
            <div class="msg-content markdown-body" v-html="renderMd(msg.content)"></div>
            <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
          </div>
        </div>

        <!-- 流式加载中 -->
        <div v-if="streaming" class="msg-row assistant">
          <img class="avatar" :src="aiAvatar" alt="AI" />
          <div class="msg-body">
            <details v-if="showThinking && streamThinking" class="thinking-block" open>
              <summary>🧠 思考中...</summary>
              <div class="thinking-text">{{ streamThinking }}</div>
            </details>
            <div class="msg-content markdown-body">
              <span v-if="!streamContent" class="waiting-text">思考中...</span>
              <div v-else v-html="renderMd(streamContent)"></div>
            </div>
            <span class="cursor-blink">|</span>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
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
                <span class="mode-text">闲聊</span>
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
              <input type="checkbox" v-model="showThinking" :disabled="streaming" />
              <span class="toggle-label">
                <span class="toggle-icon">🧠</span>
                <span>思考过程</span>
              </span>
            </label>

            <label class="toggle-item">
              <input type="checkbox" v-model="enableWebSearch" :disabled="streaming" />
              <span class="toggle-label">
                <span class="toggle-icon">🔍</span>
                <span>联网搜索</span>
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

        <div v-if="chatMode === 'meme'" class="polish-actions">
          <button type="button" @click="quickPrompt('基于上一轮，保留最强方向，整体更狠一点', 'meme')" :disabled="streaming">更狠</button>
          <button type="button" @click="quickPrompt('基于上一轮，改成更像弹幕复读的版本', 'meme')" :disabled="streaming">更弹幕</button>
          <button type="button" @click="quickPrompt('基于上一轮，换一个对象重新造，但保持同样风格', 'meme')" :disabled="streaming">换对象</button>
          <button type="button" @click="quickPrompt('从上一轮里挑3条最适合投稿的，再帮我润色标题', 'meme')" :disabled="streaming">挑投稿</button>
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

// ========== 配置 marked ==========
marked.setOptions({ breaks: true, gfm: true });

// ========== 类型 ==========
interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinkingContent?: string;
  createTime?: string;
}
interface SessionItem {
  id: number;
  title: string;
  sessionType: string;
  messageCount: number;
  updateTime: string;
}

const theme = useThemeStore();
const themeClass = computed(() => (theme.isDark ? 'theme-dark' : 'theme-light'));

onMounted(() => {
  loadSessions();
  loadDailyRemaining();
});

// ========== 状态 ==========
const chatMode = ref<'chat' | 'meme'>('meme');  // 默认造梗模式
const chatWindow = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const prompt = ref('');
const messages = ref<Message[]>([]);
const streaming = ref(false);
const streamContent = ref('');
const streamThinking = ref('');
const showThinking = ref(false);
const enableWebSearch = ref(true);  // 默认开启联网搜索
const memesNum = ref(8);
const currentSessionId = ref<number | null>(null);
const currentTitle = ref('');
const sessions = ref<SessionItem[]>([]);
const sidebarCollapsed = ref(false);
const dailyRemaining = ref(50);
const aiAvatar = aiAvatarUrl;
const userAvatar = userAvatarUrl;

const inputPlaceholder = computed(() => chatMode.value === 'meme'
  ? '输入造梗主题，例如：围绕donk名场面造一组弹幕梗，帮我挑最佳...'
  : '输入内容，例如：最近CS2赛事有什么活...');

// ========== 工具函数 ==========
function renderMd(text: string): string {
  if (!text) return '';
  try {
    return DOMPurify.sanitize(marked.parse(text) as string);
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
    chatWindow.value.scrollTo({ top: chatWindow.value.scrollHeight, behavior: 'smooth' });
  }
}

function autoResize() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 150) + 'px';
  }
}

// ========== 加载会话列表 + 自动进入最新 ==========
async function loadSessions() {
  const token = getToken();
  if (!token) return;
  try {
    const res: any = await httpInstance.get('/ai/sessions');
    const list = res.data;
    sessions.value = Array.isArray(list) ? list : [];

    if (sessions.value.length > 0 && currentSessionId.value === null) {
      const latest = sessions.value[0];
      currentSessionId.value = latest.id;
      currentTitle.value = latest.title || '';
      await loadMessages(latest.id);
    }
  } catch (e: any) {
    console.error('[会话] 加载失败:', e?.message);
    sessions.value = [];
  }
}

// ========== 加载会话消息 ==========
async function loadMessages(sessionId: number) {
  try {
    const res: any = await httpInstance.get(`/ai/sessions/${sessionId}/messages`);
    const list = res.data;
    if (Array.isArray(list)) {
      messages.value = list.map((m: any) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content || '',
        thinkingContent: m.thinkingContent || undefined,
        createTime: m.createTime || '',
      }));
    } else {
      messages.value = [];
    }
    await scrollToBottom();
  } catch (e: any) {
    console.error('[消息] 加载失败:', e?.message);
    messages.value = [];
  }
}

// ========== 切换会话 ==========
async function switchSession(sessionId: number) {
  if (currentSessionId.value === sessionId) return;
  currentSessionId.value = sessionId;
  const s = sessions.value.find(item => item.id === sessionId);
  currentTitle.value = s?.title || '';
  messages.value = [];
  streamContent.value = '';
  streamThinking.value = '';
  await loadMessages(sessionId);
}

// ========== 新建对话 ==========
function startNewChat() {
  currentSessionId.value = null;
  currentTitle.value = '';
  messages.value = [];
  streamContent.value = '';
  streamThinking.value = '';
}

// ========== 删除会话（软删除） ==========
async function confirmDeleteSession(sessionId: number) {
  try {
    await ElMessageBox.confirm('确定删除此会话？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await httpInstance.delete(`/ai/sessions/${sessionId}`);
    ElMessage.success('已删除');
    if (currentSessionId.value === sessionId) {
      startNewChat();
      const remaining = sessions.value.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        await switchSession(remaining[0].id);
      }
    }
    await loadSessions();
  } catch { /* 取消 */ }
}

// ========== 快捷输入 ==========
function quickPrompt(text: string, mode: 'chat' | 'meme' = 'chat') {
  chatMode.value = mode;
  prompt.value = text;
  nextTick(() => inputRef.value?.focus());
}

// ========== 发送消息（SSE） ==========
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
    const resp = await fetch(`${httpInstance.defaults.baseURL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({
        prompt: userPrompt,
        needReasoning: showThinking.value,
        sessionId: currentSessionId.value,
        enableWebSearch: enableWebSearch.value,
        memesNum: chatMode.value === 'meme' ? memesNum.value : undefined,
        skill: chatMode.value === 'meme' ? 'MEME_MAKER' : null,
        mode: chatMode.value === 'meme' ? 'MEME' : 'CHAT',
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
          handleSseEvent(eventName || 'content', data);
          if ((eventName || data.type) === 'error') sseFailed = true;
          if (data.sessionId) finalSessionId = data.sessionId;
          if (data.title) currentTitle.value = data.title;
        } catch { /* 非JSON忽略 */ }
      }
    }

    // 流结束，保存AI回复到消息列表
    if (streamContent.value) {
      messages.value.push({
        role: 'assistant',
        content: streamContent.value,
        thinkingContent: streamThinking.value || undefined,
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
    await scrollToBottom();
  }
}

function handleSseEvent(eventType: string, data: any) {
  console.log('[SSE] 收到事件:', eventType, data);

  switch (eventType) {
    case 'connected':
      console.log('[SSE] 连接已建立');
      break;
    case 'thinking':
      streamThinking.value += data.content || '';
      console.log('[SSE] thinking 更新，当前长度:', streamThinking.value.length);
      scrollToBottom();
      break;
    case 'content':
    case 'message':
      // 后端通过 event:message 发送流式内容，data.type 为 "message"
      if (data.content) {
        streamContent.value += data.content;
        console.log('[SSE] content 更新，当前长度:', streamContent.value.length);
        scrollToBottom();
      }
      break;
    case 'error':
      console.warn('[SSE] 错误:', data.content);
      ElMessage.warning(data.content || '服务异常');
      streaming.value = false;
      break;
    case 'done':
      console.log('[SSE] 流式完成');
      break;
    default:
      if ((data.type === 'content' || data.type === 'message') && data.content) {
        streamContent.value += data.content;
        console.log('[SSE] default content 更新，当前长度:', streamContent.value.length);
        scrollToBottom();
      } else if (data.type === 'thinking' && data.content) {
        streamThinking.value += data.content;
        console.log('[SSE] default thinking 更新，当前长度:', streamThinking.value.length);
        scrollToBottom();
      }
      break;
  }
}

// ========== 剩余次数 ==========
async function loadDailyRemaining() {
  const token = getToken();
  if (!token) return;
  try {
    const res: any = await httpInstance.get('/ai/daily-remaining');
    if (res.data !== undefined) dailyRemaining.value = res.data;
  } catch { /* 静默 */ }
}
</script>

<style scoped>
/* ============================================================
   双主题配色：theme-light / theme-dark，跟随系统自动切换
   ============================================================ */

/* ===== 浅色主题(默认) ===== */
.theme-light {
  --bg-primary: #f5f5f7;
  --bg-secondary: #ffffff;
  --bg-sidebar: #f0f0f2;
  --bg-input: #ffffff;
  --bg-msg-user: #1677ff;
  --bg-msg-ai: #f0f0f2;
  --bg-thinking: #e8f4fd;
  --bg-hover: #e8e8ec;
  --bg-active: #d4e4ff;
  --bg-welcome: transparent;

  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-muted: #aeaeb2;
  --text-msg-user: #ffffff;
  --text-msg-ai: #1d1d1f;
  --text-thinking: #5b8abf;
  --text-accent: #1677ff;
  --text-accent-alt: #ff6b35;

  --border-color: #d2d2d7;
  --border-input: #d2d2d7;
  --border-focus: #1677ff;

  --badge-meme: #ff9500;
  --badge-chat: #1677ff;
  --accent: #1677ff;
  --accent-hover: #0958d9;
  --danger: #ff3b30;
}

/* ===== 深色主题 ===== */
.theme-dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-sidebar: #0f172a;
  --bg-input: #0d1b2a;
  --bg-msg-user: #e94560;
  --bg-msg-ai: #1e3a5f;
  --bg-thinking: #0d1b2a;
  --bg-hover: #1a3a5c;
  --bg-active: #0f3460;
  --bg-welcome: transparent;

  --text-primary: #e0e0e0;
  --text-secondary: #888;
  --text-muted: #555;
  --text-msg-user: #fff;
  --text-msg-ai: #e0e0e0;
  --text-thinking: #4fc3f7;
  --text-accent: #e94560;
  --text-accent-alt: #f0c040;

  --border-color: #0f3460;
  --border-input: #0f3460;
  --border-focus: #e94560;

  --badge-meme: #f0c040;
  --badge-chat: #4fc3f7;
  --accent: #e94560;
  --accent-hover: #d63851;
  --danger: #ff453a;
}

/* ============================================================ */

.ai-chat-wrapper {
  display: flex;
  height: calc(100vh - 60px);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  transition: background 0.3s, color 0.3s;
}

/* ========== 左侧栏 ========== */
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
  width: 48px;
  min-width: 48px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-accent);
}
.toggle-btn {
  background: none;
  border: none;
  color: var(--text-accent);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}
.toggle-btn:hover {
  background: var(--bg-hover);
}

.new-chat-btn {
  margin: 0 12px 8px;
  padding: 8px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
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
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.session-item:hover { background: var(--bg-hover); }
.session-item.active { background: var(--bg-active); }

.session-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}
.session-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-muted);
}
.type-badge.meme { color: var(--badge-meme); }
.type-badge.chat { color: var(--badge-chat); }
.empty-hint {
  text-align: center;
  color: var(--text-muted);
  margin-top: 40px;
  font-size: 13px;
}

/* ========== 主区域 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.chat-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}
.model-badge {
  padding: 2px 10px;
  background: var(--bg-hover);
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-secondary);
}

/* ========== 消息窗口 ========== */
.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  scroll-behavior: smooth;
}
.welcome-msg {
  text-align: center;
  margin-top: 12vh;
}
.welcome-icon { font-size: 52px; }
.welcome-msg h2 {
  color: var(--text-accent);
  margin: 16px 0 6px;
  font-size: 22px;
}
.welcome-msg p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 28px;
}
.quick-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.quick-actions button {
  padding: 10px 18px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.quick-actions button:hover {
  background: var(--bg-active);
  border-color: var(--accent);
}

/* ========== 消息气泡 ========== */
.msg-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  max-width: 80%;
}
.msg-row.user {
  margin-left: auto;
  flex-direction: row-reverse;
}
.msg-row.assistant { margin-right: auto; }
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
}
.msg-body { flex: 1; min-width: 0; }
.msg-content {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
}
.msg-row.user .msg-content {
  background: var(--bg-msg-user);
  color: var(--text-msg-user);
  border-bottom-right-radius: 4px;
}
.msg-row.assistant .msg-content {
  background: var(--bg-msg-ai);
  color: var(--text-msg-ai);
  border-bottom-left-radius: 4px;
}
.msg-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
  padding: 0 4px;
}

/* ========== 思考过程 ========== */
.thinking-block {
  margin-bottom: 6px;
  background: var(--bg-thinking);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-thinking);
}
.thinking-block summary {
  cursor: pointer;
  font-weight: 500;
}
.thinking-text {
  margin-top: 4px;
  white-space: pre-wrap;
  max-height: 180px;
  overflow-y: auto;
}

/* ========== 流式 ========== */
.waiting-text { color: var(--text-muted); font-style: italic; }
.cursor-blink {
  animation: blink 1s infinite;
  color: var(--accent);
  font-weight: bold;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ========== 输入区 ========== */
.input-area {
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

/* 功能选项栏 */
.options-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

/* 模式选择组 */
.mode-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-weight: 500;
}

.mode-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mode-btn.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  font-size: 14px;
}

.mode-text {
  white-space: nowrap;
}

/* 分隔线 */
.options-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
}

.meme-count-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meme-count-select {
  height: 30px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.meme-count-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.polish-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -4px 0 12px;
}

.polish-actions button {
  padding: 6px 10px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.polish-actions button:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg-active);
}

.polish-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 高级选项 */
.advanced-options {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 180px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.toggle-item:hover {
  background: var(--bg-hover);
}

.toggle-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-icon {
  font-size: 13px;
}

/* 使用信息 */
.usage-info {
  margin-left: auto;
}

.usage-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.usage-dot {
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 输入框行 */
.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.input-row textarea {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
  min-height: 48px;
  max-height: 150px;
  font-family: inherit;
  line-height: 1.5;
  transition: all 0.2s ease;
}

.input-row textarea:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
}

.input-row textarea::placeholder {
  color: var(--text-muted);
}

.send-btn {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 加载动画 */
.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.loading-dots span {
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  animation: loadingBounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes loadingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
