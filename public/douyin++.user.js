// ==UserScript==
// @name         douyin++
// @namespace    https://sb6657.cn/
// @version      v2026.11.09.04
// @description  sb6657玩机器烂梗（抖音版）：原生飘屏弹幕悬停即停并显示+1与回复、玩烂梗按钮与面板默认展示最新50条烂梗/搜索发送及赞赏充电支持，兼容油猴 5.5.1 及以上
// @author       HZM
// @match        https://live.douyin.com/*
// @include      https://live.douyin.com/*
// @icon         https://apic.douyucdn.cn/upload/avatar_v3/202510/39e8bc3233ca412fa991a18bd024cfbc_middle.jpg
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.hguofichp.cn
// @connect      sb6657.cn
// @connect      cdn.hguofichp.cn
// @run-at       document-start
// @license      MIT
// @downloadURL  https://sb6657.cn/douyin++.user.js
// @updateURL    https://sb6657.cn/douyin++.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) {
        return;
    }

    const CURRENT_VERSION = 'v2026.11.09.04';
    const API_QUERY_URL = 'https://api.hguofichp.cn/machine/Query';
    const API_PAGE_URL = 'https://api.hguofichp.cn/machine/Page';
    const API_DICT_LIST_URL = 'https://api.hguofichp.cn/machine/dictList';
    const API_ADD_CNT_URL = 'https://api.hguofichp.cn/machine/addCnt';
    const BRAND_ICON_URL = 'https://apic.douyucdn.cn/upload/avatar_v3/202510/39e8bc3233ca412fa991a18bd024cfbc_middle.jpg';
    const SPONSOR_WX_QR = 'https://cdn.hguofichp.cn/zfb.jpg';
    const SPONSOR_ALIPAY_QR = 'https://cdn.hguofichp.cn/%E6%94%AF%E4%BB%98%E5%AE%9D%E7%BB%8F%E8%90%A5%E7%A0%81.png';
    const SPONSOR_HOME_URL = 'https://sb6657.cn';
    const DEFAULT_PAGE_SIZE = 50;

    console.log('[sb6657 douyin++] 抖音直播增强插件启动中，版本:', CURRENT_VERSION);

    // ==========================================
    // 1. 早期注入：引导原生弹幕走主线程 Canvas 渲染
    // ==========================================
    function installMainWorldTransferHook() {
        const hookCode = `
            (function () {
                if (window.__sb6657_transfer_hooked__) return;
                window.__sb6657_transfer_hooked__ = true;
                var proto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
                if (!proto || !proto.transferControlToOffscreen) return;
                var origTransfer = proto.transferControlToOffscreen;
                proto.transferControlToOffscreen = function () {
                    try {
                        if (this.parentElement && this.parentElement.classList && this.parentElement.classList.contains('CanvasDanmakuPlugin')) {
                            return undefined;
                        }
                    } catch (e) {}
                    return origTransfer.apply(this, arguments);
                };
            })();
        `;

        // 优先注入主世界 <script>（适配 Tampermonkey 5.5.1+ / MV3 隔离沙盒）
        let injected = false;
        try {
            const script = document.createElement('script');
            script.textContent = hookCode;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
            injected = true;
        } catch (e) {}

        // 兜底：若页面启用了严格 CSP 阻断内联脚本，直接通过 unsafeWindow 补丁
        try {
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            if (win && !win.__sb6657_transfer_hooked__ && win.HTMLCanvasElement && win.HTMLCanvasElement.prototype.transferControlToOffscreen) {
                win.__sb6657_transfer_hooked__ = true;
                const orig = win.HTMLCanvasElement.prototype.transferControlToOffscreen;
                win.HTMLCanvasElement.prototype.transferControlToOffscreen = function () {
                    try {
                        if (this.parentElement && this.parentElement.classList && this.parentElement.classList.contains('CanvasDanmakuPlugin')) {
                            return undefined;
                        }
                    } catch (e) {}
                    return orig.apply(this, arguments);
                };
            }
        } catch (e) {
            if (!injected) {
                console.warn('[sb6657 douyin++] transferControlToOffscreen Hook 注册受限:', e);
            }
        }
    }

    installMainWorldTransferHook();

    // ==========================================
    // 样式注入
    // ==========================================
    function addGlobalStyles(css) {
        const inject = () => {
            const target = document.head || document.documentElement;
            if (!target) return false;
            let style = document.getElementById('sb6657-douyin-styles');
            if (!style) {
                style = document.createElement('style');
                style.id = 'sb6657-douyin-styles';
                style.type = 'text/css';
                style.textContent = css;
                target.appendChild(style);
            }
            return true;
        };
        if (!inject()) {
            const t = setInterval(() => {
                if (inject()) clearInterval(t);
            }, 50);
        }
    }

    const globalStyles = `
        /* 悬浮 sb6657 图标按钮 */
        #sb6657-douyin-ball {
            position: fixed;
            bottom: 136px;
            right: 16px;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            box-shadow: 0 4px 16px rgba(22, 163, 74, 0.45);
            cursor: pointer;
            z-index: 2147483640;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
            user-select: none;
            border: 2px solid #ffffff;
            pointer-events: auto !important;
        }
        #sb6657-douyin-ball:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 6px 20px rgba(22, 163, 74, 0.65);
        }
        #sb6657-douyin-ball:active {
            transform: scale(0.95);
        }
        #sb6657-douyin-ball img {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            pointer-events: none;
            display: block;
        }
        #sb6657-douyin-ball .pulse-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background-color: #ef4444;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
            pointer-events: none;
        }

        /* 播放器控制栏“玩烂梗”按钮外层容器：强制恢复鼠标响应（父容器为 pointer-events: none） */
        .sb6657-ctrl-slot {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: auto !important;
            position: relative !important;
            z-index: 50 !important;
            margin: 0 8px !important;
            height: 32px !important;
        }

        .sb6657-toolbar-btn {
            display: inline-flex !important;
            align-items: center !important;
            gap: 5px !important;
            height: 26px !important;
            padding: 0 10px !important;
            background: linear-gradient(135deg, #22c55e, #15803d) !important;
            color: #ffffff !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1 !important;
            border-radius: 13px !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            cursor: pointer !important;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35) !important;
            transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important;
            pointer-events: auto !important;
            user-select: none !important;
            white-space: nowrap !important;
            position: relative !important;
            z-index: 51 !important;
        }
        .sb6657-toolbar-btn:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.55) !important;
            background: linear-gradient(135deg, #16a34a, #15803d) !important;
        }
        .sb6657-toolbar-btn:active {
            transform: scale(0.96) !important;
        }
        .sb6657-toolbar-btn img {
            width: 16px !important;
            height: 16px !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            display: block !important;
        }
        .sb6657-toolbar-btn span {
            pointer-events: none !important;
            color: #ffffff !important;
        }

        /* 功能面板容器 */
        #sb6657-panel {
            position: fixed;
            top: 100px;
            right: 80px;
            width: 448px;
            height: 576px;
            background: rgba(255, 255, 255, 0.97);
            border-radius: 14px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08);
            backdrop-filter: blur(12px);
            z-index: 2147483645;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
            animation: sb6657-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: auto !important;
        }
        @keyframes sb6657-pop-in {
            from { opacity: 0; transform: scale(0.94) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        body.dark #sb6657-panel,
        [data-theme='dark'] #sb6657-panel {
            background: rgba(24, 24, 27, 0.97);
            color: #f3f4f6;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12);
        }

        .sb6657-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 11px 14px;
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border-bottom: 1px solid #bbf7d0;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        body.dark .sb6657-panel-header,
        [data-theme='dark'] .sb6657-panel-header {
            background: linear-gradient(135deg, #14532d, #052e16);
            border-bottom-color: #166534;
        }
        .sb6657-panel-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            color: #15803d;
            min-width: 0;
            white-space: nowrap;
        }
        body.dark .sb6657-panel-title,
        [data-theme='dark'] .sb6657-panel-title {
            color: #86efac;
        }
        .sb6657-panel-title img {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .sb6657-header-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
        }
        /* 顶部赞赏充电按钮 */
        .sb6657-sponsor-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 26px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid rgba(18, 150, 219, 0.35);
            background: linear-gradient(135deg, #e0f2fe, #bae6fd);
            color: #0369a1;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }
        .sb6657-sponsor-btn:hover,
        .sb6657-sponsor-btn.active {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            border-color: #0284c7;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }
        .sb6657-sponsor-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
            flex-shrink: 0;
        }
        body.dark .sb6657-sponsor-btn,
        [data-theme='dark'] .sb6657-sponsor-btn {
            background: rgba(14, 165, 233, 0.16);
            border-color: rgba(56, 189, 248, 0.4);
            color: #38bdf8;
        }
        body.dark .sb6657-sponsor-btn:hover,
        body.dark .sb6657-sponsor-btn.active,
        [data-theme='dark'] .sb6657-sponsor-btn:hover,
        [data-theme='dark'] .sb6657-sponsor-btn.active {
            background: #0284c7;
            color: #ffffff;
        }
        .sb6657-icon-btn {
            background: transparent;
            border: none;
            width: 26px;
            height: 26px;
            border-radius: 6px;
            cursor: pointer;
            color: #4b5563;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: background 0.15s ease;
        }
        .sb6657-icon-btn:hover {
            background: rgba(0, 0, 0, 0.08);
            color: #111827;
        }
        body.dark .sb6657-icon-btn,
        [data-theme='dark'] .sb6657-icon-btn {
            color: #9ca3af;
        }
        body.dark .sb6657-icon-btn:hover,
        [data-theme='dark'] .sb6657-icon-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
        }

        /* 面板主体切换视图 */
        .sb6657-main-view {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        /* 搜索区域 */
        .sb6657-search-area {
            padding: 12px 14px 8px;
            display: flex;
            gap: 8px;
            flex-shrink: 0;
        }
        .sb6657-search-input {
            flex: 1;
            height: 36px;
            padding: 0 12px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sb6657-search-input:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
            background: #ffffff;
        }
        body.dark .sb6657-search-input,
        [data-theme='dark'] .sb6657-search-input {
            background: #27272a;
            border-color: #3f3f46;
        }
        body.dark .sb6657-search-input:focus,
        [data-theme='dark'] .sb6657-search-input:focus {
            background: #18181b;
        }
        .sb6657-search-btn {
            height: 36px;
            padding: 0 16px;
            border-radius: 8px;
            border: none;
            background: #22c55e;
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.15s ease;
            white-space: nowrap;
        }
        .sb6657-search-btn:hover {
            background: #16a34a;
        }

        /* 标签快捷栏 */
        .sb6657-tags-bar {
            padding: 0 14px 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-height: 58px;
            overflow-y: auto;
            flex-shrink: 0;
        }
        .sb6657-tag-item {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 4px;
            background: #f3f4f6;
            color: #4b5563;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .sb6657-tag-item:hover,
        .sb6657-tag-item.active {
            background: #dcfce7;
            color: #15803d;
            font-weight: 600;
        }
        body.dark .sb6657-tag-item,
        [data-theme='dark'] .sb6657-tag-item {
            background: #27272a;
            color: #9ca3af;
        }
        body.dark .sb6657-tag-item:hover,
        body.dark .sb6657-tag-item.active,
        [data-theme='dark'] .sb6657-tag-item:hover,
        [data-theme='dark'] .sb6657-tag-item.active {
            background: #14532d;
            color: #86efac;
        }

        /* 列表状态提示条 */
        .sb6657-list-status {
            padding: 2px 14px 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
            flex-shrink: 0;
        }
        body.dark .sb6657-list-status,
        [data-theme='dark'] .sb6657-list-status {
            color: #9ca3af;
        }
        .sb6657-reset-link {
            color: #16a34a;
            background: transparent;
            border: none;
            padding: 0;
            font-size: 12px;
            cursor: pointer;
            text-decoration: underline;
        }
        .sb6657-reset-link:hover {
            color: #15803d;
        }

        /* 烂梗列表 */
        .sb6657-list-container {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 2px 14px 14px;
        }
        .sb6657-list-container::-webkit-scrollbar {
            width: 6px;
        }
        .sb6657-list-container::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
        }
        .sb6657-meme-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 12px;
            margin-bottom: 8px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            transition: all 0.15s ease;
        }
        .sb6657-meme-card:hover {
            border-color: #86efac;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            background: #fdfdfd;
        }
        body.dark .sb6657-meme-card,
        [data-theme='dark'] .sb6657-meme-card {
            background: #27272a;
            border-color: #3f3f46;
        }
        body.dark .sb6657-meme-card:hover,
        [data-theme='dark'] .sb6657-meme-card:hover {
            border-color: #16a34a;
            background: #1f1f23;
        }
        .sb6657-meme-text {
            flex: 1;
            font-size: 13px;
            line-height: 1.5;
            word-break: break-all;
            color: inherit;
            cursor: pointer;
        }
        .sb6657-meme-text:hover {
            color: #16a34a;
        }
        .sb6657-meme-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
        }
        .sb6657-btn-copy {
            padding: 4px 10px;
            font-size: 12px;
            border-radius: 5px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: #374151;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .sb6657-btn-copy:hover {
            border-color: #10b981;
            color: #10b981;
        }
        .sb6657-btn-send {
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 5px;
            border: none;
            background: #f97316;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .sb6657-btn-send:hover {
            background: #ea580c;
            transform: scale(1.02);
        }

        /* 赞赏充电内嵌视图 */
        .sb6657-sponsor-view {
            display: none;
            flex-direction: column;
            align-items: center;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 16px 18px 18px;
            gap: 12px;
        }
        .sb6657-sponsor-top {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .sb6657-back-btn {
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: #374151;
            cursor: pointer;
        }
        .sb6657-back-btn:hover {
            border-color: #22c55e;
            color: #16a34a;
        }
        .sb6657-sponsor-tabs {
            display: flex;
            gap: 8px;
        }
        .sb6657-sponsor-tab {
            padding: 5px 14px;
            font-size: 12.5px;
            font-weight: 600;
            border-radius: 999px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: #4b5563;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .sb6657-sponsor-tab.active {
            background: #0284c7;
            border-color: #0284c7;
            color: #ffffff;
        }
        .sb6657-sponsor-qr-box {
            width: 240px;
            height: 240px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .sb6657-sponsor-qr-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
        }
        .sb6657-sponsor-desc {
            font-size: 13px;
            color: #4b5563;
            text-align: center;
            line-height: 1.5;
        }
        body.dark .sb6657-sponsor-desc,
        [data-theme='dark'] .sb6657-sponsor-desc {
            color: #d1d5db;
        }
        .sb6657-sponsor-links {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .sb6657-sponsor-open-btn {
            padding: 6px 14px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: #ffffff;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
        }
        .sb6657-sponsor-open-btn.secondary {
            background: #22c55e;
        }

        /* 提示 Toast */
        #sb6657-toast {
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
            background: rgba(17, 24, 39, 0.92);
            color: #ffffff;
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            z-index: 2147483647;
            pointer-events: none;
            transition: opacity 0.22s ease, transform 0.22s ease;
            backdrop-filter: blur(4px);
        }
        #sb6657-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* 原生飘屏弹幕暂停高亮框（pointer-events: none，不拦截视频单击/双击） */
        #sb6657-danmu-highlight-box {
            position: fixed;
            z-index: 2147483635;
            display: none;
            pointer-events: none;
            border: 1.5px solid rgba(34, 197, 94, 0.88);
            background: rgba(34, 197, 94, 0.14);
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
            box-sizing: border-box;
        }

        /* 紧挨悬停弹幕出现的 +1 与 回复 胶囊操作条 */
        #sb6657-danmu-actions {
            position: fixed;
            z-index: 2147483638;
            display: none;
            align-items: center;
            gap: 5px;
            padding: 2px 4px;
            border-radius: 16px;
            background: rgba(17, 24, 39, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.22);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.48);
            backdrop-filter: blur(6px);
            pointer-events: auto !important;
            user-select: none;
        }
        .sb6657-danmu-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            padding: 0 10px;
            border-radius: 12px;
            border: none;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            pointer-events: auto !important;
            white-space: nowrap;
            transition: transform 0.12s ease, filter 0.12s ease;
        }
        .sb6657-danmu-action-btn:hover {
            transform: scale(1.06);
            filter: brightness(1.08);
        }
        .sb6657-danmu-action-btn:active {
            transform: scale(0.95);
        }
        #sb6657-plus1-btn {
            background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        #sb6657-reply-btn {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
    `;

    addGlobalStyles(globalStyles);

    // ==========================================
    // 全局状态与工具函数
    // ==========================================
    let tagList = [];
    let isCooldown = false;
    let activeTagValue = '';
    let hasLoadedDefaultMemes = false;
    const msgMetaMap = new Map(); // msgId -> { text, sender }
    const emojiUrlToNameMap = new Map(); // imageUrl -> '[emoji]'
    let emojiReverseReady = false;

    function getOverlayRoot() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.body || document.documentElement;
    }

    function ensureInOverlayRoot(el) {
        if (!el) return;
        const root = getOverlayRoot();
        if (root && el.parentElement !== root) {
            root.appendChild(el);
        }
    }

    function showToast(message, duration = 2200) {
        let toast = document.getElementById('sb6657-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sb6657-toast';
        }
        ensureInOverlayRoot(toast);
        toast.innerText = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    function copyText(text, id) {
        const onCopied = () => {
            showToast('✔️ 复制成功！');
            if (id) reportCopy(id);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(() => {
                fallbackCopy(text, id);
            });
        } else {
            fallbackCopy(text, id);
        }
    }

    function fallbackCopy(text, id) {
        try {
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
            showToast('✔️ 复制成功！');
            if (id) reportCopy(id);
        } catch (e) {
            showToast('❌ 复制失败，请手动选取');
        }
    }

    function gmRequestText(method, url, bodyData, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const headers = {
                'dpahjdoiaw': 'c2I2NjU35o+S5Lu2'
            };
            if (method === 'POST') {
                headers['Content-Type'] = 'application/json';
            }

            try {
                if (typeof GM_xmlhttpRequest === 'function') {
                    GM_xmlhttpRequest({
                        method,
                        url,
                        headers,
                        data: bodyData,
                        timeout,
                        onload: (res) => {
                            if (res.status >= 200 && res.status < 300) {
                                resolve(res.responseText);
                            } else {
                                reject(new Error('HTTP ' + res.status));
                            }
                        },
                        onerror: (err) => reject(err || new Error('网络请求失败')),
                        ontimeout: () => reject(new Error('请求超时'))
                    });
                    return;
                }
            } catch (e) {}

            const fetchOpts = { method, headers };
            if (method === 'POST' && bodyData !== undefined) {
                fetchOpts.body = bodyData;
            }
            fetch(url, fetchOpts)
                .then(r => {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.text();
                })
                .then(resolve)
                .catch(reject);
        });
    }

    function reportCopy(id) {
        if (!id) return;
        gmRequestText('POST', API_ADD_CNT_URL, JSON.stringify({ id }), 6000).catch(() => {});
    }

    // ==========================================
    // 抖音输入框与弹幕发送/回复驱动
    // ==========================================
    function normalizeSingleLineText(str) {
        return String(str || '')
            .replace(/[\r\n\u200B\u200C\u200D\uFEFF]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isElementVisible(el) {
        if (!el || !el.isConnected) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function isExcludedInputElement(el) {
        if (!el) return true;
        if (el.closest('#sb6657-panel, [role="dialog"], .semi-modal')) return true;
        const placeholder = el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || '';
        return placeholder.includes('搜索') || placeholder.includes('举报');
    }

    function getChatInput() {
        const selectors = [
            '[data-e2e="live-chatting"] [contenteditable="true"]',
            '#chatroom .webcast-chatroom___textarea [contenteditable="true"]',
            '#chatroom [contenteditable="true"].editor-kit-container',
            '#chatroom [contenteditable="true"]',
            '.webcast-chatroom___input-container [contenteditable="true"]',
            '#chatroom textarea',
            '.webcast-chatroom___textarea textarea',
            '.webcast-chatroom___input textarea',
            'textarea.sj0L4UzZ',
            'textarea[placeholder*="互动"]',
            'textarea[placeholder*="说点什么"]',
            'textarea[placeholder*="弹幕"]',
            'textarea[placeholder*="评论"]',
            'textarea[placeholder*="回车"]',
            '.pHyWCPl7 textarea',
            '.U2qEGdDQ textarea'
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (isElementVisible(el) && !isExcludedInputElement(el)) {
                return el;
            }
        }
        const anyTa = Array.from(document.querySelectorAll('textarea')).find(
            el => isElementVisible(el) && !isExcludedInputElement(el)
        );
        return anyTa || null;
    }

    function findRichTextEditorInstance(input) {
        if (!input) return null;
        try {
            const candidates = [
                input,
                input.closest('.sTr4hX9T'),
                input.closest('[data-e2e="live-chatting"]'),
                document.querySelector('[data-e2e="live-chatting"]'),
                document.getElementById('chatroom')
            ].filter(Boolean);

            const isEditorLike = (obj) => Boolean(
                obj &&
                typeof obj === 'object' &&
                typeof obj.getContentState === 'function' &&
                typeof obj.setText === 'function' &&
                typeof obj.isEmpty === 'function'
            );

            for (const el of candidates) {
                const fk = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
                if (!fk) continue;
                let fiber = el[fk];
                let steps = 0;
                while (fiber && steps < 18) {
                    const props = fiber.memoizedProps;
                    if (props) {
                        if (isEditorLike(props.editor)) return props.editor;
                        if (isEditorLike(props.value)) return props.value;
                        if (props.value && isEditorLike(props.value.editor)) return props.value.editor;
                    }
                    let hook = fiber.memoizedState;
                    let hookSteps = 0;
                    while (hook && hookSteps < 20) {
                        const st = hook.memoizedState;
                        if (isEditorLike(st)) return st;
                        if (st && typeof st === 'object') {
                            if (isEditorLike(st.editor)) return st.editor;
                            if (isEditorLike(st.current)) return st.current;
                        }
                        hook = hook.next;
                        hookSteps++;
                    }
                    let dep = fiber.dependencies?.firstContext;
                    let depSteps = 0;
                    while (dep && depSteps < 10) {
                        const cv = dep.context?._currentValue;
                        if (isEditorLike(cv)) return cv;
                        if (cv && typeof cv === 'object' && isEditorLike(cv.editor)) return cv.editor;
                        dep = dep.next;
                        depSteps++;
                    }
                    fiber = fiber.return;
                    steps++;
                }
            }
        } catch (e) {}
        return null;
    }

    function placeCaretAtEnd(el) {
        try {
            const sel = window.getSelection();
            if (!sel) return;
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {}
    }

    function readEditablePlainText(el) {
        return String(el?.innerText || el?.textContent || '')
            .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
            .replace(/\r/g, '');
    }

    function setChatInputValue(input, text) {
        if (!input) return false;
        const cleanVal = String(text ?? '').replace(/^[\r\n\u200B\uFEFF]+/, '');

        try {
            input.focus({ preventScroll: true });
        } catch (e) {
            try { input.focus(); } catch (err) {}
        }

        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
            const proto = input.tagName === 'TEXTAREA'
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

            if (nativeSetter) {
                nativeSetter.call(input, cleanVal);
            } else {
                input.value = cleanVal;
            }

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            try {
                if (input.setSelectionRange && typeof input.value === 'string') {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
            } catch (e) {}
            return true;
        }

        if (input.isContentEditable) {
            // 1. 优先调用抖音 RichTextEditor 原生 editor-kit API，保证模型单行结构与状态同步
            const editor = findRichTextEditorInstance(input);
            if (editor) {
                try {
                    if (typeof editor.reset === 'function') editor.reset();
                    editor.setText(cleanVal);
                    if (typeof editor.focusAtEnd === 'function') {
                        editor.focusAtEnd();
                    } else if (typeof editor.focus === 'function') {
                        editor.focus(true);
                    }
                    const modelText = typeof editor.getText === 'function'
                        ? String(editor.getText() || '').replace(/[\r\n\u200B]+$/, '')
                        : '';
                    if (modelText === cleanVal || readEditablePlainText(input).trim() === cleanVal.trim()) {
                        return true;
                    }
                } catch (e) {}
            }

            // 2. 全选并优先尝试原生 paste / execCommand('insertText')，防止破坏首行并生成额外换行
            try {
                const sel = window.getSelection();
                if (sel) {
                    const range = document.createRange();
                    range.selectNodeContents(input);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } catch (e) {}

            try {
                if (typeof DataTransfer === 'function' && typeof ClipboardEvent === 'function') {
                    const dt = new DataTransfer();
                    dt.setData('text/plain', cleanVal);
                    const pasteEvt = new ClipboardEvent('paste', {
                        bubbles: true,
                        cancelable: true,
                        clipboardData: dt
                    });
                    input.dispatchEvent(pasteEvt);
                    if (readEditablePlainText(input).replace(/\n+$/, '') === cleanVal) {
                        placeCaretAtEnd(input);
                        return true;
                    }
                }
            } catch (e) {}

            try {
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, cleanVal);
                if (readEditablePlainText(input).replace(/\n+$/, '') === cleanVal) {
                    placeCaretAtEnd(input);
                    return true;
                }
            } catch (e) {}

            // 3. 最终兜底：使用 textContent（不使用会生成 <br>/<div> 换行的 innerText）并移光标到末尾
            input.textContent = cleanVal;
            placeCaretAtEnd(input);
            try {
                input.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: cleanVal,
                    inputType: 'insertText'
                }));
            } catch (e) {
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return true;
        }

        return true;
    }

    function getSendButton(input) {
        const sendBtnSelectors = [
            '.webcast-chatroom___send-btn',
            '#chatroom .webcast-chatroom___send-btn',
            'button[class*="send"]',
            '[data-e2e*="send"]',
            '[aria-label*="发送"]',
            '.send-btn'
        ];
        for (const sel of sendBtnSelectors) {
            const btn = document.querySelector(sel);
            if (isElementVisible(btn)) {
                return btn;
            }
        }
        const scope = input?.closest('form, [class*="textarea"], [class*="input"]') || input?.parentElement?.parentElement;
        if (scope) {
            const candidates = Array.from(scope.querySelectorAll('button, [role="button"], span[class*="btn"]'));
            const hit = candidates.find(el => {
                if (!isElementVisible(el)) return false;
                const txt = (el.innerText || el.getAttribute('aria-label') || '').trim();
                const cls = String(el.className || '');
                return txt === '发送' || /send/i.test(cls);
            });
            if (hit) return hit;
        }
        return null;
    }

    function sendCurrentInput(input) {
        if (!input) return false;

        const enterEvents = [
            new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }),
            new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }),
            new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })
        ];
        enterEvents.forEach(evt => input.dispatchEvent(evt));

        setTimeout(() => {
            const stillHasText = input.isContentEditable
                ? Boolean(readEditablePlainText(input).trim())
                : Boolean((input.value || '').trim());
            if (!stillHasText) return;
            const sendBtn = getSendButton(input);
            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
            }
        }, 60);

        return true;
    }

    function sendBarrage(text, memeId) {
        if (!text || !text.trim()) {
            showToast('⚠️ 弹幕内容不能为空');
            return;
        }

        if (isCooldown) {
            showToast('⏳ 发送冷却中，请稍候...');
            return;
        }

        const input = getChatInput();
        if (!input) {
            showToast('❌ 未找到弹幕输入框，请先登录抖音直播间');
            return;
        }

        const cleanText = normalizeSingleLineText(text);
        if (!cleanText) {
            showToast('⚠️ 弹幕内容不能为空');
            return;
        }
        isCooldown = true;
        setChatInputValue(input, cleanText);

        setTimeout(() => {
            sendCurrentInput(input);
            showToast(`✔️ 弹幕发送中：${cleanText.length > 18 ? cleanText.slice(0, 18) + '...' : cleanText}`);
            if (memeId) reportCopy(memeId);
            setTimeout(() => {
                isCooldown = false;
            }, 3000);
        }, 120);
    }

    function fillReplyToChatInput(sender, content) {
        const cleanContent = normalizeSingleLineText(content);
        if (!cleanContent) {
            showToast('⚠️ 弹幕内容不能为空');
            return;
        }

        const input = getChatInput();
        if (!input) {
            showToast('❌ 未找到弹幕输入框，请先登录抖音直播间');
            return;
        }

        const senderId = normalizeSingleLineText(sender) || '观众';
        const replyText = `@${senderId}：${cleanContent}`;
        setChatInputValue(input, replyText);
        showToast(`💬 已放入回复内容：@${senderId}`);
    }

    // ==========================================
    // 烂梗 API 交互（默认最新50条 + 搜索 + 标签筛选）
    // ==========================================
    function searchMemes(keyword, callback) {
        const postData = JSON.stringify({
            D: '油猴',
            barrage: keyword,
            QueryBarrage: keyword
        });
        gmRequestText('POST', API_QUERY_URL, postData, 10000)
            .then((resText) => {
                const res = JSON.parse(resText);
                if ((res.code === 200 || res.code === '200') && Array.isArray(res.data)) {
                    callback(null, res.data);
                } else {
                    callback(null, []);
                }
            })
            .catch((err) => callback(err, []));
    }

    function fetchLatestMemes(tagValue, callback) {
        let url = `${API_PAGE_URL}?pageNum=1&pageSize=${DEFAULT_PAGE_SIZE}`;
        if (tagValue) {
            url += `&tags=${encodeURIComponent(tagValue)}`;
        }
        gmRequestText('GET', url, undefined, 10000)
            .then((resText) => {
                const res = JSON.parse(resText);
                const list = Array.isArray(res?.data?.list)
                    ? res.data.list
                    : (Array.isArray(res?.data) ? res.data : []);
                if (res.code === 200 || res.code === '200') {
                    callback(null, list);
                } else {
                    callback(null, []);
                }
            })
            .catch((err) => callback(err, []));
    }

    function fetchDictTags() {
        gmRequestText('GET', API_DICT_LIST_URL, undefined, 8000)
            .then((resText) => {
                const res = JSON.parse(resText);
                if (res.code === 200 && Array.isArray(res.data)) {
                    tagList = res.data;
                    renderTagsBar();
                }
            })
            .catch(() => {});
    }

    // ==========================================
    // 功能面板 UI 构建
    // ==========================================
    let panelEl = null;
    let mainViewEl = null;
    let sponsorViewEl = null;
    let sponsorBtnEl = null;
    let listStatusEl = null;
    let listContainerEl = null;
    let tagsBarEl = null;
    let searchInputEl = null;

    function switchToMainView() {
        if (!mainViewEl || !sponsorViewEl) return;
        sponsorViewEl.style.display = 'none';
        mainViewEl.style.display = 'flex';
        if (sponsorBtnEl) sponsorBtnEl.classList.remove('active');
    }

    function toggleSponsorView(e) {
        if (e) e.stopPropagation();
        if (!mainViewEl || !sponsorViewEl) return;
        const showingSponsor = sponsorViewEl.style.display === 'flex';
        if (showingSponsor) {
            switchToMainView();
        } else {
            mainViewEl.style.display = 'none';
            sponsorViewEl.style.display = 'flex';
            if (sponsorBtnEl) sponsorBtnEl.classList.add('active');
        }
    }

    function createPanel() {
        if (panelEl) {
            ensureInOverlayRoot(panelEl);
            return panelEl;
        }

        panelEl = document.createElement('div');
        panelEl.id = 'sb6657-panel';
        panelEl.innerHTML = `
            <div class="sb6657-panel-header" id="sb6657-panel-header">
                <div class="sb6657-panel-title">
                    <img src="${BRAND_ICON_URL}" alt="LOGO">
                    <span>sb6657玩机器烂梗（抖音版）</span>
                </div>
                <div class="sb6657-header-actions">
                    <button class="sb6657-sponsor-btn" id="sb6657-btn-sponsor" type="button" title="赞赏支持 / 为 sb6657 充电">
                        <svg viewBox="0 0 1024 1024" aria-hidden="true">
                            <path d="M395.765 586.57H224.032c-22.421 0-37.888-22.442-29.909-43.38L364.768 95.275A32 32 0 0 1 394.667 74.667h287.957c22.72 0 38.208 23.018 29.632 44.064l-99.36 243.882h187.05c27.51 0 42.187 32.427 24.043 53.099l-458.603 522.56c-22.293 25.408-63.626 3.392-54.976-29.28l85.355-322.422z"></path>
                        </svg>
                        <span>充电赞赏</span>
                    </button>
                    <button class="sb6657-icon-btn" id="sb6657-btn-close" type="button" title="关闭面板 (Esc)">✕</button>
                </div>
            </div>

            <div class="sb6657-main-view" id="sb6657-main-view">
                <div class="sb6657-search-area">
                    <input type="text" class="sb6657-search-input" id="sb6657-search-input" placeholder="输入关键词搜索..." />
                    <button class="sb6657-search-btn" id="sb6657-search-btn" type="button">搜索</button>
                </div>
                <div class="sb6657-tags-bar" id="sb6657-tags-bar"></div>
                <div class="sb6657-list-status" id="sb6657-list-status">
                    <span>🔥 正在加载最新 50 条烂梗...</span>
                </div>
                <div class="sb6657-list-container" id="sb6657-list-container"></div>
            </div>

            <div class="sb6657-sponsor-view" id="sb6657-sponsor-view">
                <div class="sb6657-sponsor-top">
                    <button class="sb6657-back-btn" id="sb6657-sponsor-back" type="button">← 返回烂梗</button>
                    <div class="sb6657-sponsor-tabs">
                        <button class="sb6657-sponsor-tab active" data-channel="wx" type="button">微信赞赏码</button>
                        <button class="sb6657-sponsor-tab" data-channel="alipay" type="button">支付宝赞赏码</button>
                    </div>
                </div>
                <div class="sb6657-sponsor-qr-box">
                    <img id="sb6657-sponsor-qr-img" src="${SPONSOR_WX_QR}" alt="赞赏码" />
                </div>
                <div class="sb6657-sponsor-desc" id="sb6657-sponsor-desc">
                    微信扫码赞赏支持 sb6657（抖音版），感谢水友充电！
                </div>
                <div class="sb6657-sponsor-links">
                    <button class="sb6657-sponsor-open-btn" id="sb6657-sponsor-open-img" type="button">新窗口查看原图</button>
                    <button class="sb6657-sponsor-open-btn secondary" id="sb6657-sponsor-open-web" type="button">访问 sb6657.cn</button>
                </div>
            </div>
        `;

        ensureInOverlayRoot(panelEl);

        mainViewEl = panelEl.querySelector('#sb6657-main-view');
        sponsorViewEl = panelEl.querySelector('#sb6657-sponsor-view');
        sponsorBtnEl = panelEl.querySelector('#sb6657-btn-sponsor');
        listStatusEl = panelEl.querySelector('#sb6657-list-status');
        listContainerEl = panelEl.querySelector('#sb6657-list-container');
        tagsBarEl = panelEl.querySelector('#sb6657-tags-bar');
        searchInputEl = panelEl.querySelector('#sb6657-search-input');

        const searchBtn = panelEl.querySelector('#sb6657-search-btn');
        const closeBtn = panelEl.querySelector('#sb6657-btn-close');
        const sponsorBackBtn = panelEl.querySelector('#sb6657-sponsor-back');
        const sponsorQrImg = panelEl.querySelector('#sb6657-sponsor-qr-img');
        const sponsorDesc = panelEl.querySelector('#sb6657-sponsor-desc');
        const sponsorOpenImgBtn = panelEl.querySelector('#sb6657-sponsor-open-img');
        const sponsorOpenWebBtn = panelEl.querySelector('#sb6657-sponsor-open-web');
        const sponsorTabs = panelEl.querySelectorAll('.sb6657-sponsor-tab');

        let currentSponsorUrl = SPONSOR_WX_QR;

        sponsorTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                sponsorTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const ch = tab.getAttribute('data-channel');
                if (ch === 'alipay') {
                    currentSponsorUrl = SPONSOR_ALIPAY_QR;
                    sponsorDesc.innerText = '支付宝扫码赞赏支持 sb6657（抖音版），感谢水友充电！';
                } else {
                    currentSponsorUrl = SPONSOR_WX_QR;
                    sponsorDesc.innerText = '微信扫码赞赏支持 sb6657（抖音版），感谢水友充电！';
                }
                sponsorQrImg.src = currentSponsorUrl;
            });
        });

        sponsorQrImg.addEventListener('error', () => {
            sponsorDesc.innerText = '当前页面图片受限，请点击下方「新窗口查看原图」打开赞赏码';
        });

        sponsorOpenImgBtn.addEventListener('click', () => window.open(currentSponsorUrl, '_blank'));
        sponsorOpenWebBtn.addEventListener('click', () => window.open(SPONSOR_HOME_URL, '_blank'));
        sponsorBackBtn.addEventListener('click', switchToMainView);
        sponsorBtnEl.addEventListener('click', toggleSponsorView);

        // 防止在面板内按键或点击冒泡给抖音播放器快捷键/暂停
        panelEl.addEventListener('keydown', (e) => e.stopPropagation());
        panelEl.addEventListener('keyup', (e) => e.stopPropagation());
        panelEl.addEventListener('keypress', (e) => e.stopPropagation());
        panelEl.addEventListener('mousedown', (e) => e.stopPropagation());
        panelEl.addEventListener('click', (e) => e.stopPropagation());

        searchBtn.addEventListener('click', doSearch);
        searchInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        closeBtn.addEventListener('click', togglePanel);

        setupDraggable(panelEl, panelEl.querySelector('#sb6657-panel-header'));
        if (tagList.length) renderTagsBar();
        if (!hasLoadedDefaultMemes) {
            loadDefaultMemes('');
        }

        return panelEl;
    }

    function updateListStatus(text, showResetBtn = false) {
        if (!listStatusEl) return;
        listStatusEl.innerHTML = '';
        const span = document.createElement('span');
        span.innerText = text;
        listStatusEl.appendChild(span);

        if (showResetBtn) {
            const btn = document.createElement('button');
            btn.className = 'sb6657-reset-link';
            btn.type = 'button';
            btn.innerText = '返回最新50条';
            btn.addEventListener('click', () => {
                if (searchInputEl) searchInputEl.value = '';
                activeTagValue = '';
                renderTagsBar();
                loadDefaultMemes('');
            });
            listStatusEl.appendChild(btn);
        }
    }

    function renderMemeList(list, emptyText) {
        if (!listContainerEl) return;
        listContainerEl.innerHTML = '';

        if (!list || !list.length) {
            listContainerEl.innerHTML = `<div style="text-align:center;padding:32px 12px;color:#9ca3af;font-size:13px;">${emptyText}</div>`;
            return;
        }

        list.forEach(item => {
            if (!item || !item.barrage) return;
            const card = document.createElement('div');
            card.className = 'sb6657-meme-card';

            const textSpan = document.createElement('span');
            textSpan.className = 'sb6657-meme-text';
            textSpan.innerText = item.barrage;
            textSpan.title = '点击直接复制此烂梗';
            textSpan.addEventListener('click', () => copyText(item.barrage, item.id));

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'sb6657-meme-actions';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'sb6657-btn-copy';
            copyBtn.type = 'button';
            copyBtn.innerText = '复制';
            copyBtn.addEventListener('click', () => copyText(item.barrage, item.id));

            const sendBtn = document.createElement('button');
            sendBtn.className = 'sb6657-btn-send';
            sendBtn.type = 'button';
            sendBtn.innerText = '发送';
            sendBtn.title = '放入输入框并立即发送';
            sendBtn.addEventListener('click', () => sendBarrage(item.barrage, item.id));

            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(sendBtn);

            card.appendChild(textSpan);
            card.appendChild(actionsDiv);
            listContainerEl.appendChild(card);
        });
    }

    function loadDefaultMemes(tagValue = '', tagLabel = '') {
        if (!listContainerEl) return;
        hasLoadedDefaultMemes = true;
        activeTagValue = tagValue || '';
        updateListStatus(
            tagLabel ? `🏷️ 正在加载「${tagLabel}」最新 ${DEFAULT_PAGE_SIZE} 条...` : `🔥 正在加载最新 ${DEFAULT_PAGE_SIZE} 条烂梗...`,
            Boolean(tagValue)
        );
        listContainerEl.innerHTML = `<div style="text-align:center;padding:30px;color:#9ca3af;font-size:13px;">⏳ 正在拉取最新烂梗列表...</div>`;

        fetchLatestMemes(tagValue, (err, list) => {
            if (err) {
                updateListStatus('⚠️ 拉取最新烂梗失败，请稍后重试', Boolean(tagValue));
                renderMemeList([], '加载失败，请检查网络或重新打开面板重试');
                return;
            }
            if (tagLabel) {
                updateListStatus(`🏷️ 「${tagLabel}」最新 ${list.length} 条烂梗`, true);
            } else {
                updateListStatus(`🔥 默认展示最新 ${list.length} 条烂梗`, false);
            }
            renderMemeList(list, '暂无烂梗数据');
        });
    }

    function renderTagsBar() {
        if (!tagsBarEl || !tagList.length) return;
        tagsBarEl.innerHTML = '';
        tagList.slice(0, 12).forEach(item => {
            const tagBtn = document.createElement('span');
            const val = String(item.dictValue || item.dictLabel || '').trim();
            const label = item.dictLabel || val;
            tagBtn.className = 'sb6657-tag-item' + (activeTagValue && activeTagValue === val ? ' active' : '');
            tagBtn.innerText = label;
            tagBtn.addEventListener('click', () => {
                if (searchInputEl) searchInputEl.value = '';
                if (activeTagValue === val) {
                    activeTagValue = '';
                    renderTagsBar();
                    loadDefaultMemes('');
                } else {
                    activeTagValue = val;
                    renderTagsBar();
                    loadDefaultMemes(val, label);
                }
            });
            tagsBarEl.appendChild(tagBtn);
        });
    }

    function doSearch() {
        if (!searchInputEl) return;
        const query = searchInputEl.value.trim();
        if (!query) {
            activeTagValue = '';
            renderTagsBar();
            loadDefaultMemes('');
            return;
        }

        activeTagValue = '';
        renderTagsBar();
        updateListStatus(`🔍 正在搜索「${query}」...`, true);
        listContainerEl.innerHTML = `<div style="text-align:center;padding:30px;color:#9ca3af;font-size:13px;">🔍 正在检索烂梗中...</div>`;

        searchMemes(query, (err, list) => {
            if (err) {
                updateListStatus(`⚠️ 搜索「${query}」失败`, true);
                renderMemeList([], '请求失败，请检查网络连接后重试');
                return;
            }
            updateListStatus(`🔍 「${query}」共找到 ${list.length} 条结果`, true);
            renderMemeList(list, `未找到与「${query}」相关的弹幕，换个词试试吧~`);
        });
    }

    function togglePanel(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const panel = createPanel();
        ensureInOverlayRoot(panel);

        if (panel.style.display === 'flex') {
            panel.style.display = 'none';
        } else {
            switchToMainView();
            panel.style.display = 'flex';
            if (!hasLoadedDefaultMemes) {
                loadDefaultMemes('');
            }
            // 修正若窗口/全屏变化导致面板跑出可视范围
            const rect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            if (rect.right > vw || rect.left < 0 || rect.bottom > vh || rect.top < 0) {
                panel.style.left = `${Math.max(12, Math.min(vw - panel.offsetWidth - 20, vw - 468))}px`;
                panel.style.top = `${Math.max(12, Math.min(vh - panel.offsetHeight - 20, 90))}px`;
                panel.style.right = 'auto';
            }
            if (searchInputEl) {
                setTimeout(() => searchInputEl.focus(), 60);
            }
        }
    }

    function setupDraggable(target, handle, onDragStateChange) {
        let isDragging = false;
        let hasMoved = false;
        let startX, startY, origX, origY;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') && handle !== target) return;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = target.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.hypot(dx, dy) > 4) {
                hasMoved = true;
            }
            target.style.left = `${Math.max(8, Math.min(window.innerWidth - target.offsetWidth - 8, origX + dx))}px`;
            target.style.top = `${Math.max(8, Math.min(window.innerHeight - target.offsetHeight - 8, origY + dy))}px`;
            target.style.right = 'auto';
            target.style.bottom = 'auto';
        }

        function onMouseUp() {
            isDragging = false;
            if (onDragStateChange) onDragStateChange(hasMoved);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    // ==========================================
    // 页面图标按钮挂载 (悬浮 sb6657 图标 + 清晰度旁“玩烂梗”按钮)
    // ==========================================
    function mountIconButtons() {
        // 1. 悬浮吸附 sb6657 图标按钮
        let ball = document.getElementById('sb6657-douyin-ball');
        if (!ball) {
            ball = document.createElement('div');
            ball.id = 'sb6657-douyin-ball';
            ball.title = 'sb6657玩机器烂梗（抖音版）(点击打开/关闭功能面板)';
            ball.innerHTML = `
                <img src="${BRAND_ICON_URL}" alt="sb6657" />
                <span class="pulse-badge"></span>
            `;
            let skipNextClick = false;
            setupDraggable(ball, ball, (moved) => {
                skipNextClick = moved;
                if (moved) {
                    setTimeout(() => { skipNextClick = false; }, 120);
                }
            });
            ball.addEventListener('mousedown', (e) => e.stopPropagation());
            ball.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (skipNextClick) return;
                togglePanel(e);
            });
        }
        ensureInOverlayRoot(ball);

        // 2. 挂载到所有可见抖音播放器底部控制栏清晰度旁边（修正 pointer-events: none 穿透问题）
        const controlsRights = document.querySelectorAll('.douyin-player-controls-right');
        controlsRights.forEach((controlsRight) => {
            if (controlsRight.querySelector('.sb6657-ctrl-slot')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'sb6657-ctrl-slot';

            const btn = document.createElement('button');
            btn.className = 'sb6657-toolbar-btn';
            btn.type = 'button';
            btn.innerHTML = `<img src="${BRAND_ICON_URL}" /><span>玩烂梗</span>`;
            btn.title = '打开 sb6657玩机器烂梗（抖音版）面板';

            const blockBubble = (e) => {
                e.stopPropagation();
            };
            btn.addEventListener('pointerdown', blockBubble);
            btn.addEventListener('mousedown', blockBubble);
            btn.addEventListener('mouseup', blockBubble);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePanel(e);
            });

            wrapper.appendChild(btn);

            // controlsRight 为 flex-direction: row-reverse，插在清晰度后面在视觉上正好紧邻清晰度按钮左侧
            const qualityEl = controlsRight.querySelector('.QualitySwitchNewPlugin');
            const qualitySlot = qualityEl ? qualityEl.closest('slot') || qualityEl : null;
            if (qualitySlot && qualitySlot.parentElement === controlsRight) {
                controlsRight.insertBefore(wrapper, qualitySlot.nextSibling);
            } else {
                controlsRight.appendChild(wrapper);
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        ensureInOverlayRoot(document.getElementById('sb6657-douyin-ball'));
        ensureInOverlayRoot(document.getElementById('sb6657-panel'));
        ensureInOverlayRoot(document.getElementById('sb6657-toast'));
        ensureInOverlayRoot(document.getElementById('sb6657-danmu-highlight-box'));
        ensureInOverlayRoot(document.getElementById('sb6657-danmu-actions'));
    });

    // ==========================================
    // 原生弹幕内容与发送者信息提取
    // ==========================================
    function extractSenderFromMsgPayload(msg) {
        const u = msg?.payload?.user;
        if (!u || typeof u !== 'object') return '';
        return normalizeSingleLineText(u.nickname || u.desensitized_nickname || u.display_id || u.short_id || u.id_str || u.id || '');
    }

    function extractTextFromMsgPayload(msg) {
        const payload = msg?.payload;
        if (!payload) return '';
        if (payload.content && (!payload.rtf_content_v2 || !Array.isArray(payload.rtf_content_v2.pieces))) {
            return normalizeSingleLineText(payload.content);
        }
        if (payload.rtf_content_v2 && Array.isArray(payload.rtf_content_v2.pieces)) {
            let text = '';
            payload.rtf_content_v2.pieces.forEach(p => {
                if (p.string_value) {
                    text += p.string_value;
                } else if (p.image_value) {
                    const url = p.image_value?.image?.url_list?.[0];
                    if (url && emojiUrlToNameMap.has(url)) {
                        text += emojiUrlToNameMap.get(url);
                    }
                } else if (p.user_value && p.user_value.user) {
                    text += `${p.user_value.left_additional_content || ''}${p.user_value.user.nickname || ''}${p.user_value.right_additional_content || ''}`;
                }
            });
            if (text) return normalizeSingleLineText(text);
        }
        return normalizeSingleLineText(payload.content || '');
    }

    function findSenderFromChatDom(text) {
        if (!text) return '';
        try {
            const chatroom = document.getElementById('chatroom');
            if (!chatroom) return '';
            const items = chatroom.querySelectorAll('.webcast-chatroom___item, [data-danmu-id]');
            for (let i = items.length - 1; i >= 0; i--) {
                const el = items[i];
                const raw = (el.innerText || '').trim();
                if (!raw || !raw.includes(text)) continue;

                // 尝试从 React Fiber 直接读精确 user 对象
                const fk = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
                if (fk) {
                    let f = el[fk];
                    let steps = 0;
                    while (f && steps < 6) {
                        const msg = f.memoizedProps?.message || f.memoizedProps?.item || f.memoizedProps?.data;
                        const s = msg?.payload?.user?.nickname || msg?.payload?.user?.desensitized_nickname;
                        if (s) return normalizeSingleLineText(s);
                        f = f.return;
                        steps++;
                    }
                }

                // 文本兜底解析：<昵称>：<正文>
                const clean = raw.replace(/\s+/g, ' ').trim();
                const pos = clean.lastIndexOf(text);
                if (pos > 0) {
                    const before = clean.slice(0, pos).replace(/[：:]\s*$/, '').trim();
                    const tokens = before.split(' ').filter(Boolean);
                    const lastToken = tokens[tokens.length - 1] || '';
                    if (lastToken && !/^\d+$/.test(lastToken)) {
                        return normalizeSingleLineText(lastToken);
                    }
                }
            }
        } catch (e) {}
        return '';
    }

    function extractBarrageInfo(options) {
        if (!options) return null;

        // 优先匹配 ChatMessage / ScreenChatMessage / PrivilegeScreenChatMessage 记录的原始消息 ID
        if (options.id) {
            const rawId = String(options.id);
            if (msgMetaMap.has(rawId)) {
                return msgMetaMap.get(rawId);
            }
            // is_mock 情况会拼接 13 位时间戳后缀
            if (rawId.length > 15) {
                const maybePrefix = rawId.slice(0, rawId.length - 13);
                if (msgMetaMap.has(maybePrefix)) {
                    return msgMetaMap.get(maybePrefix);
                }
            }
        }

        // 忽略礼物弹幕（GiftMessage 默认字体粉色 #ff4471）
        if (options.color === '#ff4471') return null;

        // 从 content 结构化数组递归提取文本（并反查表情文字）
        const pieces = [];
        function walk(node) {
            if (!node) return;
            if (Array.isArray(node)) {
                node.forEach(walk);
                return;
            }
            if (node.type === 'text' && node.text) {
                pieces.push(node.text);
            } else if (node.type === 'image' && node.src && emojiUrlToNameMap.has(node.src)) {
                pieces.push(emojiUrlToNameMap.get(node.src));
            } else if (Array.isArray(node.content)) {
                walk(node.content);
            }
        }
        walk(options.content);

        let text = normalizeSingleLineText(pieces.join(''));
        if (!text) return null;

        let sender = '';
        // 特权弹幕兜底：首个元素常为 `${nickname}:  `
        const firstTextNode = Array.isArray(options.content)
            ? (options.content[0]?.type === 'text' ? options.content[0].text : options.content[0]?.content?.[0]?.text)
            : '';
        if (typeof firstTextNode === 'string' && /:\s{2}$/.test(firstTextNode)) {
            sender = normalizeSingleLineText(firstTextNode.replace(/:\s{2}$/, ''));
            if (text.startsWith(firstTextNode.trim())) {
                text = normalizeSingleLineText(text.slice(firstTextNode.trim().length));
            }
        }

        // 处理 ScreenChatMessage 的“管理”前缀
        if (text.startsWith('管理') && Array.isArray(options.content) && options.content[0]?.content?.[0]?.text === '管理') {
            text = normalizeSingleLineText(text.slice(2));
        }

        if (!text) return null;
        if (!sender) {
            sender = findSenderFromChatDom(text);
        }
        return { text: normalizeSingleLineText(text), sender: normalizeSingleLineText(sender) };
    }

    function hookDanmuMessageStore() {
        const tryHook = () => {
            const cps = document.querySelectorAll('.CanvasDanmakuPlugin');
            let hookedAny = false;
            for (const cp of cps) {
                const fk = Object.keys(cp).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
                if (!fk) continue;
                let fiber = cp[fk];
                let store = null;
                let steps = 0;
                while (fiber && steps < 10) {
                    if (fiber.memoizedProps && fiber.memoizedProps.store) {
                        store = fiber.memoizedProps.store;
                        break;
                    }
                    fiber = fiber.return;
                    steps++;
                }
                if (!store) continue;

                if (!emojiReverseReady && store.roomStore && store.roomStore.emojiReflex) {
                    emojiReverseReady = true;
                    const reflex = store.roomStore.emojiReflex;
                    Object.keys(reflex).forEach(k => {
                        if (reflex[k]) emojiUrlToNameMap.set(reflex[k], k);
                    });
                }

                const msgBus = store.singletonStore && store.singletonStore.message;
                if (msgBus && !msgBus._sb6657_msg_mapped) {
                    msgBus._sb6657_msg_mapped = true;
                    const recordList = (list) => {
                        if (!Array.isArray(list)) return;
                        list.forEach(m => {
                            if (!m || !m.msg_id) return;
                            const txt = extractTextFromMsgPayload(m);
                            const sender = extractSenderFromMsgPayload(m);
                            if (txt) {
                                msgMetaMap.set(String(m.msg_id), { text: txt, sender });
                                if (msgMetaMap.size > 800) {
                                    const firstKey = msgMetaMap.keys().next().value;
                                    msgMetaMap.delete(firstKey);
                                }
                            }
                        });
                    };
                    msgBus.on('ChatMessage', recordList);
                    msgBus.on('ScreenChatMessage', recordList);
                    msgBus.on('PrivilegeScreenChatMessage', recordList);
                }
                if (msgBus && msgBus._sb6657_msg_mapped) {
                    hookedAny = true;
                }
            }
            return hookedAny;
        };

        if (!tryHook()) {
            const timer = setInterval(() => {
                if (tryHook()) clearInterval(timer);
            }, 250);
        }
    }

    // ==========================================
    // 原生飘屏弹幕（Canvas 主线程 P 实例）：悬停即停 + 显示 +1 与 回复
    // ==========================================
    let highlightBoxEl = null;
    let danmuActionsEl = null;
    let activePausedBarrage = null;
    let activeChannelIdx = -1;
    let activeText = '';
    let activeSender = '';
    let activeCanvasEl = null;
    let activeInstance = null;
    let lastMouseX = -9999;
    let lastMouseY = -9999;
    let rafTrackId = null;

    function getHighlightBox() {
        if (!highlightBoxEl) {
            highlightBoxEl = document.createElement('div');
            highlightBoxEl.id = 'sb6657-danmu-highlight-box';
        }
        ensureInOverlayRoot(highlightBoxEl);
        return highlightBoxEl;
    }

    function getDanmuActionsBar() {
        if (!danmuActionsEl) {
            danmuActionsEl = document.createElement('div');
            danmuActionsEl.id = 'sb6657-danmu-actions';

            const plus1Btn = document.createElement('button');
            plus1Btn.id = 'sb6657-plus1-btn';
            plus1Btn.className = 'sb6657-danmu-action-btn';
            plus1Btn.type = 'button';
            plus1Btn.innerText = '+1';
            plus1Btn.title = '立即发送这条弹幕 (+1)';

            const replyBtn = document.createElement('button');
            replyBtn.id = 'sb6657-reply-btn';
            replyBtn.className = 'sb6657-danmu-action-btn';
            replyBtn.type = 'button';
            replyBtn.innerText = '回复';
            replyBtn.title = '填入 @发送者ID：发送内容 到聊天框';

            const stopEvt = (e) => e.stopPropagation();
            danmuActionsEl.addEventListener('pointerdown', stopEvt);
            danmuActionsEl.addEventListener('mousedown', stopEvt);
            danmuActionsEl.addEventListener('mouseup', stopEvt);
            danmuActionsEl.addEventListener('click', stopEvt);

            plus1Btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const text = activeText;
                unlockPausedBarrage();
                if (text) {
                    sendBarrage(text);
                }
            });

            replyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const sender = activeSender;
                const text = activeText;
                unlockPausedBarrage();
                if (text) {
                    fillReplyToChatInput(sender, text);
                }
            });

            danmuActionsEl.addEventListener('mouseleave', () => {
                setTimeout(() => checkPointerStillOverActive(), 40);
            });

            danmuActionsEl.appendChild(plus1Btn);
            danmuActionsEl.appendChild(replyBtn);
        }
        ensureInOverlayRoot(danmuActionsEl);
        return danmuActionsEl;
    }

    function findMainThreadDanmakuManager() {
        const cps = document.querySelectorAll('.CanvasDanmakuPlugin');
        for (const cp of cps) {
            const canvas = cp.querySelector('canvas');
            if (canvas) {
                const r = canvas.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) continue;
            }
            const fk = Object.keys(cp).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
            if (!fk) continue;
            const compFiber = cp[fk]?.return;
            let st = compFiber?.memoizedState;
            while (st) {
                const val = st.memoizedState;
                if (val && typeof val === 'object' && 'current' in val && val.current && val.current.danmakuManagerInMainThread) {
                    return val.current;
                }
                st = st.next;
            }
        }
        return null;
    }

    function ensureBarrageProtoHooked(barrage) {
        if (!barrage) return;
        const proto = Object.getPrototypeOf(barrage);
        if (proto && !proto._sb6657_move_hooked) {
            proto._sb6657_move_hooked = true;
            const origMove = proto.move;
            proto.move = function () {
                if (this._sb6657_paused) {
                    return;
                }
                return origMove.apply(this, arguments);
            };
        }
    }

    function getBarrageScreenRect(barrage, chIdx, inst, canvas) {
        if (!barrage || !inst || !canvas) return null;
        const canvasRect = canvas.getBoundingClientRect();
        if (!canvasRect.width || !canvasRect.height || !canvas.width || !canvas.height) return null;

        const scaleX = canvasRect.width / canvas.width;
        const scaleY = canvasRect.height / canvas.height;
        const pxLeft = canvas.width - barrage.deltaX;
        const pxTop = chIdx * inst.channelHeightDpr + 2;
        const pxW = barrage.size?.widthWithDpr || 0;
        const pxH = barrage.size?.heightWithDpr || 0;
        if (!pxW || !pxH) return null;

        return {
            left: canvasRect.left + pxLeft * scaleX,
            top: canvasRect.top + pxTop * scaleY,
            width: pxW * scaleX,
            height: pxH * scaleY,
            canvasRect
        };
    }

    function positionOverlayForBarrage(rect) {
        const box = getHighlightBox();
        const bar = getDanmuActionsBar();

        box.style.left = `${rect.left - 3}px`;
        box.style.top = `${rect.top - 2}px`;
        box.style.width = `${rect.width + 6}px`;
        box.style.height = `${rect.height + 4}px`;
        box.style.display = 'block';

        // 先显示以拿到真实宽度
        bar.style.display = 'inline-flex';
        const barHeight = bar.offsetHeight || 28;
        const barWidth = bar.offsetWidth || 98;

        let barLeft = rect.left + rect.width + 6;
        let barTop = rect.top + (rect.height - barHeight) / 2;

        if (barLeft + barWidth > rect.canvasRect.right - 8) {
            barLeft = Math.max(rect.canvasRect.left + 8, rect.left - barWidth - 6);
        }
        if (barTop < 6) {
            barTop = rect.top + rect.height + 4;
        }

        bar.style.left = `${barLeft}px`;
        bar.style.top = `${barTop}px`;
    }

    function lockBarrage(barrage, chIdx, info, inst, canvas, rect) {
        if (activePausedBarrage && activePausedBarrage !== barrage) {
            activePausedBarrage._sb6657_paused = false;
        }
        ensureBarrageProtoHooked(barrage);
        barrage._sb6657_paused = true;

        activePausedBarrage = barrage;
        activeChannelIdx = chIdx;
        activeText = info.text;
        activeSender = info.sender || '';
        activeInstance = inst;
        activeCanvasEl = canvas;

        positionOverlayForBarrage(rect);
        startOverlaySyncLoop();
    }

    function unlockPausedBarrage() {
        if (activePausedBarrage) {
            activePausedBarrage._sb6657_paused = false;
            activePausedBarrage = null;
        }
        activeChannelIdx = -1;
        activeText = '';
        activeSender = '';
        if (highlightBoxEl) highlightBoxEl.style.display = 'none';
        if (danmuActionsEl) danmuActionsEl.style.display = 'none';
        if (rafTrackId) {
            cancelAnimationFrame(rafTrackId);
            rafTrackId = null;
        }
    }

    function startOverlaySyncLoop() {
        if (rafTrackId) return;
        const tick = () => {
            rafTrackId = null;
            if (!activePausedBarrage || !activeInstance || !activeCanvasEl) {
                unlockPausedBarrage();
                return;
            }
            if (activePausedBarrage.isExpired || !activePausedBarrage.bookedChannel) {
                unlockPausedBarrage();
                return;
            }
            const rect = getBarrageScreenRect(activePausedBarrage, activeChannelIdx, activeInstance, activeCanvasEl);
            if (!rect) {
                unlockPausedBarrage();
                return;
            }
            positionOverlayForBarrage(rect);
            rafTrackId = requestAnimationFrame(tick);
        };
        rafTrackId = requestAnimationFrame(tick);
    }

    function isPointInSafeActiveUnion(x, y) {
        if (!activePausedBarrage || !activeInstance || !activeCanvasEl) return false;
        const rect = getBarrageScreenRect(activePausedBarrage, activeChannelIdx, activeInstance, activeCanvasEl);
        if (!rect) return false;

        // 1. 直接落在弹幕矩形（外扩 6px 容差）内
        const inBarrage =
            x >= rect.left - 6 &&
            x <= rect.left + rect.width + 6 &&
            y >= rect.top - 6 &&
            y <= rect.top + rect.height + 6;
        if (inBarrage) return true;

        // 2. 落在 [+1 | 回复] 胶囊或其与弹幕之间的桥梁热区内（保证鼠标平滑滑过去不会脱锁）
        if (danmuActionsEl && danmuActionsEl.style.display !== 'none') {
            const br = danmuActionsEl.getBoundingClientRect();
            const unionLeft = Math.min(rect.left, br.left) - 4;
            const unionRight = Math.max(rect.left + rect.width, br.right) + 6;
            const unionTop = Math.min(rect.top, br.top) - 4;
            const unionBottom = Math.max(rect.top + rect.height, br.bottom) + 4;
            if (x >= unionLeft && x <= unionRight && y >= unionTop && y <= unionBottom) {
                return true;
            }
        }
        return false;
    }

    function checkPointerStillOverActive() {
        if (!activePausedBarrage) return;
        if (!isPointInSafeActiveUnion(lastMouseX, lastMouseY)) {
            unlockPausedBarrage();
        }
    }

    function handleCanvasDanmuMouseMove(x, y, targetEl) {
        lastMouseX = x;
        lastMouseY = y;

        // 若正指在功能面板或悬浮球或控制栏按钮上，避免穿透触发视频背后弹幕
        if (targetEl && (
            targetEl.closest('#sb6657-panel') ||
            targetEl.closest('#sb6657-douyin-ball') ||
            targetEl.closest('.sb6657-ctrl-slot') ||
            targetEl.closest('.douyin-player-controls')
        )) {
            if (activePausedBarrage) unlockPausedBarrage();
            return;
        }

        // 若鼠标刚好位于 [+1 | 回复] 胶囊或其和当前弹幕的桥梁热区内，保持暂停锁定
        if (activePausedBarrage && isPointInSafeActiveUnion(x, y)) {
            return;
        }

        const manager = findMainThreadDanmakuManager();
        const inst = manager?.danmakuManagerInMainThread?.instance;
        const canvas = manager?.canvasDom;

        if (!inst || !canvas) {
            if (activePausedBarrage) unlockPausedBarrage();
            return;
        }

        const canvasRect = canvas.getBoundingClientRect();
        if (x < canvasRect.left || x > canvasRect.right || y < canvasRect.top || y > canvasRect.bottom) {
            if (activePausedBarrage) unlockPausedBarrage();
            return;
        }

        const channels = inst._channels || inst.channels || [];
        for (let chIdx = 0; chIdx < channels.length; chIdx++) {
            const ch = channels[chIdx];
            if (!Array.isArray(ch)) continue;
            for (let i = 0; i < ch.length; i++) {
                const b = ch[i];
                if (!b || (b.needDraw && !b.needDraw(chIdx))) continue;
                const rect = getBarrageScreenRect(b, chIdx, inst, canvas);
                if (!rect) continue;

                if (
                    x >= rect.left - 4 &&
                    x <= rect.left + rect.width + 4 &&
                    y >= rect.top - 4 &&
                    y <= rect.top + rect.height + 4
                ) {
                    const info = extractBarrageInfo(b.options);
                    if (!info || !info.text) continue;

                    lockBarrage(b, chIdx, info, inst, canvas, rect);
                    return;
                }
            }
        }

        if (activePausedBarrage) {
            unlockPausedBarrage();
        }
    }

    // 降级兼容：万一存在原生 DOM 飘屏弹幕元素，直接让该 DOM 弹幕停下并挂 [+1 | 回复]
    function bindNativeDomDanmuHover(el, text) {
        if (!el || el._sb6657_dom_bound || !text) return;
        el._sb6657_dom_bound = true;

        el.addEventListener('mouseenter', () => {
            el.style.animationPlayState = 'paused';
            el.style.transition = 'none';
            const rect = el.getBoundingClientRect();
            const bar = getDanmuActionsBar();
            bar.style.display = 'inline-flex';
            const barWidth = bar.offsetWidth || 98;
            bar.style.left = `${Math.min(window.innerWidth - barWidth - 10, rect.right + 6)}px`;
            bar.style.top = `${Math.max(6, rect.top + (rect.height - 28) / 2)}px`;
            activeText = text;
            activeSender = findSenderFromChatDom(text);
        });

        el.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!danmuActionsEl || !danmuActionsEl.matches(':hover')) {
                    el.style.animationPlayState = 'running';
                    if (danmuActionsEl) danmuActionsEl.style.display = 'none';
                }
            }, 120);
        });
    }

    function observeNativeDomFallback() {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.classList && (
                        node.classList.contains('XdO7mq0W') ||
                        node.classList.contains('BIDz2ikw') ||
                        node.classList.contains('SF8xNeY5') ||
                        node.hasAttribute('data-danmu-id')
                    )) {
                        const text = node.innerText?.trim();
                        if (text) bindNativeDomDanmuHover(node, text);
                    }
                }
            }
        });
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // ==========================================
    // 全局事件与启动初始化
    // ==========================================
    document.addEventListener('mousemove', (e) => {
        handleCanvasDanmuMouseMove(e.clientX, e.clientY, e.target);
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (panelEl && panelEl.style.display === 'flex') {
                panelEl.style.display = 'none';
            }
            unlockPausedBarrage();
        }
    });

    function init() {
        fetchDictTags();
        mountIconButtons();
        hookDanmuMessageStore();
        observeNativeDomFallback();

        setInterval(() => {
            mountIconButtons();
        }, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
