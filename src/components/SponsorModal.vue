<script setup lang="ts">
import { computed, ref } from 'vue';
import SponsorRecords from '@/components/sponsor/SponsorRecords.vue';

const visible = defineModel<boolean>({ required: true });
const channels = [
    { id: 'wechat', label: '微信', qr: 'https://cdn.hguofichp.cn/zfb.jpg' },
    { id: 'alipay', label: '支付宝', qr: 'https://cdn.hguofichp.cn/%E6%94%AF%E4%BB%98%E5%AE%9D%E7%BB%8F%E8%90%A5%E7%A0%81.png' },
] as const;
const selected = ref<(typeof channels)[number]>(channels[0]);
const preview = computed(() => [selected.value.qr]);
</script>

<template>
    <el-dialog v-model="visible" class="sponsor-dialog" title="赞赏支持" width="min(920px, calc(100% - 24px))" align-center append-to-body destroy-on-close>
        <template #header="{ titleId }">
            <h2 :id="titleId">赞赏支持</h2>
            <p class="sponsor-description">感谢各位水友对服务器、CDN、带宽、AI造梗与域名续费的支持，点滴支持都是网站持续运行的动力！</p>
        </template>
        <div class="sponsor-layout">
            <div class="sponsor-payment">
                <div class="channel-switch" role="group" aria-label="赞赏方式">
                    <button v-for="channel in channels" :key="channel.id" type="button" :aria-pressed="selected.id === channel.id" @click="selected = channel">
                        <span class="channel-icon" :class="channel.id" aria-hidden="true"></span>
                        {{ channel.label }}
                    </button>
                </div>
                <el-image class="sponsor-qr" :src="selected.qr" :alt="selected.label + '赞赏码'" fit="contain" :preview-src-list="preview" preview-teleported hide-on-click-modal />
                <p class="sponsor-note">付款时可在备注里写<strong>【留言】</strong>，站长核对后会展示在<span class="desktop-location">右侧</span><span class="mobile-location">下方</span>。</p>
            </div>
            <SponsorRecords />
        </div>
    </el-dialog>
</template>

<style lang="scss">
.el-dialog.sponsor-dialog {
    --sponsor-muted: var(--el-text-color-secondary);
    --sponsor-surface: var(--el-fill-color-light);
    --sponsor-accent: #d64720;
    padding: 22px 28px 26px;
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    border-radius: 12px;
    background: var(--card-bg);
    color: var(--body-color);

    .el-dialog__header {
        padding: 0 20px 20px 0;
    }
    h2 {
        font-size: 20px;
        line-height: 1.4;
    }
    .el-dialog__headerbtn {
        top: 8px;
        right: 8px;
        color: inherit;
    }
    .el-dialog__close {
        color: inherit;
    }
    .sponsor-description,
    .sponsor-note {
        font-size: 13px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
    }
    .sponsor-description {
        margin-top: 4px;
    }
    .sponsor-layout {
        display: grid;
        grid-template-columns: minmax(0, 340fr) minmax(0, 488fr);
        gap: 36px;
        color: var(--body-color);
    }
    .channel-switch {
        display: flex;
        padding: 3px;
        border-radius: 8px;
        background: var(--el-fill-color);
    }
    .channel-switch button {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--el-text-color-regular);
        font: inherit;
        cursor: pointer;
    }
    .channel-switch button[aria-pressed='true'] {
        background: var(--card-bg);
        color: var(--body-color);
        font-weight: 600;
        box-shadow: 0 1px 3px rgb(0 0 0 / 9%);
    }
    .channel-icon {
        display: inline-block;
        flex: none;
        width: 1em;
        height: 1em;
        background: currentColor;
        mask-position: center;
        mask-size: contain;
        mask-repeat: no-repeat;
    }
    .wechat {
        mask-image: url('@/assets/icons/sponsor/wechat.svg');
    }
    .alipay {
        mask-image: url('@/assets/icons/sponsor/alipay.svg');
    }
    button .channel-icon {
        font-size: 16px;
    }
    button .wechat {
        color: #07c160;
    }
    button .alipay {
        color: #1677ff;
    }
    .sponsor-qr {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        margin: 14px 0 12px;
        border-radius: 2px;
        background: white;
    }
    .sponsor-note {
        text-align: center;
        font-size: 12px;
    }
    .sponsor-note strong {
        color: #ff552e;
    }
    .mobile-location {
        display: none;
    }
    @media (max-width: 768px) {
        padding: 18px;
        .sponsor-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
        }
        .sponsor-payment {
            width: min(100%, 340px);
            justify-self: center;
        }
        .desktop-location {
            display: none;
        }
        .mobile-location {
            display: inline;
        }
    }
}
</style>
