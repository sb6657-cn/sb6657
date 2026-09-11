<template>
    <header class="header">
        <div class="header-primary">
            <a href="https://www.douyu.com/6657" target="_blank">
                <img src="/favicon.ico" alt="大🐖头" class="logo-img" />
            </a>

            <HeaderSearch class="search-entry" />

            <HeaderSubmissionEntry v-slot="{ open }">
                <button class="submit-entry" type="button" @click="open">投稿</button>
            </HeaderSubmissionEntry>
        </div>

        <div class="header-actions">
            <el-button class="complaint-button" type="primary" @click="complaintButton">
                上传照片
                <br />
                建议/提交BUG
            </el-button>

            <HeaderBusinessEntry>
                <img src="@/assets/imgs/mail.png" alt="heihei" class="icon-container icon-img" />
            </HeaderBusinessEntry>

            <a class="icon-container" href="https://yuba.douyu.com/feed/2639094748291342931" target="_blank">
                <img src="@/assets/imgs/douyu.png" alt="douyu" class="icon-img" />
            </a>
            <a class="icon-container" href="https://github.com/sb6657-cn/sb6657/" target="_blank">
                <img src="@/assets/imgs/github.png" alt="github" class="icon-img github-icon" />
            </a>

            <HeaderSupportEntry v-slot="{ open }" dialog-width="100%">
                <el-image class="icon-container icon-img" :src="lightningUrl" fit="cover" @click="open" />
            </HeaderSupportEntry>

            <HeaderMessageEntry v-slot="{ total }">
                <div class="user-message">
                    <div class="message-icon">
                        <img src="@/assets/icons/msg.svg" alt="msg" />
                        消息
                    </div>
                    <span class="unread-badge">{{ total || '0' }}</span>
                </div>
            </HeaderMessageEntry>

            <ThemeSwitcher />

            <div class="user-entry">
                <UserHome />
            </div>
        </div>

        <HotMemeDialogs v-if="showHotMeme" v-slot="{ current, rotation, open }">
            <img src="@/assets/imgs/hot.png" alt="热门" class="hot-barrage-img" @click="open" />
            <div class="hot-barrage" @click="open">
                <transition name="fade">
                    <span :key="rotation" class="hot-barrage-span">热门：{{ current }}</span>
                </transition>
            </div>
        </HotMemeDialogs>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import HeaderBusinessEntry from './header-business-entry.vue';
import HeaderMessageEntry from './header-message-entry.vue';
import HeaderSearch from './header-search.vue';
import HeaderSubmissionEntry from './header-submission-entry.vue';
import HeaderSupportEntry from './header-support-entry.vue';
import HotMemeDialogs from './hot-meme-dialogs.vue';
import UserHome from './userHome.vue';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

const lightningUrl = 'https://cdn.hguofichp.cn/power.png';
const route = useRoute();
const showHotMeme = computed(() => route.path === '/home');

function complaintButton() {
    window.open('https://www.wjx.cn/vm/rQUgnS0.aspx#');
}
</script>

<style scoped lang="scss">
.header {
    width: 100%;
    position: relative;
    // 需高于移动端顶部 Tab 的 z-index 100，否则搜索记录下拉面板会被 Tab 遮挡
    z-index: 101;
    padding-top: 6px;
    background-color: #fff;
    backdrop-filter: saturate(100%) blur(4px);

    html.dark & {
        background-color: var(--header-bg);
    }
}

.header-primary {
    width: calc(100% - 20px);
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 10px;

    > a {
        display: flex;
    }
}

.logo-img {
    height: 40px;
    margin-right: 6px;
    border-radius: 5px;
}

.search-entry {
    min-width: 0;
    flex: 1;
    margin-right: 0;
}

.submit-entry {
    width: 56px;
    min-width: 56px;
    height: 32px;
    flex-shrink: 0;
    border: 0;
    border-radius: 8px;
    background: #fb7299;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 1px;
    box-shadow: 0 2px 8px rgba(251, 114, 153, 0.22);
    cursor: pointer;
    transition:
        transform 0.2s,
        background 0.2s,
        box-shadow 0.2s;

    &:hover {
        background: #ff85ad;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(251, 114, 153, 0.28);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 1px 5px rgba(251, 114, 153, 0.2);
    }
}

.header-actions {
    margin-top: 10px;
    padding: 0 8px;
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
}

.hot-barrage-img {
    width: 24px;
    height: 24px;
    position: absolute;
    top: 260px;
    left: 4px;
    cursor: pointer;
}

.hot-barrage {
    width: 360px;
    overflow: hidden;
    position: absolute;
    top: 260px;
    left: 30px;
    z-index: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
}

.hot-barrage-span {
    color: #e4d6b8;
    border-bottom: 1px solid #e4d6b8;
    opacity: 0.8;

    html.dark & {
        color: var(--header-text);
        border-bottom-color: var(--header-text);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.complaint-button {
    margin-right: 0;
    padding-right: 4px;
    padding-left: 4px;
}

.icon-container {
    height: 24px;
    margin-right: 0;
    cursor: pointer;
}

.icon-img {
    height: 24px;
    object-fit: contain;
}

html.dark .github-icon {
    filter: invert(1);
}

html.dark .message-icon img {
    filter: invert(1) brightness(1.15);
}

.user-message {
    height: auto;
    margin-right: 0;
    position: relative;
    cursor: pointer;
}

.message-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #e3d5b8ff;
    font-size: 10px;
    opacity: 0.8;

    img {
        height: 20px;
    }

    html.dark & {
        color: var(--header-text);
    }
}

.unread-badge {
    width: 14px;
    height: 14px;
    position: absolute;
    top: -2px;
    right: -3px;
    border-radius: 50%;
    background-color: red;
    color: white;
    font-size: 10px;
    font-weight: bold;
    line-height: 14px;
    text-align: center;
}

.user-entry {
    height: 24px;
}
</style>
