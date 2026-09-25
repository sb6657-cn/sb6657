// ==UserScript==
// @name         sb6657.cn斗鱼玩机器烂梗收集
// @namespace    https://sb6657.cn/
// @version      v2026.09.26.01
// @description  在斗鱼直播间 6657 添加玩烂梗弹幕搜索、快捷复制、一键发送、标签悬浮查看、在线投稿与自动更新功能
// @author       sb6657.cn
// @match        https://www.douyu.com/*
// @match        https://www.douyu.com/6657
// @match        https://www.douyu.com/topic/*
// @match        https://www.douyu.com/room/*
// @include      https://*.douyu.com/*
// @icon         https://apic.douyucdn.cn/upload/avatar_v3/202510/39e8bc3233ca412fa991a18bd024cfbc_middle.jpg
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      api.hguofichp.cn
// @connect      sb6657.cn
// @connect      hguofichp.cn
// @connect      douyu.com
// @connect      *
// @license      MIT
// @downloadURL  https://sb6657.cn/sb6657.user.js
// @updateURL    https://sb6657.cn/sb6657.user.js
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) {
        return;
    }

    const CURRENT_VERSION = 'v2026.09.26.01';
    const SCRIPT_DOWNLOAD_URL = 'https://sb6657.cn/sb6657.user.js';
    const API_QUERY_URL = 'https://api.hguofichp.cn/machine/Query';
    const API_ADD_CNT_URL = 'https://api.hguofichp.cn/machine/addCnt';
    const API_DICT_LIST_URL = 'https://api.hguofichp.cn/machine/dictList';
    const API_SUBMIT_MEME_URL = 'https://api.hguofichp.cn/machine/submission';
    const WS_URL_BASE = 'wss://api.hguofichp.cn/machine/GFPlugin/ws/';

    console.log("[sb6657.cn] 玩机器烂梗插件启动中，当前版本:", CURRENT_VERSION);

    let tagDict = {};
    let tagList = [];

    function addGlobalStyles(css) {
        let style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    const globalCss = `
        #sb6657-messageBox {
            font-size: 14px;
            position: fixed !important;
            top: 60px !important;
            left: 50% !important;
            transform: translate(-50%, 0) !important;
            background-color: #4CAF50 !important;
            color: #ffffff !important;
            padding: 8px 18px !important;
            border-radius: 8px !important;
            z-index: 999999999 !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
            transition: opacity 0.3s ease, transform 0.3s ease !important;
            pointer-events: none !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        #sb6657-update-banner {
            position: fixed !important;
            top: 16px !important;
            right: 16px !important;
            z-index: 99999998 !important;
            background: linear-gradient(135deg, #1e8e3e, #34a853) !important;
            color: #ffffff !important;
            padding: 10px 16px !important;
            border-radius: 8px !important;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25) !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            font-size: 14px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            animation: sb6657-slide-in 0.3s ease;
        }
        @keyframes sb6657-slide-in {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #sb6657-update-banner button {
            background-color: #ffffff;
            color: #1e8e3e;
            border: none;
            border-radius: 6px;
            padding: 5px 12px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        #sb6657-update-banner button:hover {
            background-color: #f1f3f4;
            transform: scale(1.03);
        }
        #sb6657-update-banner .close-btn {
            background: transparent;
            color: #ffffff;
            font-size: 16px;
            padding: 2px 6px;
            cursor: pointer;
            opacity: 0.8;
            border: none;
        }
        #sb6657-update-banner .close-btn:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.2);
        }
        .sb6657-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: #ff4d4f;
            display: none;
        }
        #sb6657-table-container ::-webkit-scrollbar {
            width: 6px;
        }
        #sb6657-table-container ::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
        }
        #sb6657-table-container ::-webkit-scrollbar-thumb:hover {
            background: #aaa;
        }
        #sb6657-tag-tooltip {
            position: fixed !important;
            display: none;
            z-index: 9999999999 !important;
            background: rgba(30, 30, 30, 0.94) !important;
            color: #ffffff !important;
            padding: 6px 12px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
            pointer-events: none !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35) !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            max-width: 320px !important;
            backdrop-filter: blur(4px) !important;
        }
        .sb6657-tag-pill {
            display: inline-block;
            padding: 3px 8px;
            margin: 3px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            background-color: #f2f3f5;
            color: #4e5969;
            border: 1px solid #e5e6eb;
            transition: all 0.15s ease;
            user-select: none;
        }
        .sb6657-tag-pill:hover {
            border-color: #4CAF50;
            color: #4CAF50;
        }
        .sb6657-tag-pill.active {
            background-color: #4CAF50 !important;
            color: #ffffff !important;
            border-color: #4CAF50 !important;
            font-weight: 600;
        }
        @keyframes sb6657-pulse {
            0% { opacity: 0.35; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.35; transform: scale(0.9); }
        }
    `;
    addGlobalStyles(globalCss);

    function cleanVer(v) {
        return String(v || '').trim().replace(/^v/i, '');
    }

    function querySelectorDeep(selector, root = document) {
        if (!root) return null;
        let found = root.querySelector(selector);
        if (found) return found;
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            if (el.shadowRoot) {
                const f = querySelectorDeep(selector, el.shadowRoot);
                if (f) return f;
            }
        }
        return null;
    }

    function showMessage(text, duration = 2200) {
        let existing = document.getElementById("sb6657-messageBox");
        if (existing) {
            existing.remove();
        }
        let messageBox = document.createElement("div");
        messageBox.id = "sb6657-messageBox";
        messageBox.innerText = text;
        const root = document.body || document.documentElement;
        if (root) {
            root.appendChild(messageBox);
        }

        setTimeout(() => {
            messageBox.style.opacity = "0";
            messageBox.style.transform = "translate(-50%, -15px)";
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, duration);
    }

    let tagTooltip = document.createElement("div");
    tagTooltip.id = "sb6657-tag-tooltip";
    (document.body || document.documentElement).appendChild(tagTooltip);

    function fetchDictList(callback) {
        const handleSuccess = (text) => {
            try {
                const res = JSON.parse(text);
                if (res.code === 200 && Array.isArray(res.data)) {
                    tagList = res.data;
                    tagDict = {};
                    res.data.forEach(item => {
                        if (item.dictValue) {
                            tagDict[String(item.dictValue).trim()] = item.dictLabel;
                        }
                    });
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            } catch (e) {
                console.error("[sb6657.cn] 解析标签字典失败:", e);
            }
        };

        try {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: API_DICT_LIST_URL,
                    headers: {
                        "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
                    },
                    timeout: 8000,
                    onload: (res) => {
                        if (res.status === 200) {
                            handleSuccess(res.responseText);
                        }
                    }
                });
                return;
            }
        } catch (e) {}

        fetch(API_DICT_LIST_URL, {
            headers: { "dpahjdoiaw": "c2I2NjU35o+S5Lu2" }
        })
        .then(r => r.text())
        .then(handleSuccess)
        .catch(() => {});
    }

    fetchDictList();

    let tableContainer = document.createElement("div");
    tableContainer.id = "sb6657-table-container";
    Object.assign(tableContainer.style, {
        fontSize: "14px",
        borderRadius: "10px",
        display: "none",
        position: "fixed",
        width: "440px",
        maxHeight: "530px",
        zIndex: "99999999",
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    });

    let onlineStatusBar = document.createElement("div");
    onlineStatusBar.id = "sb6657-online-status-bar";
    Object.assign(onlineStatusBar.style, {
        height: "26px",
        backgroundColor: "#e8f5e9",
        borderBottom: "1px solid #c8e6c9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        fontSize: "11px",
        color: "#2e7d32",
        fontWeight: "500",
        cursor: "move",
        userSelect: "none",
        flexShrink: "0"
    });
    onlineStatusBar.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4CAF50;animation:sb6657-pulse 1.8s infinite;"></span>
            插件在线: <strong id="sb6657-gf-count" style="color:#1b5e20;">--</strong> 人
        </span>
        <span style="color:#a5d6a7;">|</span>
        <span style="display:inline-flex;align-items:center;gap:5px;">
            🌐 网页在线: <strong id="sb6657-web-count" style="color:#1b5e20;">--</strong> 人
        </span>
    `;
    tableContainer.appendChild(onlineStatusBar);

    let headerBar = document.createElement("div");
    Object.assign(headerBar.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "42px",
        padding: "0 10px 0 12px",
        backgroundColor: "#f7f9fa",
        borderBottom: "1px solid #ebebeb",
        cursor: "move",
        userSelect: "none",
        flexShrink: "0"
    });
    tableContainer.appendChild(headerBar);

    let headerLeft = document.createElement("div");
    Object.assign(headerLeft.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px"
    });
    headerBar.appendChild(headerLeft);

    let titleTag = document.createElement("span");
    titleTag.innerText = "玩烂梗 6657";
    Object.assign(titleTag.style, {
        fontWeight: "700",
        fontSize: "13px",
        color: "#4CAF50",
        marginRight: "6px"
    });
    headerLeft.appendChild(titleTag);

    function createHeaderIconButton(svgPath, title, clickHandler, fill = "#389f25") {
        let btn = document.createElement("button");
        Object.assign(btn.style, {
            width: "28px",
            height: "28px",
            padding: "3px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
        });
        btn.title = title;
        btn.onmouseover = () => { btn.style.backgroundColor = "rgba(0,0,0,0.06)"; };
        btn.onmouseout = () => { btn.style.backgroundColor = "transparent"; };

        let svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgIcon.setAttribute("viewBox", "0 0 1024 1024");
        svgIcon.setAttribute("width", "18");
        svgIcon.setAttribute("height", "18");

        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", svgPath);
        path.setAttribute("fill", fill);

        svgIcon.appendChild(path);
        btn.appendChild(svgIcon);
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            clickHandler();
        });
        headerLeft.appendChild(btn);
        return btn;
    }

    createHeaderIconButton(
        "M512 128L128 448h128v448h256V640h128v256h256V448h128z",
        "访问 sb6657.cn 官网",
        () => window.open("https://sb6657.cn", '_blank'),
        "#389f25"
    );

    createHeaderIconButton(
        "M395.765 586.57H224.032c-22.421 0-37.888-22.442-29.909-43.38L364.768 95.275A32 32 0 0 1 394.667 74.667h287.957c22.72 0 38.208 23.018 29.632 44.064l-99.36 243.882h187.05c27.51 0 42.187 32.427 24.043 53.099l-458.603 522.56c-22.293 25.408-63.626 3.392-54.976-29.28l85.355-322.422z",
        "赞赏支持",
        () => window.open("https://cdn.hguofichp.cn/zfb.jpg", '_blank'),
        "#1296db"
    );

    createHeaderIconButton(
        "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-28-568h56v256h-56zm28 356c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z",
        "反馈建议 / 提交 BUG",
        () => window.open("https://www.wjx.cn/vm/rQUgnS0.aspx#", '_blank'),
        "#595959"
    );

    let updateBtn = createHeaderIconButton(
        "M705.536 328.544c-314.56-271.744-641.056 51.2-641.056 51.2 352-603.84 772.192-160 772.192-160l121.92-115.52v407.104H554.272zM318.912 695.008c314.496 271.648 641.056-51.2 641.056-51.2-352 603.808-772.192 160-772.192 160L64 919.392V548.704h406.208z",
        "检查插件更新 (当前: " + CURRENT_VERSION + ")",
        () => checkUpdate(true),
        "#0590DF"
    );

    let updateBadge = document.createElement("span");
    updateBadge.className = "sb6657-badge";
    updateBtn.appendChild(updateBadge);

    let headerRight = document.createElement("div");
    Object.assign(headerRight.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    });
    headerBar.appendChild(headerRight);

    let submitToggleBtn = document.createElement("button");
    submitToggleBtn.innerText = "📝 投稿";
    submitToggleBtn.title = "向 sb6657 烂梗库投稿新梗";
    Object.assign(submitToggleBtn.style, {
        padding: "3px 9px",
        fontSize: "12px",
        fontWeight: "600",
        color: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.08)",
        border: "1px solid #4CAF50",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.15s ease"
    });
    submitToggleBtn.onmouseover = () => { submitToggleBtn.style.backgroundColor = "rgba(76, 175, 80, 0.18)"; };
    submitToggleBtn.onmouseout = () => { submitToggleBtn.style.backgroundColor = "rgba(76, 175, 80, 0.08)"; };
    headerRight.appendChild(submitToggleBtn);

    let closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.title = "关闭面板";
    Object.assign(closeBtn.style, {
        width: "26px",
        height: "26px",
        border: "none",
        backgroundColor: "transparent",
        color: "#888",
        fontSize: "14px",
        cursor: "pointer",
        borderRadius: "4px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
    });
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = "rgba(0,0,0,0.08)"; closeBtn.style.color = "#333"; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = "transparent"; closeBtn.style.color = "#888"; };
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        tableContainer.style.display = "none";
    });
    headerRight.appendChild(closeBtn);

    let searchView = document.createElement("div");
    Object.assign(searchView.style, {
        display: "flex",
        flexDirection: "column",
        flex: "1",
        overflow: "hidden"
    });
    tableContainer.appendChild(searchView);

    let searchRow = document.createElement("div");
    Object.assign(searchRow.style, {
        padding: "8px 12px",
        backgroundColor: "#ffffff",
        display: "flex",
        gap: "8px",
        alignItems: "center",
        borderBottom: "1px solid #f0f0f0",
        flexShrink: "0"
    });
    searchView.appendChild(searchRow);

    let searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "搜索玩机器烂梗...";
    Object.assign(searchInput.style, {
        flex: "1",
        fontSize: "13px",
        padding: "6px 10px",
        boxSizing: "border-box",
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        outline: "none"
    });
    searchInput.onfocus = () => { searchInput.style.borderColor = "#4CAF50"; };
    searchInput.onblur = () => { searchInput.style.borderColor = "#d9d9d9"; };
    searchRow.appendChild(searchInput);

    let searchButton = document.createElement("button");
    searchButton.innerText = "搜索";
    Object.assign(searchButton.style, {
        fontSize: "13px",
        padding: "6px 14px",
        backgroundColor: "#4CAF50",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "500",
        flexShrink: "0"
    });
    searchButton.onmouseover = () => { searchButton.style.backgroundColor = "#43A047"; };
    searchButton.onmouseout = () => { searchButton.style.backgroundColor = "#4CAF50"; };
    searchRow.appendChild(searchButton);

    let scrollBox = document.createElement("div");
    Object.assign(scrollBox.style, {
        flex: "1",
        overflowY: "auto",
        maxHeight: "440px",
        backgroundColor: "#ffffff"
    });
    searchView.appendChild(scrollBox);

    let table = document.createElement("table");
    Object.assign(table.style, {
        fontSize: "13px",
        width: "100%",
        borderCollapse: "collapse"
    });
    scrollBox.appendChild(table);

    scrollBox.innerHTML = `
        <div id="sb6657-initial-tip" style="padding: 28px 16px; text-align: center; color: #888; font-size: 13px; line-height: 1.6;">
            💡 输入关键词即可搜索玩机器经典烂梗<br>
            <span style="font-size: 12px; color: #aaa;">鼠标悬停在烂梗上可查看标签，点击文本复制，点击【一键发送】直达直播间</span>
        </div>
    `;

    let submitView = document.createElement("div");
    Object.assign(submitView.style, {
        display: "none",
        flexDirection: "column",
        flex: "1",
        overflowY: "auto",
        maxHeight: "480px",
        padding: "14px 16px",
        backgroundColor: "#ffffff",
        boxSizing: "border-box"
    });
    tableContainer.appendChild(submitView);

    let submitTip = document.createElement("div");
    submitTip.innerHTML = `💡 欢迎投稿玩机器直播间经典烂梗，审核通过后将收录并在全平台同步展示。`;
    Object.assign(submitTip.style, {
        fontSize: "12px",
        color: "#2e7d32",
        backgroundColor: "#e8f5e9",
        padding: "8px 12px",
        borderRadius: "6px",
        marginBottom: "12px",
        lineHeight: "1.5"
    });
    submitView.appendChild(submitTip);

    let memeInputLabel = document.createElement("div");
    memeInputLabel.innerText = "烂梗内容（必填，限255字）：";
    Object.assign(memeInputLabel.style, {
        fontSize: "12px",
        fontWeight: "600",
        color: "#333",
        marginBottom: "6px"
    });
    submitView.appendChild(memeInputLabel);

    let submitTextarea = document.createElement("textarea");
    submitTextarea.placeholder = "请输入玩机器直播间烂梗内容...";
    submitTextarea.maxLength = 255;
    Object.assign(submitTextarea.style, {
        width: "100%",
        height: "80px",
        padding: "8px 10px",
        fontSize: "13px",
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        outline: "none",
        resize: "none",
        boxSizing: "border-box",
        marginBottom: "10px",
        fontFamily: "inherit"
    });
    submitTextarea.onfocus = () => { submitTextarea.style.borderColor = "#4CAF50"; };
    submitTextarea.onblur = () => { submitTextarea.style.borderColor = "#d9d9d9"; };
    submitView.appendChild(submitTextarea);

    let tagSectionHeader = document.createElement("div");
    Object.assign(tagSectionHeader.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px"
    });
    submitView.appendChild(tagSectionHeader);

    let tagSectionTitle = document.createElement("span");
    tagSectionTitle.innerText = "归类标签（必选 1~5 个）：";
    Object.assign(tagSectionTitle.style, {
        fontSize: "12px",
        fontWeight: "600",
        color: "#333"
    });
    tagSectionHeader.appendChild(tagSectionTitle);

    let tagCountIndicator = document.createElement("span");
    tagCountIndicator.innerText = "已选: 0/5";
    Object.assign(tagCountIndicator.style, {
        fontSize: "12px",
        color: "#888"
    });
    tagSectionHeader.appendChild(tagCountIndicator);

    let tagPillsBox = document.createElement("div");
    Object.assign(tagPillsBox.style, {
        display: "flex",
        flexWrap: "wrap",
        maxHeight: "150px",
        overflowY: "auto",
        padding: "6px",
        border: "1px solid #f0f0f0",
        borderRadius: "6px",
        backgroundColor: "#fafafa",
        marginBottom: "14px"
    });
    submitView.appendChild(tagPillsBox);

    let selectedSubmitTags = new Set();

    function renderSubmitTagPills() {
        tagPillsBox.innerHTML = "";
        if (!tagList || tagList.length === 0) {
            tagPillsBox.innerHTML = `<span style="padding:10px;color:#aaa;font-size:12px;">正在加载标签列表...</span>`;
            fetchDictList(renderSubmitTagPills);
            return;
        }

        tagList.forEach(t => {
            if (!t.dictValue) return;
            const val = String(t.dictValue).trim();
            const pill = document.createElement("span");
            pill.className = "sb6657-tag-pill" + (selectedSubmitTags.has(val) ? " active" : "");
            pill.innerText = t.dictLabel;
            pill.addEventListener("click", () => {
                if (selectedSubmitTags.has(val)) {
                    selectedSubmitTags.delete(val);
                    pill.classList.remove("active");
                } else {
                    if (selectedSubmitTags.size >= 5) {
                        showMessage("⚠️ 最多只能选择 5 个标签", 1500);
                        return;
                    }
                    selectedSubmitTags.add(val);
                    pill.classList.add("active");
                }
                tagCountIndicator.innerText = `已选: ${selectedSubmitTags.size}/5`;
                tagCountIndicator.style.color = selectedSubmitTags.size > 0 ? "#4CAF50" : "#888";
            });
            tagPillsBox.appendChild(pill);
        });
    }

    let submitActionsRow = document.createElement("div");
    Object.assign(submitActionsRow.style, {
        display: "flex",
        gap: "10px",
        marginTop: "auto"
    });
    submitView.appendChild(submitActionsRow);

    let confirmSubmitBtn = document.createElement("button");
    confirmSubmitBtn.innerText = "提交投稿";
    Object.assign(confirmSubmitBtn.style, {
        flex: "1",
        padding: "8px 16px",
        backgroundColor: "#4CAF50",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "13px"
    });
    confirmSubmitBtn.onmouseover = () => { confirmSubmitBtn.style.backgroundColor = "#43A047"; };
    confirmSubmitBtn.onmouseout = () => { confirmSubmitBtn.style.backgroundColor = "#4CAF50"; };
    submitActionsRow.appendChild(confirmSubmitBtn);

    let cancelSubmitBtn = document.createElement("button");
    cancelSubmitBtn.innerText = "返回搜索";
    Object.assign(cancelSubmitBtn.style, {
        padding: "8px 14px",
        backgroundColor: "#f5f5f5",
        color: "#666",
        border: "1px solid #ddd",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px"
    });
    submitActionsRow.appendChild(cancelSubmitBtn);

    let isSubmitting = false;

    function handleMemeSubmission() {
        if (isSubmitting) return;

        const text = submitTextarea.value.trim();
        if (!text) {
            showMessage("⚠️ 请输入烂梗内容", 1500);
            submitTextarea.focus();
            return;
        }

        if (selectedSubmitTags.size === 0) {
            showMessage("⚠️ 请至少选择 1 个归类标签", 1500);
            return;
        }

        if (selectedSubmitTags.size > 5) {
            showMessage("⚠️ 最多只能选择 5 个标签", 1500);
            return;
        }

        isSubmitting = true;
        confirmSubmitBtn.innerText = "正在提交...";
        confirmSubmitBtn.style.opacity = "0.7";

        const payload = JSON.stringify({
            barrage: text,
            tags: Array.from(selectedSubmitTags).join(",")
        });

        const handleSuccess = (responseText) => {
            isSubmitting = false;
            confirmSubmitBtn.innerText = "提交投稿";
            confirmSubmitBtn.style.opacity = "1";

            try {
                const res = JSON.parse(responseText);
                if (res.code === 200 || res.code === "200") {
                    showMessage("🎉 投稿成功，待管理审核！", 2500);
                    submitTextarea.value = "";
                    selectedSubmitTags.clear();
                    renderSubmitTagPills();
                    tagCountIndicator.innerText = "已选: 0/5";
                    switchToSearchView();
                } else if (res.code === 403 || res.needTurnstile) {
                    showMessage("⚠️ " + (res.msg || "需人机安全验证，请前往 sb6657.cn 官网投稿"), 3000);
                } else {
                    showMessage("❌ " + (res.msg || "投稿失败，请稍后再试"), 2500);
                }
            } catch (e) {
                showMessage("❌ 投稿响应解析异常", 2000);
            }
        };

        const handleError = (err) => {
            isSubmitting = false;
            confirmSubmitBtn.innerText = "提交投稿";
            confirmSubmitBtn.style.opacity = "1";
            console.error("[sb6657.cn] 投稿请求失败:", err);
            showMessage("❌ 投稿请求失败，网络连接异常", 2000);
        };

        try {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: API_SUBMIT_MEME_URL,
                    headers: {
                        "Content-Type": "application/json",
                        "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
                    },
                    data: payload,
                    timeout: 10000,
                    onload: (res) => {
                        handleSuccess(res.responseText);
                    },
                    onerror: handleError,
                    ontimeout: () => handleError("请求超时")
                });
                return;
            }
        } catch (e) {}

        fetch(API_SUBMIT_MEME_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
            },
            body: payload
        })
        .then(r => r.text())
        .then(handleSuccess)
        .catch(handleError);
    }

    confirmSubmitBtn.addEventListener("click", handleMemeSubmission);

    function switchToSubmitView(presetText = "") {
        searchView.style.display = "none";
        submitView.style.display = "flex";
        titleTag.innerText = "烂梗投稿";
        submitToggleBtn.innerText = "🔍 搜索";
        if (presetText) {
            submitTextarea.value = presetText;
        }
        renderSubmitTagPills();
        submitTextarea.focus();
    }

    function switchToSearchView() {
        submitView.style.display = "none";
        searchView.style.display = "flex";
        titleTag.innerText = "玩烂梗 6657";
        submitToggleBtn.innerText = "📝 投稿";
        searchInput.focus();
    }

    submitToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (submitView.style.display === "none") {
            const currentSearch = searchInput.value.trim();
            switchToSubmitView(currentSearch);
        } else {
            switchToSearchView();
        }
    });

    cancelSubmitBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        switchToSearchView();
    });

    function ensureContainerMounted() {
        const root = document.body || document.documentElement;
        if (root && !root.contains(tableContainer)) {
            root.appendChild(tableContainer);
        }
        if (root && !root.contains(tagTooltip)) {
            root.appendChild(tagTooltip);
        }
    }

    function togglePanel(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        ensureContainerMounted();
        const isHidden = tableContainer.style.display === "none" || tableContainer.style.display === "";
        if (isHidden) {
            tableContainer.style.display = "flex";
            if (!tableContainer.dataset.dragged) {
                const screenW = window.innerWidth || document.documentElement.clientWidth || 1920;
                if (screenW >= 1400) {
                    tableContainer.style.top = "160px";
                    tableContainer.style.right = "360px";
                    tableContainer.style.left = "auto";
                } else {
                    tableContainer.style.top = "140px";
                    tableContainer.style.right = "20px";
                    tableContainer.style.left = "auto";
                }
            }
            if (submitView.style.display === "flex") {
                submitTextarea.focus();
            } else {
                searchInput.focus();
            }
            console.log("[sb6657.cn] 玩烂梗面板已打开");
        } else {
            tableContainer.style.display = "none";
            tagTooltip.style.display = "none";
            console.log("[sb6657.cn] 玩烂梗面板已关闭");
        }
    }

    let toolbarBtn = null;
    function getOrCreateToolbarButton() {
        if (toolbarBtn) return toolbarBtn;

        toolbarBtn = document.createElement("button");
        toolbarBtn.id = "sb6657-meme-btn";
        toolbarBtn.type = "button";
        toolbarBtn.innerText = "玩烂梗";
        toolbarBtn.title = "点击打开/关闭玩机器烂梗搜索面板";
        Object.assign(toolbarBtn.style, {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "26px",
            lineHeight: "26px",
            padding: "0 10px",
            marginRight: "10px",
            backgroundColor: "#4CAF50",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
            transition: "background-color 0.2s, transform 0.15s",
            zIndex: "100",
            flexShrink: "0",
            userSelect: "none"
        });

        toolbarBtn.onmouseover = () => { toolbarBtn.style.backgroundColor = "#43A047"; };
        toolbarBtn.onmouseout = () => { toolbarBtn.style.backgroundColor = "#4CAF50"; };

        toolbarBtn.addEventListener("click", togglePanel, true);
        toolbarBtn.addEventListener("pointerdown", (e) => e.stopPropagation(), true);

        return toolbarBtn;
    }

    function insertToolbarButton() {
        const btn = getOrCreateToolbarButton();
        const toolbar = querySelectorDeep('.ChatToolBar__right')
                     || querySelectorDeep('.ChatToolBar')
                     || querySelectorDeep('.ChatSend-buttonWrap');

        if (toolbar) {
            if (!toolbar.contains(btn)) {
                toolbar.insertBefore(btn, toolbar.firstChild);
                console.log("[sb6657.cn] 已成功在聊天工具栏挂载【玩烂梗】按钮");
            }
            return;
        }

        const playerToolbar = document.querySelector('#js-player-toolbar') || document.querySelector('.layout-Player');
        if (playerToolbar && !playerToolbar.contains(btn)) {
            playerToolbar.insertBefore(btn, playerToolbar.firstChild);
        }
    }

    setInterval(insertToolbarButton, 1000);
    insertToolbarButton();

    (function enableDrag(container, handles) {
        let dragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;

        const onPointerDown = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            if (e.target.closest('button, svg, path, a, input, textarea')) return;

            dragging = true;
            container.dataset.dragged = "true";
            const rect = container.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;

            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
        };

        const onPointerMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.style.left = (startLeft + dx) + 'px';
            container.style.top  = (startTop + dy) + 'px';
            container.style.right = 'auto';
        };

        const stopDrag = () => { dragging = false; };

        handles.forEach(handle => {
            if (!handle) return;
            handle.addEventListener('pointerdown', onPointerDown);
            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', stopDrag);
            handle.addEventListener('pointercancel', stopDrag);
        });
    })(tableContainer, [onlineStatusBar, headerBar]);

    function reportCopy(id) {
        if (!id) return;
        try {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: API_ADD_CNT_URL,
                    headers: {
                        "Content-Type": "application/json",
                        "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
                    },
                    data: JSON.stringify({ id: id }),
                    onload: () => {},
                    onerror: () => {}
                });
            } else {
                fetch(API_ADD_CNT_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
                    },
                    body: JSON.stringify({ id: id })
                }).catch(() => {});
            }
        } catch (e) {}
    }

    async function copyToClipboard(text, id) {
        try {
            await navigator.clipboard.writeText(text);
            showMessage("✔️ 复制成功！");
            reportCopy(id);
        } catch (error) {
            try {
                let tempInput = document.createElement("textarea");
                tempInput.value = text;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                tempInput.remove();
                showMessage("✔️ 复制成功！");
                reportCopy(id);
            } catch (err) {
                showMessage("❌ 复制失败，请手动选取复制");
            }
        }
    }

    let sendButtonCooldown = false;
    function sendBarrage(barrageText, id) {
        if (sendButtonCooldown) {
            showMessage("❌ 操作过快，发送冷却中！");
            return;
        }
        sendButtonCooldown = true;

        const chatInput = querySelectorDeep('.ChatSend-txt');
        const sendBtn = querySelectorDeep('.ChatSend-button');

        if (chatInput && sendBtn) {
            chatInput.focus();
            if ('value' in chatInput) {
                chatInput.value = barrageText;
            }
            chatInput.innerText = barrageText;
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                sendBtn.click();
                showMessage("✔️ 弹幕发送成功！");
                reportCopy(id);
            }, 60);
        } else {
            showMessage("❌ 弹幕输入框未就绪");
        }

        setTimeout(() => {
            sendButtonCooldown = false;
        }, 5000);
    }

    function renderTable(data) {
        scrollBox.innerHTML = "";
        table.innerHTML = "";

        if (!data || data.length === 0) {
            const noResultBox = document.createElement("div");
            Object.assign(noResultBox.style, {
                padding: "26px 16px",
                textAlign: "center",
                color: "#888",
                fontSize: "13px"
            });
            noResultBox.innerHTML = `未搜索到相关烂梗，换个关键词试试吧<br><div style="margin-top:10px;"><button id="sb6657-empty-submit" style="background:#4CAF50;color:#fff;border:none;border-radius:4px;padding:5px 12px;font-size:12px;cursor:pointer;">💡 投稿这个烂梗</button></div>`;
            scrollBox.appendChild(noResultBox);
            const emptySubmitBtn = noResultBox.querySelector("#sb6657-empty-submit");
            if (emptySubmitBtn) {
                emptySubmitBtn.addEventListener("click", () => {
                    switchToSubmitView(searchInput.value.trim());
                });
            }
            return;
        }

        data.forEach((item, index) => {
            let row = document.createElement("tr");
            row.style.backgroundColor = index % 2 === 0 ? "#f9fafb" : "#ffffff";
            row.style.borderBottom = "1px solid #f0f0f0";

            const rawTags = (item.tags || '').split(',').map(s => s.trim()).filter(Boolean);
            const tagLabels = rawTags.map(t => tagDict[t] || t);
            const tagsStr = tagLabels.length > 0 ? tagLabels.join("、") : "未归类";

            let barrageCell = document.createElement("td");
            Object.assign(barrageCell.style, {
                cursor: "pointer",
                padding: "8px 10px",
                width: "62%",
                wordBreak: "break-all",
                lineHeight: "1.4",
                color: "#222"
            });
            barrageCell.innerText = item.barrage;
            barrageCell.title = `🏷️ 标签: ${tagsStr}\n点击复制此弹幕`;

            barrageCell.onmouseover = () => { barrageCell.style.backgroundColor = "#e8f5e9"; };
            barrageCell.onmouseout = () => { barrageCell.style.backgroundColor = ""; };

            barrageCell.addEventListener("mouseenter", (e) => {
                let tagsHtml = tagLabels.length > 0
                    ? tagLabels.map(l => `<span style="background:rgba(76,175,80,0.25);color:#81c784;padding:1px 5px;border-radius:3px;margin-right:4px;">${l}</span>`).join('')
                    : `<span style="color:#aaa;">未归类</span>`;
                tagTooltip.innerHTML = `<span style="color:#a5d6a7;font-weight:600;margin-right:4px;">🏷️ 标签:</span> ${tagsHtml}`;
                tagTooltip.style.display = "block";
                tagTooltip.style.left = (e.clientX + 10) + "px";
                tagTooltip.style.top = (e.clientY + 14) + "px";
            });

            barrageCell.addEventListener("mousemove", (e) => {
                tagTooltip.style.left = (e.clientX + 10) + "px";
                tagTooltip.style.top = (e.clientY + 14) + "px";
            });

            barrageCell.addEventListener("mouseleave", () => {
                tagTooltip.style.display = "none";
            });

            barrageCell.addEventListener("click", () => {
                copyToClipboard(item.barrage, item.id);
            });
            row.appendChild(barrageCell);

            let copyCell = document.createElement("td");
            Object.assign(copyCell.style, {
                width: "18%",
                textAlign: "center",
                padding: "4px"
            });
            let copyBtn = document.createElement("button");
            copyBtn.innerText = "复制";
            Object.assign(copyBtn.style, {
                backgroundColor: "#4CAF50",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "12px"
            });
            copyBtn.addEventListener("click", () => {
                copyToClipboard(item.barrage, item.id);
            });
            copyCell.appendChild(copyBtn);
            row.appendChild(copyCell);

            let sendCell = document.createElement("td");
            Object.assign(sendCell.style, {
                width: "20%",
                textAlign: "center",
                padding: "4px"
            });
            let sendBtn = document.createElement("button");
            sendBtn.innerText = "一键发送";
            Object.assign(sendBtn.style, {
                backgroundColor: "#FF5722",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "12px"
            });
            sendBtn.addEventListener("click", () => {
                sendBarrage(item.barrage, item.id);
            });
            sendCell.appendChild(sendBtn);
            row.appendChild(sendCell);

            table.appendChild(row);
        });

        scrollBox.appendChild(table);
    }

    function performSearch() {
        let searchQuery = (searchInput.value || "").trim();
        if (!searchQuery) {
            showMessage("请输入搜索关键词", 1500);
            return;
        }
        showMessage("正在搜索...", 1000);

        const postData = JSON.stringify({
            D: "油猴",
            barrage: searchQuery,
            QueryBarrage: searchQuery
        });

        const handleSuccess = (text) => {
            try {
                const res = JSON.parse(text);
                if (res.code === 200 || res.code === "200") {
                    renderTable(res.data || []);
                } else {
                    showMessage("未找到相关弹幕", 1500);
                    renderTable([]);
                }
            } catch (e) {
                console.error("[sb6657.cn] 解析搜索结果失败:", e);
                showMessage("❌ 搜索结果解析异常");
            }
        };

        const handleError = (err) => {
            console.error("[sb6657.cn] 搜索失败:", err);
            showMessage("❌ 搜索失败，网络连接异常");
        };

        try {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: API_QUERY_URL,
                    headers: {
                        "Content-Type": "application/json",
                        "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
                    },
                    data: postData,
                    timeout: 10000,
                    onload: (res) => {
                        if (res.status === 200) {
                            handleSuccess(res.responseText);
                        } else {
                            handleError("HTTP " + res.status);
                        }
                    },
                    onerror: handleError,
                    ontimeout: () => handleError("请求超时")
                });
                return;
            }
        } catch (e) {}

        fetch(API_QUERY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "dpahjdoiaw": "c2I2NjU35o+S5Lu2"
            },
            body: postData
        })
        .then(response => response.text())
        .then(handleSuccess)
        .catch(handleError);
    }

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && tableContainer.style.display !== "none") {
            tableContainer.style.display = "none";
            tagTooltip.style.display = "none";
        }
    });

    function showUpdateBanner(remoteVersion) {
        if (document.getElementById("sb6657-update-banner")) return;
        let banner = document.createElement("div");
        banner.id = "sb6657-update-banner";
        banner.style.cursor = "pointer";
        banner.title = "点击直接打开更新脚本";
        banner.innerHTML = `
            <span>📢 sb6657 玩烂梗插件发现新版本：<strong>v${remoteVersion}</strong>（当前：${CURRENT_VERSION}）</span>
            <button id="sb6657-update-now">点击立即更新</button>
            <button class="close-btn" id="sb6657-update-close" title="关闭提示">✕</button>
        `;
        const root = document.body || document.documentElement;
        if (root) root.appendChild(banner);

        document.getElementById("sb6657-update-now").onclick = (e) => {
            e.stopPropagation();
            window.open(SCRIPT_DOWNLOAD_URL, "_blank");
        };
        banner.onclick = () => {
            window.open(SCRIPT_DOWNLOAD_URL, "_blank");
        };
        document.getElementById("sb6657-update-close").onclick = (e) => {
            e.stopPropagation();
            banner.remove();
        };
    }

    function checkUpdate(isManual = false) {
        if (isManual) {
            showMessage("🔍 正在检查更新...", 1500);
        }

        const handleSuccess = (content) => {
            const match = content.match(/@version\s+([^\s\r\n]+)/i);
            if (match && match[1]) {
                const remoteVer = cleanVer(match[1]);
                const localVer = cleanVer(CURRENT_VERSION);

                if (remoteVer !== localVer) {
                    if (updateBadge) updateBadge.style.display = "block";
                    showUpdateBanner(remoteVer);
                    if (isManual) {
                        showMessage(`🎉 发现新版本 v${remoteVer}，正在打开更新页...`, 2500);
                        window.open(SCRIPT_DOWNLOAD_URL, "_blank");
                    }
                } else if (isManual) {
                    showMessage(`当前已是最新版本 (${CURRENT_VERSION}) 🎉`, 2500);
                    if (updateBadge) updateBadge.style.display = "none";
                }
            } else if (isManual) {
                showMessage("⚠️ 未能解析远端版本号，请稍后再试", 2000);
            }
        };

        const handleError = () => {
            if (isManual) {
                showMessage("❌ 检查更新失败，请确认网络连接", 2000);
            }
        };

        try {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: SCRIPT_DOWNLOAD_URL + "?_t=" + Date.now(),
                    timeout: 8000,
                    onload: (res) => {
                        if (res.status === 200) {
                            handleSuccess(res.responseText);
                        } else {
                            handleError();
                        }
                    },
                    onerror: handleError,
                    ontimeout: handleError
                });
                return;
            }
        } catch (e) {}

        fetch(SCRIPT_DOWNLOAD_URL + "?_t=" + Date.now())
            .then(res => res.text())
            .then(handleSuccess)
            .catch(handleError);
    }

    function getOrCreateSid() {
        let sid = null;
        try {
            sid = localStorage.getItem("SB6657_GF_SID");
        } catch (e) {}
        if (!sid || sid.length < 6) {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            sid = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            try {
                localStorage.setItem("SB6657_GF_SID", sid);
            } catch (e) {}
        }
        return sid;
    }

    function initGFWebSocket() {
        if (window.top !== window.self) return;

        const targetWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        if (targetWindow.__SB6657_WS_ACTIVE__) return;
        targetWindow.__SB6657_WS_ACTIVE__ = true;

        let wsManager = { instance: null, timer: null, delay: 3000 };
        const sid = getOrCreateSid();

        function connect() {
            try {
                const wsUrl = WS_URL_BASE + sid;
                const WSCtor = (typeof unsafeWindow !== 'undefined' && unsafeWindow.WebSocket)
                    ? unsafeWindow.WebSocket
                    : (window.WebSocket || WebSocket);

                console.log("[sb6657.cn] 正在连接在线人数 WebSocket:", wsUrl);
                const ws = new WSCtor(wsUrl);
                wsManager.instance = ws;

                ws.onopen = () => {
                    console.log("[sb6657.cn] 在线人数 WebSocket 连接成功");
                    wsManager.delay = 3000;
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.GFCount !== undefined) {
                            const gfEl = document.getElementById("sb6657-gf-count");
                            if (gfEl) gfEl.innerText = data.GFCount;
                        }
                        if (data.count !== undefined) {
                            const webEl = document.getElementById("sb6657-web-count");
                            if (webEl) webEl.innerText = data.count;
                        }
                    } catch (err) {}
                };

                ws.onclose = (e) => {
                    if (e.code === 1000 || e.code === 1001) return;
                    clearTimeout(wsManager.timer);
                    wsManager.timer = setTimeout(connect, wsManager.delay);
                    wsManager.delay = Math.min(wsManager.delay * 2, 30000);
                };

                ws.onerror = () => {
                    try { ws.close(); } catch (e) {}
                };
            } catch (err) {
                console.error("[sb6657.cn] 在线人数 WS 异常:", err);
                targetWindow.__SB6657_WS_ACTIVE__ = false;
            }
        }

        window.addEventListener("beforeunload", () => {
            if (wsManager.instance) {
                try { wsManager.instance.close(1000); } catch (e) {}
            }
            targetWindow.__SB6657_WS_ACTIVE__ = false;
        });

        connect();
    }

    setTimeout(() => {
        checkUpdate(false);
    }, 1200);

    initGFWebSocket();
})();
