<template>
    <div>
        <h3 class="card-heading">公告</h3>
        <p class="announcement">
            <b>这是一个收集6657烂梗的网站：</b>
            <span class="web-url">
                <a href="https://sb6657.cn">sb6657.cn</a>
            </span>
            尽情欣赏你们的烂梗吧。
        </p>
        <p class="sub-info">
            <b>
                <RouterLink to="/Tampermonkey">油猴插件</RouterLink>
                (已支持斗鱼新UI)
                <a href="https://cdn.hguofichp.cn/sb6657.cn%E6%96%97%E9%B1%BC%E7%8E%A9%E6%9C%BA%E5%99%A8%E7%83%82%E6%A2%97%E6%94%B6%E9%9B%86.user.js" target="_blank">点击下载</a>
                可在斗鱼直播间一键发送烂梗
            </b>
        </p>
        <p class="sub-info">开放注册功能，可能会出现收不到邮件的情况。</p>
        <p class="sub-info">目前已支持玩机器直播间开播提醒。加入右侧qq交流群可获取开播q群@提示</p>
        <p class="sub-info">
            <RouterLink to="/update">网站更新日志</RouterLink>
        </p>
        <el-divider />
        <div class="promotion">
            <div class="title">友情推广</div>
            <a class="partner-card" href="https://shnlfriberg.online/" target="_blank" rel="noopener noreferrer" aria-label="访问弗一把：CS:GO / CS2 Major 选手猜测游戏">
                <span class="partner-kicker">CS MAJOR // PLAYER GUESSING</span>
                <span class="partner-name">弗一把</span>
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped lang="scss">
.card-heading {
    margin: 0 0 8px;
    color: var(--body-color);
    font-size: 18px;
    font-weight: 600;
}

.announcement {
    font-size: 16px;
    margin-bottom: 8px;

    .web-url {
        font-size: 20px;
        font-weight: bold;

        a {
            color: red;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}

.sub-info {
    font-size: 14px;
    margin-top: 8px;

    a {
        color: #409eff;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.promotion {
    .title {
        font-weight: 600;
        color: var(--body-color);
    }

    .partner-card {
        display: flex;
        width: fit-content;
        max-width: 100%;
        min-height: 58px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        margin-top: 8px;
        padding: 8px;
        border: 1px solid rgba(32, 17, 24, 0.14);
        box-sizing: border-box;
        clip-path: polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px));
        background:
            radial-gradient(circle at 86% 24%, rgba(201, 234, 22, 0.42), transparent 48%),
            linear-gradient(160deg, #f3f0ea 0%, #f3f6d6 100%);
        color: #201118;
        filter: drop-shadow(0 5px 10px rgba(140, 168, 0, 0.18));
        transition:
            filter 0.2s ease,
            transform 0.2s ease;

        &:hover {
            filter: drop-shadow(0 7px 14px rgba(140, 168, 0, 0.26));
            transform: translateY(-2px);
        }

        &:focus-visible {
            outline: 3px solid #c9ea16;
            outline-offset: 3px;
        }
    }

    .partner-kicker {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #566800;
        font-family: Bahnschrift, 'Arial Narrow', 'Microsoft YaHei', sans-serif;
        font-size: clamp(9px, 2vw, 11px);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0.12em;
        white-space: nowrap;

        &::before {
            width: 3px;
            height: 18px;
            flex: 0 0 auto;
            background: #c9ea16;
            content: '';
        }
    }

    .partner-name {
        color: #201118;
        font-family: Impact, Bahnschrift, 'Arial Narrow', 'Microsoft YaHei', sans-serif;
        font-size: clamp(22px, 4vw, 28px);
        font-style: italic;
        font-weight: 900;
        line-height: 1;
        letter-spacing: 0.06em;
        text-shadow: 2px 2px 0 #c9ea16;
        transform: skewX(-4deg);
    }
}

html.dark .sub-info a {
    color: var(--el-color-primary);
}
</style>
