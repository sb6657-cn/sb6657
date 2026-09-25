// ==UserScript==
// @name         sb6657.cn斗鱼玩机器烂梗收集
// @namespace    https://sb6657.cn/
// @version      v2026.09.25.01
// @description  在斗鱼直播间 6657 添加玩烂梗弹幕搜索、快捷复制、一键发送与自动更新功能
// @author       sb6657.cn
// @match        https://www.douyu.com/*
// @match        https://www.douyu.com/6657
// @match        https://www.douyu.com/topic/*
// @icon         https://apic.douyucdn.cn/upload/avatar_v3/201905/badbf01f7ab943358bf78bcd9245305f_big.jpg
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
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

    const CURRENT_VERSION = 'v2026.09.25.01';
    const SCRIPT_DOWNLOAD_URL = 'https://sb6657.cn/sb6657.user.js';
    const API_QUERY_URL = 'https://api.hguofichp.cn/machine/Query';
    const API_ADD_CNT_URL = 'https://api.hguofichp.cn/machine/addCnt';
    const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000;

    function addStyles(css) {
        let styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML = css;
        document.head.appendChild(styleElement);
    }

    const css = `
        #sb6657-messageBox {
            font-size: 15px;
            position: fixed;
            top: 55px;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #4CAF50;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: 8px;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        #sb6657-update-banner {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 99998;
            background: linear-gradient(135deg, #1e8e3e, #34a853);
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 8px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
        }
        #sb6657-update-banner .close-btn:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.2);
        }
        .sb6657-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ff4d4f;
            display: none;
        }
    `;
    addStyles(css);

    function createElement(tag, styles, textContent) {
        let element = document.createElement(tag);
        if (styles) {
            Object.assign(element.style, styles);
        }
        if (textContent) {
            element.innerText = textContent;
        }
        return element;
    }

    function showMessage(text, duration = 2200) {
        let existing = document.getElementById("sb6657-messageBox");
        if (existing) {
            existing.remove();
        }
        let messageBox = document.createElement("div");
        messageBox.id = "sb6657-messageBox";
        messageBox.innerText = text;
        document.body.appendChild(messageBox);

        setTimeout(() => {
            messageBox.style.opacity = "0";
            messageBox.style.transform = "translate(-50%, -70%)";
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, duration);
    }

    function compareVersion(v1, v2) {
        const parts1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
        const parts2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < len; i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }

    function getStorage(key, defaultVal) {
        try {
            if (typeof GM_getValue === 'function') {
                const val = GM_getValue(key);
                if (val !== undefined) return val;
            }
        } catch (e) {}
        try {
            const val = localStorage.getItem('SB6657_' + key);
            return val !== null ? JSON.parse(val) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function setStorage(key, val) {
        try {
            if (typeof GM_setValue === 'function') {
                GM_setValue(key, val);
            }
        } catch (e) {}
        try {
            localStorage.setItem('SB6657_' + key, JSON.stringify(val));
        } catch (e) {}
    }

    let button = createElement("button", {
        fontSize: "15px",
        fontWeight: "600",
        width: "82px",
        height: "32px",
        position: "absolute",
        zIndex: "1000",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        right: "10px",
        bottom: "60px",
        borderRadius: "6px",
        marginRight: "53px",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
        transition: "background-color 0.2s, transform 0.2s"
    }, "玩烂梗");

    button.onmouseover = () => { button.style.backgroundColor = "#43A047"; };
    button.onmouseout = () => { button.style.backgroundColor = "#4CAF50"; };

    function insertButton() {
        let toolbar = document.querySelector('.layout-Player') || document.querySelector('#js-player-toolbar') || document.querySelector('.ChatToolBar');
        if (toolbar) {
            toolbar.insertBefore(button, toolbar.firstChild);
        } else {
            setTimeout(insertButton, 150);
        }
    }
    insertButton();

    let tableContainer = createElement("div", {
        fontSize: "15px",
        borderRadius: "10px",
        display: "none",
        position: "fixed",
        width: "420px",
        top: "240px",
        right: "20px",
        zIndex: "1001",
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
        maxHeight: "440px",
        overflowY: "auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    });
    document.body.appendChild(tableContainer);

    let searchContainer = createElement("div", {
        fontSize: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "80px",
        padding: "0 10px",
        borderBottom: "1px solid #f0f0f0"
    });
    tableContainer.appendChild(searchContainer);

    let searchInput = createElement("input", {
        fontSize: "14px",
        flex: "1",
        padding: "6px 10px",
        boxSizing: "border-box",
        marginRight: "8px",
        marginTop: "30px",
        marginLeft: "4px",
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        outline: "none"
    }, null);
    searchInput.type = "text";
    searchInput.placeholder = "搜索玩机器烂梗...";
    searchContainer.appendChild(searchInput);

    let searchButton = createElement("button", {
        fontSize: "13px",
        padding: "6px 12px",
        height: "32px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "6px",
        marginRight: "6px",
        marginTop: "30px",
        cursor: "pointer",
        fontWeight: "500"
    }, "搜索");
    searchContainer.appendChild(searchButton);

    function createIconButton(svgPath, title, clickHandler, leftOffset, fill = "#389f25") {
        let btn = createElement("button", {
            width: "32px",
            height: "32px",
            position: "fixed",
            padding: "4px",
            backgroundColor: "transparent",
            border: "none",
            marginBottom: "44px",
            marginLeft: leftOffset + "px",
            borderRadius: "6px",
            cursor: "pointer"
        }, "");
        btn.title = title;

        let svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgIcon.setAttribute("viewBox", "0 0 1024 1024");
        svgIcon.setAttribute("width", "24");
        svgIcon.setAttribute("height", "24");

        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", svgPath);
        path.setAttribute("fill", fill);

        svgIcon.appendChild(path);
        btn.appendChild(svgIcon);
        btn.addEventListener("click", clickHandler);
        searchContainer.appendChild(btn);
        return btn;
    }

    createIconButton(
        "M512 128L128 448h128v448h256V640h128v256h256V448h128z",
        "访问 sb6657.cn 官网",
        () => { window.open("https://sb6657.cn", '_blank'); },
        10,
        "#389f25"
    );

    createIconButton(
        "M395.765 586.57H224.032c-22.421 0-37.888-22.442-29.909-43.38L364.768 95.275A32 32 0 0 1 394.667 74.667h287.957c22.72 0 38.208 23.018 29.632 44.064l-99.36 243.882h187.05c27.51 0 42.187 32.427 24.043 53.099l-458.603 522.56c-22.293 25.408-63.626 3.392-54.976-29.28l85.355-322.422z",
        "赞赏支持",
        () => { window.open("https://sb6657.cn/zfb.jpg", '_blank'); },
        48,
        "#1296db"
    );

    createIconButton(
        "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-28-568h56v256h-56zm28 356c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z",
        "反馈建议 / 提交 BUG",
        () => { window.open("https://www.wjx.cn/vm/rQUgnS0.aspx#", '_blank'); },
        86,
        "#595959"
    );

    let updateBtn = createIconButton(
        "M705.536 328.544c-314.56-271.744-641.056 51.2-641.056 51.2 352-603.84 772.192-160 772.192-160l121.92-115.52v407.104H554.272zM318.912 695.008c314.496 271.648 641.056-51.2 641.056-51.2-352 603.808-772.192 160-772.192 160L64 919.392V548.704h406.208z",
        "检查插件更新 (当前: v" + CURRENT_VERSION + ")",
        () => { checkUpdate(true); },
        124,
        "#0590DF"
    );

    let updateBadge = document.createElement("span");
    updateBadge.className = "sb6657-badge";
    updateBtn.style.position = "relative";
    updateBtn.appendChild(updateBadge);

    let table = createElement("table", {
        fontSize: "14px",
        width: "100%",
        borderCollapse: "collapse"
    });
    tableContainer.appendChild(table);

    let dataHash = {};

    function fetchDataFromServer(searchQuery) {
        showMessage("正在搜索...", 1000);
        fetch(API_QUERY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "dpahjdoiaw": "eAR48ZFJwfRTy6SyQPFj"
            },
            body: JSON.stringify({
                D: "油猴",
                barrage: searchQuery,
                QueryBarrage: searchQuery
            })
        })
        .then(response => response.json())
        .then(res => {
            if (res.code === 200 || res.code === "200") {
                buildDataHash(res.data || []);
            } else {
                showMessage("未找到相关弹幕");
                table.style.display = "none";
            }
        })
        .catch(error => {
            console.error("[sb6657] 搜索失败:", error);
            showMessage("❌ 搜索失败，网络连接异常");
        });
    }

    function buildDataHash(data) {
        dataHash = {};
        data.forEach(item => {
            if (!item || !item.barrage) return;
            let lowerCaseBarrage = item.barrage.toLowerCase();
            if (!dataHash[lowerCaseBarrage]) {
                dataHash[lowerCaseBarrage] = [];
            }
            dataHash[lowerCaseBarrage].push(item);
        });
        renderTable(Object.values(dataHash).flat());
    }

    function renderTable(data) {
        table.innerHTML = "";
        if (!data || data.length === 0) {
            table.style.display = "none";
            showMessage("未搜索到相关烂梗", 1500);
        } else {
            table.style.display = "table";
            data.forEach((item, index) => {
                let row = createElement("tr", {
                    backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                    borderBottom: "1px solid #f0f0f0"
                }, null);

                let barrageCell = createElement("td", {
                    cursor: "pointer",
                    padding: "8px 10px",
                    width: "62%",
                    wordBreak: "break-all",
                    lineHeight: "1.4"
                }, item.barrage);
                barrageCell.title = "点击复制此弹幕";
                barrageCell.addEventListener("click", function() {
                    copyToClipboard(item.barrage, item.id);
                });
                row.appendChild(barrageCell);

                let copyButtonCell = createElement("td", {
                    width: "18%",
                    textAlign: "center"
                }, null);
                let copyButton = createElement("button", {
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "12px"
                }, "复制");
                copyButton.addEventListener("click", function() {
                    copyToClipboard(item.barrage, item.id);
                });
                copyButtonCell.appendChild(copyButton);
                row.appendChild(copyButtonCell);

                let sendButtonCell = createElement("td", {
                    width: "20%",
                    textAlign: "center"
                }, null);
                let sendButton = createElement("button", {
                    backgroundColor: "#FF5722",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "12px"
                }, "一键发送");
                sendButton.addEventListener("click", function() {
                    sendBarrage(item.barrage, item.id);
                });
                sendButtonCell.appendChild(sendButton);
                row.appendChild(sendButtonCell);

                table.appendChild(row);
            });
        }
    }

    function performSearch() {
        let searchQuery = (searchInput.value || "").trim().toLowerCase();
        if (!searchQuery) {
            table.style.display = "none";
            showMessage("请输入搜索关键词", 1500);
            return;
        }
        fetchDataFromServer(searchQuery);
    }

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    button.addEventListener("click", function() {
        if (tableContainer.style.display === "none" || tableContainer.style.display === "") {
            tableContainer.style.display = "block";
            searchInput.focus();
        } else {
            tableContainer.style.display = "none";
        }
    });

    function reportCopy(id) {
        if (!id) return;
        try {
            fetch(API_ADD_CNT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id })
            }).catch(() => {});
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
                document.body.removeChild(tempInput);
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

        let textArea = document.querySelector('textarea.ChatSend-txt');
        if (textArea) {
            textArea.value = barrageText;
            textArea.dispatchEvent(new Event('input', { bubbles: true }));

            let sendButton = document.querySelector('div.ChatSend-button');
            if (sendButton) {
                sendButton.click();
                showMessage("✔️ 弹幕发送成功！");
                reportCopy(id);
            } else {
                showMessage("❌ 发送按钮未找到，请手动发送");
            }
        } else {
            showMessage("❌ 弹幕输入框未就绪");
        }

        setTimeout(() => {
            sendButtonCooldown = false;
        }, 5000);
    }

    function normalizeVer(v) {
        let s = String(v || '').trim();
        return s.startsWith('v') || s.startsWith('V') ? s : 'v' + s;
    }

    function showUpdateBanner(remoteVersion) {
        if (document.getElementById("sb6657-update-banner")) return;
        let banner = document.createElement("div");
        banner.id = "sb6657-update-banner";
        banner.style.cursor = "pointer";
        banner.title = "点击直接打开更新脚本";
        banner.innerHTML = `
            <span>📢 sb6657 玩烂梗插件发现新版本：<strong>${remoteVersion}</strong>（当前：${CURRENT_VERSION}）</span>
            <button id="sb6657-update-now">点击立即更新</button>
            <button class="close-btn" id="sb6657-update-close" title="关闭提示">×</button>
        `;
        document.body.appendChild(banner);

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
            const match = content.match(/\/\/\s*@version\s+([^\s\r\n]+)/i);
            if (match && match[1]) {
                const remoteVer = normalizeVer(match[1]);
                const localVer = normalizeVer(CURRENT_VERSION);
                setStorage('LAST_UPDATE_TIME', Date.now());

                if (remoteVer !== localVer) {
                    updateBadge.style.display = "block";
                    showUpdateBanner(remoteVer);
                    if (isManual) {
                        showMessage(`🎉 发现新版本 ${remoteVer}，正在打开更新页...`, 2500);
                        window.open(SCRIPT_DOWNLOAD_URL, "_blank");
                    }
                } else if (isManual) {
                    showMessage(`当前已是最新版本 (${CURRENT_VERSION}) 🎉`, 2500);
                    updateBadge.style.display = "none";
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

    setTimeout(() => {
        checkUpdate(false);
    }, 1000);
})();
