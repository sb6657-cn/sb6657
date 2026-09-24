import { WS_SERVER_ADDRESS } from '@/constants/backend';

/**
 * 合成大猪头 WSS 客户端
 * 与后端 /machine/merge-pig/{siteToken} WebSocket 通信
 */
export class MergePigWsClient {
    /**
     * @param {string} siteToken - 用户标识
     * @param {object} handlers - 事件处理 { onInit, onNextBall, onGameOver, onError, onNetworkStatusChange }
     */
    constructor(siteToken, handlers) {
        this.url = `${WS_SERVER_ADDRESS}/machine/merge-pig/${encodeURIComponent(siteToken)}`;
        this.handlers = handlers;
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.scoreUpdateTimer = null;
        this.currentScore = 0;
        this.currentLevel = 0;

        // 离线模式相关
        this.isOnline = true;
        this.pendingDropTimer = null;
        this.offlineQueue = []; // 离线时缓存的球
        this.nextBallId = 1;
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                console.log('[MergePig] WSS connected');
                this.reconnectAttempts = 0;
                this.startScoreUpdateTimer();
                // 连接建立时发送离线期间缓存的球
                this.flushOfflineQueue();
            };
            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleMessage(msg);
                } catch (e) {
                    console.error('[MergePig] parse error', e);
                }
            };
            this.ws.onclose = (e) => {
                console.log('[MergePig] WSS closed', e.code, e.reason);
                this.setOnline(false);
                this.stopScoreUpdateTimer();
                this.scheduleReconnect();
            };
            this.ws.onerror = (e) => {
                console.error('[MergePig] WSS error', e);
            };
        } catch (e) {
            console.error('[MergePig] connect error', e);
            this.scheduleReconnect();
        }
    }

    startScoreUpdateTimer() {
        this.stopScoreUpdateTimer();
        // 每 20 秒推送一次当前分数
        this.scoreUpdateTimer = setInterval(() => {
            this.sendScoreUpdate(this.currentScore);
        }, 20000);
    }

    stopScoreUpdateTimer() {
        if (this.scoreUpdateTimer) {
            clearInterval(this.scoreUpdateTimer);
            this.scoreUpdateTimer = null;
        }
    }

    /** 更新当前分数（由游戏主动调用） */
    updateScore(score, level) {
        this.currentScore = score;
        this.currentLevel = level;
    }

    /** 推送分数更新到后端，后端判断是否大于历史最高分再覆盖 */
    sendScoreUpdate(score) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && score > 0) {
            const adminToken = getAdminToken();
            const payload = { type: 'score_update', score, level: this.currentLevel };
            if (adminToken) {
                payload.adminToken = adminToken;
            }
            this.ws.send(JSON.stringify(payload));
        }
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'init':
                this.setOnline(true);
                if (this.handlers.onInit) {
                    this.handlers.onInit(msg.queue, msg.bestScore);
                }
                break;
            case 'next':
                // 收到服务器下发的球，取消待发送定时器
                if (this.pendingDropTimer) {
                    clearTimeout(this.pendingDropTimer);
                    this.pendingDropTimer = null;
                }
                this.setOnline(true);
                if (this.handlers.onNextBall) {
                    this.handlers.onNextBall(msg.level, msg.score);
                }
                break;
            case 'game_over':
                if (this.pendingDropTimer) {
                    clearTimeout(this.pendingDropTimer);
                    this.pendingDropTimer = null;
                }
                if (this.handlers.onGameOver) {
                    this.handlers.onGameOver(msg.win, msg.score, msg.rank);
                }
                break;
            case 'pong':
                // ignore
                break;
            default:
                console.warn('[MergePig] unknown msg', msg);
        }
    }

    /** 玩家落下了一个球 */
    sendDrop(score, level) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'drop', score, level }));
            // 启动 1s 超时定时器，超时则降级到离线模式
            this.startDropTimeout();
        } else {
            // WebSocket 未连接，直接离线模式
            this.handleOfflineDrop();
        }
    }

    /** 启动 1s 超时检测 */
    startDropTimeout() {
        if (this.pendingDropTimer) {
            clearTimeout(this.pendingDropTimer);
        }
        this.pendingDropTimer = setTimeout(() => {
            this.pendingDropTimer = null;
            console.warn('[MergePig] 1s 未收到服务器下发球，降级到离线模式');
            this.handleOfflineDrop();
        }, 1000);
    }

    /** 处理离线模式下的球生成 */
    handleOfflineDrop() {
        this.setOnline(false);
        // 生成下一个球的随机等级 (1-4)，不使用刚落下的等级
        const nextLevel = Math.floor(Math.random() * 4) + 1;
        const localBallId = this.nextBallId++;
        const offlineBall = {
            id: localBallId,
            level: nextLevel,
            isLocal: true,
            timestamp: Date.now()
        };
        this.offlineQueue.push(offlineBall);

        // 通知游戏使用本地生成的下一个球
        if (this.handlers.onNextBall) {
            this.handlers.onNextBall(nextLevel, this.currentScore);
        }
    }

    /** 刷新离线队列：连接恢复时发送缓存的球 */
    flushOfflineQueue() {
        if (this.offlineQueue.length > 0) {
            console.log('[MergePig] 刷新离线队列，数量:', this.offlineQueue.length);
            this.offlineQueue.forEach(ball => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'drop',
                        score: this.currentScore,
                        level: ball.level,
                        isRetry: true,
                        localId: ball.id
                    }));
                }
            });
            this.offlineQueue = [];
        }
    }

    /** 设置在线/离线状态 */
    setOnline(online) {
        if (this.isOnline !== online) {
            this.isOnline = online;
            if (this.handlers.onNetworkStatusChange) {
                this.handlers.onNetworkStatusChange(online);
            }
        }
    }

    /** 游戏结束时发送 */
    sendGameOver(win, score, level) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const adminToken = getAdminToken();
            const payload = { type: 'game_over', win, score, level };
            if (adminToken) {
                payload.adminToken = adminToken;
            }
            this.ws.send(JSON.stringify(payload));
        }
    }

    /** 请求重新开始 */
    sendRestart() {
        if (this.pendingDropTimer) {
            clearTimeout(this.pendingDropTimer);
            this.pendingDropTimer = null;
        }
        this.offlineQueue = [];
        this.ws?.send(JSON.stringify({ type: 'restart' }));
    }

    /** 心跳（每 30s） */
    sendPing() {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= 5) return;
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }

    close() {
        this.stopScoreUpdateTimer();
        clearTimeout(this.reconnectTimer);
        if (this.pendingDropTimer) {
            clearTimeout(this.pendingDropTimer);
        }
        this.ws?.close();
        this.ws = null;
    }
}

/** 获取 localStorage 中的 Admin-Token（用于获取登录用户昵称） */
export function getAdminToken() {
    try {
        return localStorage.getItem('Admin-Token') || null;
    } catch {
        return null;
    }
}

/** 获取 cookie 中的 siteToken */
export function getSiteToken() {
    const match = document.cookie.match(/(^|;\s*)siteToken=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : null;
}
