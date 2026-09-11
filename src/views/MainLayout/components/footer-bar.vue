<template>
    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-links" aria-label="页脚导航">
                <section class="footer-section">
                    <h2>sb6657</h2>
                    <nav class="link-list" aria-label="sb6657 站点入口">
                        <a href="https://github.com/sb6657-cn/sb6657/" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <button class="link-button" type="button" @click="qqGroupDialogVisible = true">官方交流群</button>
                        <a href="https://www.wjx.cn/vm/rQUgnS0.aspx#" target="_blank" rel="noopener noreferrer">建议/提交 BUG</a>
                        <RouterLink to="/Tampermonkey">油猴脚本</RouterLink>
                        <RouterLink to="/Starrysky" target="_blank">星空背景</RouterLink>
                        <RouterLink to="/update">更新日志</RouterLink>
                        <button class="link-button" type="button" @click="supportDialogVisible = true">赞赏支持</button>
                        <a href="https://sb6657.cn/v1.sb6657.cn/" target="_blank" rel="noopener noreferrer">sb6657旧版v1</a>
                        <a href="https://sb6657.cn/v2.sb6657.cn/" target="_blank" rel="noopener noreferrer">sb6657旧版v2</a>
                    </nav>
                </section>
                <section class="footer-section">
                    <h2>友情链接</h2>
                    <nav class="link-list" aria-label="友情链接">
                        <a href="https://www.douyu.com/6657" target="_blank" rel="noopener noreferrer">玩机器直播间</a>
                        <a href="https://dgq63136.cn/" target="_blank" rel="noopener noreferrer">dgq63136.cn</a>
                        <a href="https://shnlfriberg.online/" target="_blank" rel="noopener noreferrer">弗一把</a>
                        <a href="https://www.bilibili.com/video/BV1WWEj6iE7A" target="_blank" rel="noopener noreferrer">一个人玩游戏ai弹幕</a>
                        <a href="https://www.bilibili.com/video/BV1NLLz68EDs" target="_blank" rel="noopener noreferrer">6657烂梗复制器</a>
                    </nav>
                </section>
            </div>

            <div class="footer-divider"></div>

            <div class="footer-status">
                <div class="date-font">
                    距服务器到期还有
                    <span>{{ serverDate }}</span>
                    天
                </div>
                <div class="site-runtime">
                    <a class="ipv6-badge" href="https://www.trustssl.cc/ipv6.php?domain=sb6657.cn" title="IPv6网站检测" target="_blank" rel="noopener noreferrer">已支持IPv6访问</a>
                    <span>本站已运行{{ daysSinceLaunch }}天 · Since 2024</span>
                </div>
            </div>
        </div>

        <el-dialog v-model="qqGroupDialogVisible" append-to-body title="官方交流群" width="min(420px, 92vw)">
            <img src="https://static.wishao.site/sb6657/img/qqgroup.webp" alt="sb6657 官方交流群二维码" style="display: block; width: 100%; max-width: 100%; height: auto; object-fit: contain" />
            <p class="qq-group-hint">QQ群：1070269456、526042235</p>
        </el-dialog>

        <el-dialog v-model="supportDialogVisible" append-to-body title="谢谢老板~" width="min(420px, 92vw)">
            <img src="https://cdn.hguofichp.cn/zfb.jpg" alt="支付宝赞赏码" style="display: block; width: 100%; max-width: 100%; height: auto; object-fit: contain" />
        </el-dialog>
    </footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

const serverDate = ref(0);
const qqGroupDialogVisible = ref(false);
const supportDialogVisible = ref(false);
const txServerDate = new Date('2027-02-12'); // 服务器到期日期
const currentDate = new Date();
serverDate.value = Math.ceil((txServerDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

const launchDate = new Date('2024-02-07');
// 计算已运行天数
const daysSinceLaunch = computed(() => {
    const currentDateTimestamp = new Date().getTime(); // 获取当前时间的时间戳
    const timeDifference = currentDateTimestamp - launchDate.getTime(); // 使用 getTime() 方法获取时间戳并进行减法运算
    const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return dayDifference;
});
</script>

<style scoped lang="scss">
.footer {
    width: 100%;
    margin-top: 24px;
    padding: 32px clamp(16px, 5vw, 64px) 24px;
    color: var(--body-color);
    font-family: Arial, sans-serif;
    box-sizing: border-box;
    opacity: 0.85;

    .footer-inner {
        width: min(1100px, 100%);
        margin: 0 auto;
    }

    .footer-links {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 32px clamp(40px, 8vw, 96px);
    }

    .footer-section {
        min-width: 0;
        flex: 1 1 240px;

        h2 {
            margin: 0 0 14px;
            color: var(--body-color);
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
        }
    }

    .link-list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 12px;

        a,
        .link-button {
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--body-color);
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
            text-decoration: none;
            transition: color 0.2s;
            cursor: pointer;

            &:hover {
                color: #409eff;
            }
        }
    }

    .footer-divider {
        width: 100%;
        height: 1px;
        margin: 28px 0 20px;
        background-color: var(--header-border);
    }

    .footer-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        font-size: 12px;

        .date-font {
            font-weight: bold;

            span {
                color: red;
            }
        }

        .site-runtime {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .ipv6-badge {
            height: 20px;
            padding: 0 6px;
            border: 1px solid #00b34a;
            border-radius: 4px;
            color: #00a344;
            background: transparent;
            font-size: 12px;
            line-height: 18px;
        }
    }

    .qq-group-hint {
        margin-top: 10px;
        color: #606266;
        font-size: 13px;
        text-align: center;

        html.dark & {
            color: var(--el-text-color-secondary);
        }
    }

    @media (max-width: 600px) {
        margin-top: 16px;
        padding-top: 24px;

        .footer-links {
            gap: 24px 32px;
        }

        .footer-section {
            flex-basis: 200px;
        }

        .footer-divider {
            margin: 24px 0 18px;
        }
    }
}
</style>
