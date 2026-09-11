<template>
    <header class="header">
        <a class="logo-link" href="https://www.douyu.com/6657" target="_blank">
            <img src="/favicon.ico" alt="大🐖头" class="logo-img" />
            <p class="header-title">斗鱼玩机器烂梗库</p>
        </a>

        <div class="header-actions">
            <HotMemeDialogs v-slot="{ current, rotation, open }">
                <img src="@/assets/imgs/hot.png" alt="热门" class="hot-barrage-img" @click="open" />
                <div class="hot-barrage" @click="open">
                    <transition name="fade">
                        <span :key="rotation" class="hot-barrage-span">热门：{{ current }}</span>
                    </transition>
                </div>
            </HotMemeDialogs>

            <HeaderSearch class="search-entry" />

            <HeaderSubmissionEntry v-slot="{ open }">
                <button class="submit-entry" type="button" @click="open">投稿</button>
            </HeaderSubmissionEntry>

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

            <HeaderSupportEntry v-slot="{ open }" dialog-width="35%">
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
    </header>
</template>

<script setup lang="ts">
import HeaderBusinessEntry from './header-business-entry.vue';
import HeaderMessageEntry from './header-message-entry.vue';
import HeaderSearch from './header-search.vue';
import HeaderSubmissionEntry from './header-submission-entry.vue';
import HeaderSupportEntry from './header-support-entry.vue';
import HotMemeDialogs from './hot-meme-dialogs.vue';
import UserHome from './userHome.vue';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

const lightningUrl = 'https://cdn.hguofichp.cn/power.png';

function complaintButton() {
    window.open('https://www.wjx.cn/vm/rQUgnS0.aspx#');
}
</script>

<style scoped lang="scss">
.header {
    width: 100%;
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    backdrop-filter: saturate(100%) blur(4px);

    html.dark & {
        background: var(--header-bg);
    }
}

.logo-link {
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.logo-img {
    height: 40px;
    margin-right: 6px;
    border-radius: 5px;
}

.header-title {
    width: 250px;
    color: var(--header-title-color, #ff552e);
    font-size: 30px;
}

.header-actions {
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
}

.hot-barrage-img {
    width: 26px;
    height: 26px;
    cursor: pointer;
}

.hot-barrage {
    width: 300px;
    overflow: hidden;
    color: #e4d6b8;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;

    html.dark & {
        color: var(--header-text);
    }
}

.hot-barrage-span {
    color: #e4d6b8;
    border-bottom: 1px solid #e4d6b8;

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

.search-entry {
    width: 180px;
    margin-right: 20px;
}

.submit-entry {
    align-self: flex-start;
    min-width: 70px;
    height: 52px;
    margin-right: 10px;
    border: 0;
    border-radius: 0 0 10px 10px;
    background: #fb7299;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 1px;
    box-shadow: 0 4px 12px rgba(251, 114, 153, 0.26);
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

.complaint-button {
    margin-right: 10px;
    padding-right: 4px;
    padding-left: 4px;
}

.icon-container {
    height: 32px;
    margin-right: 15px;
    cursor: pointer;
}

.icon-img {
    height: 32px;
    object-fit: contain;
}

html.dark .github-icon {
    filter: invert(1);
}

html.dark .message-icon img {
    filter: invert(1) brightness(1.15);
}

.user-message {
    height: 32px;
    margin-right: 15px;
    position: relative;
    cursor: pointer;
}

.message-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #e3d5b8ff;
    font-size: 12px;

    img {
        height: 28px;
    }

    html.dark & {
        color: var(--header-text);
    }
}

.unread-badge {
    width: 16px;
    height: 16px;
    position: absolute;
    top: -3px;
    right: -4px;
    border-radius: 50%;
    background-color: red;
    color: white;
    font-size: 12px;
    font-weight: bold;
    line-height: 12px;
    text-align: center;
}

.user-entry {
    height: 32px;
}
</style>
