<template>
  <el-dialog
    v-model="visible"
    :show-close="true"
    width="min(980px, 95vw)"
    append-to-body
    align-center
    class="sponsor-custom-dialog"
  >
    <div class="sponsor-wrapper">
      <!-- 顶栏标题 -->
      <div class="modal-header">
        <div class="header-main">
          <h2 class="title">赞赏支持</h2>
          <span class="badge-sub">水友赞赏墙</span>
        </div>
        <p class="description">
          感谢各位水友对服务器、CDN 、带宽、AI造梗与域名续费的支持，点滴支持都是网站持续运行的动力！
        </p>
      </div>

      <!-- 双栏布局 -->
      <div class="modal-layout">
        <!-- 左侧：扫码赞赏区 -->
        <div class="qr-pane">
          <!-- 渠道切换分段控制器 -->
          <div class="channel-switch">
            <button
              type="button"
              class="switch-tab"
              :class="{ active: currentChannel === 'wx' }"
              @click="currentChannel = 'wx'"
            >
              <span class="indicator-dot wx"></span>
              微信赞赏码
            </button>
            <button
              type="button"
              class="switch-tab"
              :class="{ active: currentChannel === 'alipay' }"
              @click="currentChannel = 'alipay'"
            >
              <span class="indicator-dot alipay"></span>
              支付宝赞赏码
            </button>
          </div>

          <!-- 二维码卡片 -->
          <div class="qr-box">
            <div class="qr-media">
              <el-image
                :src="currentQrUrl"
                alt="赞赏码"
                fit="contain"
                class="qr-img"
                :preview-src-list="[currentQrUrl]"
                preview-teleported
              />
            </div>
            <div class="qr-info">
              <div class="privacy-note">
                <span v-if="currentChannel === 'wx'">微信专属赞赏码 · 不暴露个人隐私</span>
                <span v-else>支付宝赞赏码 · 不暴露个人隐私</span>
              </div>
              <p class="remark-guide">
                扫码请在备注栏附带<strong>【 留言】</strong>
              </p>
              <p class="sync-tip">站长核对后将手动同步至右侧动态墙</p>
            </div>
          </div>
        </div>

        <!-- 右侧：流水动态墙 (支持触底加载) -->
        <div class="board-pane">
          <!-- 动态墙顶栏（已去掉累计金额/笔数） -->
          <div class="stream-header-bar">
            <div class="stream-title">
              <span class="live-pulse"></span>
              <span class="stream-title-text">最新赞赏动态</span>
            </div>
          </div>

          <!-- 滚动列表区 (带触底监听) -->
          <div
            ref="scrollContainerRef"
            class="list-container"
            v-loading="loading"
            @scroll="handleScroll"
          >
            <div v-if="sponsorList.length > 0" class="list-rows">
              <div
                v-for="(item, index) in sponsorList"
                :key="item.sponsorId || index"
                class="donor-row"
                :class="{ 'is-latest-one': index === 0 }"
              >
                <!-- 左侧主体：昵称、渠道、留言 -->
                <div class="donor-content-side">
                  <div class="donor-identity">
                    <span class="donor-index">{{ index + 1 }}</span>
                    <span class="donor-name">{{ maskName(item.maskedName) }}</span>
                    <span
                      class="channel-tag"
                      :class="item.payType === '支付宝' ? 'tag-alipay' : 'tag-wx'"
                    >
                      {{ item.payType || '微信' }}
                    </span>
                  </div>

                  <!-- 留言展示区 (突出展示) -->
                  <div class="donor-message-box" :class="{ 'no-message': !item.message }">
                    <template v-if="item.message">
                      <span class="quote-sign">“</span>
                      <span class="quote-text">{{ item.message }}</span>
                      <span class="quote-sign">”</span>
                    </template>
                    <template v-else>
                      <span class="quote-empty">水友默默支持，未留留言～</span>
                    </template>
                  </div>
                </div>

                <!-- 右侧：金额放时间上方居中跟右边有点距离 -->
                <div class="donor-stat-side">
                  <div class="amount-badge">
                    <span class="yen">¥</span>
                    <span class="amount-num">{{ Number(item.amount).toFixed(2) }}</span>
                  </div>
                  <span class="time-stamp">
                    <svg viewBox="0 0 24 24" width="12" height="12" class="time-icon">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    {{ item.sponsorTime }}
                  </span>
                </div>
              </div>

              <!-- 触底加载状态指示栏 -->
              <div class="scroll-footer-indicator">
                <div v-if="loadingMore" class="loading-more-box">
                  <span class="spinner-dot"></span>
                  <span>正在加载更多赞赏动态...</span>
                </div>
                <div v-else-if="!hasMore" class="no-more-box">
                  <span>—— 已展示全部赞赏动态 ——</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!loading" class="empty-placeholder">
              <span class="empty-desc">暂无赞赏记录，期待第一位水友留名～</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { sponsorAPI, type SponsorPublicItem } from '@/apis/sponsor'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)
const pageSize = 50
const sponsorList = ref<SponsorPublicItem[]>([])

const currentChannel = ref<'wx' | 'alipay'>('wx')

// 微信赞赏码与支付宝赞赏码真实地址
const QR_MAP = {
  wx: 'https://cdn.hguofichp.cn/zfb.jpg',
  alipay: 'https://cdn.hguofichp.cn/%E6%94%AF%E4%BB%98%E5%AE%9D%E7%BB%8F%E8%90%A5%E7%A0%81.png'
}

const currentQrUrl = computed(() => QR_MAP[currentChannel.value])

/**
 * 名字脱敏函数（>3个字脱1个，>6个字脱2个，>8个字脱3个，>10个字脱4个，热心水友不脱敏）
 */
function maskName(raw: string | undefined): string {
  if (!raw || !raw.trim()) {
    return '热心水友'
  }
  const name = raw.trim()
  if (name === '热心水友') {
    return '热心水友'
  }
  if (name.includes('*')) {
    return name
  }
  const len = name.length
  let maskCount = 0
  if (len > 10) {
    maskCount = 4
  } else if (len > 8) {
    maskCount = 3
  } else if (len > 6) {
    maskCount = 2
  } else if (len > 3) {
    maskCount = 1
  } else {
    maskCount = 0
  }

  if (maskCount <= 0) {
    return name
  }

  maskCount = Math.min(maskCount, len - 2)
  const prefixLen = Math.floor((len - maskCount) / 2)
  const suffixLen = len - maskCount - prefixLen
  return name.slice(0, prefixLen) + '*'.repeat(maskCount) + name.slice(len - suffixLen)
}

/**
 * 首次拉取前 50 条
 */
function fetchFirstPage() {
  pageNum.value = 1
  hasMore.value = true
  loading.value = true
  sponsorAPI.getList(1, pageSize).then(res => {
    loading.value = false
    const rows = (res as any)?.rows || (res as any)?.data?.rows || []
    const total = (res as any)?.total ?? (res as any)?.data?.total ?? 0
    sponsorList.value = rows
    hasMore.value = rows.length < total
    // 滚动条复位到顶部
    nextTick(() => {
      if (scrollContainerRef.value) {
        scrollContainerRef.value.scrollTop = 0
      }
    })
  }).catch(() => {
    loading.value = false
  })
}

/**
 * 触底加载下一页 (每次 50 条)
 */
function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  const nextPage = pageNum.value + 1

  sponsorAPI.getList(nextPage, pageSize).then(res => {
    loadingMore.value = false
    const rows = (res as any)?.rows || (res as any)?.data?.rows || []
    const total = (res as any)?.total ?? (res as any)?.data?.total ?? 0
    if (rows && rows.length > 0) {
      sponsorList.value = [...sponsorList.value, ...rows]
      pageNum.value = nextPage
      hasMore.value = sponsorList.value.length < total
    } else {
      hasMore.value = false
    }
  }).catch(() => {
    loadingMore.value = false
  })
}

/**
 * 滚动触底事件监听
 */
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  if (!target || loading.value || loadingMore.value || !hasMore.value) return
  // 离容器底部距离小于 50px 时自动触发下一页加载
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (distanceToBottom <= 50) {
    loadMore()
  }
}

watch(visible, (val) => {
  if (val) {
    fetchFirstPage()
  }
})
</script>

<style scoped lang="scss">
:deep(.el-dialog.sponsor-custom-dialog) {
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--header-border, #e5e7eb);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
  padding: 0;

  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0;
  }
}

.sponsor-wrapper {
  padding: 10px;
  color: var(--body-color, #1f2937);
  box-sizing: border-box;
}

/* 顶部标题区 */
.modal-header {
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--header-border, #e5e7eb);

  .header-main {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;

    .title {
      font-size: 20px;
      font-weight: 700;
      color: var(--body-color, #111827);
      margin: 0;
      line-height: 1.2;
    }

    .badge-sub {
      font-size: 12px;
      font-weight: 600;
      color: #ff552e;
      background: rgba(255, 85, 46, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
  }

  .description {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;

    html.dark & {
      color: #94a3b8;
    }
  }
}

/* 主栅格布局 */
.modal-layout {
  display: grid;
  grid-template-columns: 440px 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* 左侧：扫码赞赏 */
.qr-pane {
  display: flex;
  flex-direction: column;

  .channel-switch {
    display: flex;
    background: rgba(125, 125, 125, 0.08);
    border-radius: 6px;
    padding: 3px;
    margin-bottom: 12px;
    border: 1px solid var(--header-border, #e5e7eb);

    .switch-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 0;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;

      .indicator-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;

        &.wx {
          background-color: #10b981;
        }
        &.alipay {
          background-color: #0284c7;
        }
      }

      &.active {
        background: var(--card-bg, #ffffff);
        color: var(--body-color, #0f172a);
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

        html.dark & {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }
      }
    }
  }

  .qr-box {
    background: rgba(125, 125, 125, 0.04);
    border: 1px solid var(--header-border, #e5e7eb);
    border-radius: 8px;
    padding: 14px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;

    .qr-media {
      width: 100%;
      aspect-ratio: 1;
      background: #ffffff;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.06);

      .qr-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .qr-info {
      width: 100%;
      margin-top: 12px;
      text-align: center;

      .privacy-note {
        font-size: 12px;
        font-weight: 600;
        color: #10b981;
        margin-bottom: 6px;

        html.dark & {
          color: #34d399;
        }
      }

      .remark-guide {
        font-size: 12px;
        color: var(--body-color, #334155);
        margin: 0 0 4px;
        line-height: 1.4;

        strong {
          color: #ff552e;
        }
      }

      .sync-tip {
        font-size: 11px;
        color: #94a3b8;
        margin: 0;
      }
    }
  }
}

/* 右侧：流水动态墙 */
.board-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .stream-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin-bottom: 10px;
    background: rgba(125, 125, 125, 0.05);
    border: 1px solid var(--header-border, #e5e7eb);
    border-radius: 6px;

    .stream-title {
      display: flex;
      align-items: center;
      gap: 6px;

      .live-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ff552e;
        box-shadow: 0 0 8px rgba(255, 85, 46, 0.6);
      }

      .stream-title-text {
        font-size: 13px;
        font-weight: 700;
        color: var(--body-color, #1e293b);
      }
    }

  }

  .list-container {
    flex: 1;
    min-height: 330px;
    max-height: 515px;
    overflow-y: auto;
    border: 1px solid var(--header-border, #e5e7eb);
    border-radius: 8px;
    padding: 6px;
    background: rgba(125, 125, 125, 0.02);

    /* 滚动条细化 */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(125, 125, 125, 0.2);
      border-radius: 2px;
    }

    .list-rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .donor-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 9px 12px;
      border-radius: 6px;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--header-border, #e5e7eb);
      transition: all 0.12s ease;

      &:hover {
        background: rgba(125, 125, 125, 0.05);
        border-color: #ff552e;
      }

      &.is-latest-one {
        border-color: rgba(255, 85, 46, 0.4);
        background: rgba(255, 85, 46, 0.03);
      }

      .donor-content-side {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;

        .donor-identity {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          font-size: 16px;
          .donor-index {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            font-size: 16px;
            background: rgba(125, 125, 125, 0.12);
            font-weight: 600;
            color: #64748b;
            flex-shrink: 0;

            html.dark & {
              color: #94a3b8;
            }
          }

          .donor-name {
            font-size: 20px;
            font-weight: 700;
            color: var(--body-color, #1e293b);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .channel-tag {
            font-size: 13px;
            padding: 1px 5px;
            border-radius: 3px;
            flex-shrink: 0;
            line-height: 1.3;

            &.tag-wx {
              background: rgba(16, 185, 129, 0.12);
              color: #10b981;
            }
            &.tag-alipay {
              background: rgba(2, 132, 199, 0.12);
              color: #0284c7;
            }
          }
        }

        /* 留言展示区 (突出展示) */
        .donor-message-box {
          background: rgba(125, 125, 125, 0.05);
          border-radius: 4px;
          padding: 5px 8px;
          font-size: 12px;
          line-height: 1.4;
          color: var(--body-color, #334155);
          display: flex;
          align-items: flex-start;
          gap: 3px;
          word-break: break-all;

          &.no-message {
            background: transparent;
            padding: 1px 0;
          }

          .quote-sign {
            color: #ff552e;
            font-weight: 700;
            font-size: 13px;
            line-height: 1;
          }

          .quote-text {
            flex: 1;
            color: var(--body-color, #334155);
            font-style: italic;

            html.dark & {
              color: #cbd5e1;
            }
          }

          .quote-empty {
            font-size: 11px;
            color: #94a3b8;
            font-style: italic;
          }
        }
      }

      /* 右侧：金额在时间上方居中，跟右边有点距离 */
      .donor-stat-side {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-right: 18px; /* 跟右边有点距离 */

        .amount-badge {
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: baseline;
          gap: 2px;
          font-size: 19px;
          .yen {
            font-weight: 600;
            color: #ff552e;
          }

          .amount-num {
            font-weight: 700;
            color: #ff552e;
          }
        }

        .time-stamp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #94a3b8;
          font-variant-numeric: tabular-nums;

          .time-icon {
            opacity: 0.7;
          }
        }
      }
    }

    /* 触底加载状态指示栏 */
    .scroll-footer-indicator {
      padding: 10px 0 6px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;

      .loading-more-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        .spinner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid #ff552e;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
        }
      }

      .no-more-box {
        font-size: 11px;
        letter-spacing: 0.5px;
        opacity: 0.75;
      }
    }

    .empty-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 280px;
      color: #94a3b8;
      font-size: 13px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
