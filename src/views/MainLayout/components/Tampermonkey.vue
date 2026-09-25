<template>
    <div class="tampermonkey-container">
        <!-- 顶部 Hero 卡片 -->
        <section class="card hero-section">
            <div class="hero-header">
                <div class="hero-badge">官方插件</div>
                <h1 class="hero-title">sb6657 斗鱼玩机器烂梗收集油猴插件</h1>
                <p class="hero-desc">
                    在斗鱼 6657 直播间输入框上方添加“玩烂梗”工具栏，支持弹幕关键词搜索、一键发送、快速复制，并已全面支持<strong>自动检查更新</strong>。
                </p>
                <div class="version-meta">
                    <span class="meta-tag version">最新版本：{{ currentVersion }}</span>
                    <span class="meta-tag date">更新日期：{{ updateDate }}</span>
                    <span class="meta-tag status">运行环境：Tampermonkey 扩展</span>
                </div>
            </div>

            <div class="hero-actions">
                <a :href="userscriptUrl" target="_blank" class="btn-action primary-btn" title="装有油猴的用户点击后会自动弹出安装页">
                    <el-icon class="btn-icon"><Download /></el-icon>
                    一键安装插件（推荐）
                </a>
                <a :href="backupCdnUrl" target="_blank" class="btn-action cdn-btn" title="从 CDN 备用地址下载插件">
                    <el-icon class="btn-icon"><Download /></el-icon>
                    备用下载 (CDN)
                </a>
                <a :href="tampermonkeyHomeUrl" target="_blank" rel="noopener noreferrer" class="btn-action secondary-btn">
                    <el-icon class="btn-icon"><ChromeFilled /></el-icon>
                    安装油猴管理器
                </a>
                <a :href="greasyforkUrl" target="_blank" rel="noopener noreferrer" class="btn-action text-btn">
                    Greasy Fork 备用源
                </a>
            </div>
        </section>

        <!-- 极简 3 步安装指南 -->
        <section class="card quick-guide-section">
            <h2 class="section-title">⚡ 极简安装 3 步曲</h2>
            <div class="guide-steps">
                <div class="guide-step-card">
                    <div class="step-num">1</div>
                    <div class="step-content">
                        <h3>安装油猴扩展</h3>
                        <p>若你的浏览器已安装过 Tampermonkey，可直接跳到第 2 步；若未安装，请先根据下方浏览器教程安装油猴扩展。</p>
                    </div>
                </div>
                <div class="guide-step-card highlight">
                    <div class="step-num">2</div>
                    <div class="step-content">
                        <h3>点击一键安装</h3>
                        <p>点击上方绿色的<strong>【一键安装插件】</strong>按钮，油猴会自动弹出脚本安装确认页，点击<strong>“安装”</strong>即可。</p>
                    </div>
                </div>
                <div class="guide-step-card">
                    <div class="step-num">3</div>
                    <div class="step-content">
                        <h3>进入直播间使用</h3>
                        <p>打开斗鱼 6657 直播间，在播放器/聊天输入框上方看到<strong>“玩烂梗”</strong>绿色按钮，即表示安装成功！</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 特性亮点卡片 -->
        <section class="card features-section">
            <div class="feature-item">
                <div class="feature-icon">🔄</div>
                <div>
                    <h4>自动检查更新</h4>
                    <p>插件启动时自动对比服务端最新版本，亦可在插件面板点击【更新】图标主动检测，发现新版一键升级。</p>
                </div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <div>
                    <h4>毫秒级弹幕搜索</h4>
                    <p>对接当前高防加速接口，输入关键词实时搜索 2600+ 玩机器经典弹幕，支持回车直出。</p>
                </div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">🚀</div>
                <div>
                    <h4>一键复制与发送</h4>
                    <p>点击弹幕或复制按钮秒级复制，支持一键发送至斗鱼聊天框（自带 5 秒冷却防刷屏机制）。</p>
                </div>
            </div>
        </section>

        <!-- 详细浏览器安装教程 -->
        <section class="card tutorial-section">
            <div class="tutorial-header">
                <h2 class="section-title">📖 详细图文安装教程</h2>
                <div class="tab-buttons">
                    <el-button
                        :type="activeTab === 1 ? 'primary' : 'default'"
                        @click="activeTab = 1"
                    >
                        Edge 浏览器教程
                    </el-button>
                    <el-button
                        :type="activeTab === 2 ? 'primary' : 'default'"
                        @click="activeTab = 2"
                    >
                        Chrome / 谷歌内核教程
                    </el-button>
                    <el-button
                        :type="activeTab === 3 ? 'primary' : 'default'"
                        @click="activeTab = 3"
                    >
                        离线 / 备用安装教程
                    </el-button>
                </div>
            </div>

            <!-- Tab 1: Edge 浏览器 -->
            <div v-if="activeTab === 1" class="tutorial-body">
                <div class="tip-box">
                    💡 <strong>提示：</strong>如果你已经安装了 Tampermonkey 油猴扩展，可以直接跳到第 4 步点击安装脚本。
                </div>

                <div class="tutorial-step">
                    <h3>1、进入油猴脚本官网</h3>
                    <p>访问官网 <a :href="tampermonkeyHomeUrl" target="_blank">{{ tampermonkeyHomeUrl }}</a>，点击前往 Edge 商店。</p>
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f249b.jpg" alt="进入油猴脚本官网" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>2、进入微软 Edge 扩展商店，点击获取</h3>
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f24a8.jpg" alt="获取扩展" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>3、在弹出框选择“添加扩展”</h3>
                    <p>等待浏览器安装完成，浏览器右上角扩展栏会出现油猴的黑色方块图标。</p>
                </div>

                <div class="tutorial-step">
                    <h3>4、安装 sb6657 玩烂梗收集插件</h3>
                    <p>
                        点击本站顶部的
                        <a :href="userscriptUrl" target="_blank" class="link-highlight">【一键安装插件】</a>
                        （或备用源 <a :href="greasyforkUrl" target="_blank">Greasy Fork 页面</a>）。
                    </p>
                </div>

                <div class="tutorial-step">
                    <h3>5、在油猴弹出的安装页中，点击“安装”</h3>
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f24b6.jpg" alt="点击安装" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f24c7.jpg" alt="确认安装" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>6、进入斗鱼 6657 直播间验证</h3>
                    <p>刷新或打开斗鱼直播间，输入框上方出现<strong>“玩烂梗”</strong>即说明安装成功！</p>
                    <img src="https://pic.imgdb.cn/item/6704f9bbd29ded1a8c752754.png" alt="直播间按钮" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>7、直接复制与一键发送演示</h3>
                    <img src="https://pic.imgdb.cn/item/6704f9bbd29ded1a8c752763.png" alt="功能演示1" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/6704f9bbd29ded1a8c75276a.png" alt="功能演示2" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/6704f9bbd29ded1a8c752773.png" alt="功能演示3" class="tut-img">
                </div>
            </div>

            <!-- Tab 2: Chrome 谷歌内核 -->
            <div v-if="activeTab === 2" class="tutorial-body">
                <div class="tip-box">
                    💡 <strong>提示：</strong>Chrome 浏览器需要先开启扩展管理中的“开发者模式”，即可直接安装 crx 或在线扩展。
                </div>

                <div class="tutorial-step">
                    <h3>1、进入油猴脚本官网下载 crx 扩展包</h3>
                    <p>访问官网 <a :href="tampermonkeyHomeUrl" target="_blank">{{ tampermonkeyHomeUrl }}</a> 点击右侧下载。</p>
                    <img src="https://pic.imgdb.cn/item/6704e6ddd29ded1a8c6322a2.jpg" alt="Chrome下载" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>2、进入 设置 -> 扩展程序 -> 管理扩展程序</h3>
                    <p>在右上角勾选开启<strong>“开发者模式”</strong>。</p>
                    <img src="https://pic.imgdb.cn/item/670504bdd29ded1a8c8027ac.png" alt="管理扩展程序" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>3、将下载好的 crx 文件拖入扩展程序页面中</h3>
                    <img src="https://pic.imgdb.cn/item/6704e6ddd29ded1a8c6322b9.png" alt="拖入扩展" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/670504bdd29ded1a8c802798.jpg" alt="确认添加扩展" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>4、安装 sb6657 玩烂梗收集插件</h3>
                    <p>
                        安装好油猴后，点击
                        <a :href="userscriptUrl" target="_blank" class="link-highlight">【一键安装插件】</a>
                        （或备用源 <a :href="greasyforkUrl" target="_blank">Greasy Fork 页面</a>）。
                    </p>
                </div>

                <div class="tutorial-step">
                    <h3>5、油猴页面点击“安装”</h3>
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f24b6.jpg" alt="安装" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/670503ddd29ded1a8c7f24c7.jpg" alt="再次确认" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>6、进入直播间享受无缝玩烂梗体验</h3>
                    <img src="https://pic.imgdb.cn/item/6704f9bbd29ded1a8c752754.png" alt="安装成功" class="tut-img">
                </div>
            </div>

            <!-- Tab 3: 备用离线安装 -->
            <div v-if="activeTab === 3" class="tutorial-body">
                <div class="tip-box">
                    💡 <strong>提示：</strong>若在线安装被网络限制拦截，可使用网盘备用扩展包手动安装。
                </div>

                <div class="tutorial-step">
                    <h3>1、网盘下载油猴插件离线包 crx</h3>
                    <p>
                        蓝奏云下载地址：
                        <a href="https://wwe.lanzoui.com/irNjUtgyxpc" target="_blank" rel="noopener noreferrer">https://wwe.lanzoui.com/irNjUtgyxpc</a>
                    </p>
                    <img src="https://pic.imgdb.cn/item/6704e792d29ded1a8c63b824.jpg" alt="网盘下载" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>2、解压压缩包，得到 crx 文件</h3>
                    <img src="https://pic.imgdb.cn/item/6704e792d29ded1a8c63b82d.jpg" alt="解压crx" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>3、进入 浏览器设置 -> 扩展程序，开启“开发者模式”后拖入 crx</h3>
                    <img src="https://pic.imgdb.cn/item/6704e6ddd29ded1a8c6322b9.png" alt="拖入" class="tut-img">
                    <img src="https://pic.imgdb.cn/item/670504bdd29ded1a8c802798.jpg" alt="确认" class="tut-img">
                </div>

                <div class="tutorial-step">
                    <h3>4、安装脚本</h3>
                    <p>
                        扩展安装好后，直接点击
                        <a :href="userscriptUrl" target="_blank" class="link-highlight">【一键安装插件】</a>
                        ，在油猴中保存即可正常运行！
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Download, ChromeFilled } from '@element-plus/icons-vue';

const activeTab = ref(1);
const currentVersion = 'v2026.09.25.01';
const updateDate = '2026-09-25';
const userscriptUrl = '/sb6657.user.js';
const backupCdnUrl = 'https://cdn.hguofichp.cn/sb6657.cn%E6%96%97%E9%B1%BC%E7%8E%A9%E6%9C%BA%E5%99%A8%E7%83%82%E6%A2%97%E6%94%B6%E9%9B%86.user.js';
const tampermonkeyHomeUrl = 'https://www.tampermonkey.net/';
const greasyforkUrl = 'https://greasyfork.org/zh-CN/scripts/511842-sb6657-cn%E6%96%97%E9%B1%BC%E7%8E%A9%E6%9C%BA%E5%99%A8%E7%83%82%E6%A2%97%E6%94%B6%E9%9B%86';
</script>

<style scoped>
.tampermonkey-container {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 40px;
}

/* Hero Section */
.hero-section {
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: #eaf6ec !important;
    background: linear-gradient(135deg, #edf7ee 0%, #e1f3e5 100%) !important;
    border: 1px solid #b7e1be;
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.12);
}

:deep(.dark) .hero-section,
[data-theme='dark'] .hero-section {
    background-color: #172b1c !important;
    background: linear-gradient(135deg, #172b1c 0%, #1e3825 100%) !important;
    border-color: #2e5936;
}

.hero-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hero-badge {
    align-self: flex-start;
    background-color: #4CAF50;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
}

.hero-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--body-color, #1f2937);
    margin: 0;
}

.hero-desc {
    font-size: 15px;
    line-height: 1.6;
    color: #6b7280;
    margin: 0;
}

.version-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
}

.meta-tag {
    font-size: 13px;
    padding: 4px 10px;
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.04);
    color: #4b5563;
}

.meta-tag.version {
    background-color: rgba(76, 175, 80, 0.12);
    color: #2e7d32;
    font-weight: 600;
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
}

.btn-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-icon {
    font-size: 16px;
}

.primary-btn {
    background-color: #4CAF50;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
}

.primary-btn:hover {
    background-color: #43A047;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.35);
}

.secondary-btn {
    background-color: #1e88e5;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
}

.secondary-btn:hover {
    background-color: #1976d2;
    transform: translateY(-1px);
}

.cdn-btn {
    background-color: #ffffff;
    color: #2e7d32;
    border: 1.5px solid #81c784;
    box-shadow: 0 2px 6px rgba(76, 175, 80, 0.12);
}

.cdn-btn:hover {
    background-color: #f1f8f3;
    border-color: #4CAF50;
    color: #1b5e20;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
}

.text-btn {
    color: #6b7280;
    background: transparent;
    padding: 10px 14px;
}

.text-btn:hover {
    color: #4CAF50;
}

/* Quick Guide */
.quick-guide-section {
    padding: 22px 28px;
}

.section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--body-color, #1f2937);
    margin: 0 0 16px 0;
}

.guide-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.guide-step-card {
    display: flex;
    gap: 14px;
    padding: 16px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.guide-step-card.highlight {
    background-color: rgba(76, 175, 80, 0.06);
    border-color: rgba(76, 175, 80, 0.2);
}

.step-num {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #4CAF50;
    color: #ffffff;
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.step-content h3 {
    margin: 0 0 6px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--body-color, #1f2937);
}

.step-content p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
}

/* Features */
.features-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    padding: 20px 24px;
}

.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.feature-icon {
    font-size: 24px;
    line-height: 1;
}

.feature-item h4 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--body-color, #1f2937);
}

.feature-item p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
}

/* Tutorial */
.tutorial-section {
    padding: 24px 28px;
}

.tutorial-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f0f0f0;
}

.tab-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.tip-box {
    background-color: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    color: #1e40af;
    margin-bottom: 24px;
}

.tutorial-step {
    margin-bottom: 28px;
}

.tutorial-step h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--body-color, #1f2937);
    margin: 0 0 8px 0;
}

.tutorial-step p {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
    margin: 0 0 12px 0;
}

.link-highlight {
    color: #4CAF50;
    font-weight: 600;
    text-decoration: underline;
}

.tut-img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-top: 6px;
    margin-bottom: 12px;
    display: block;
}

@media (max-width: 768px) {
    .hero-title {
        font-size: 20px;
    }
    .guide-steps {
        grid-template-columns: 1fr;
    }
    .tutorial-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>