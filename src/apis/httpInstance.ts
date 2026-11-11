import { SERVER_ADDRESS } from '@/constants/backend';
import { useAuthStore } from '@/stores/useAuthStore';
import { getRefreshToken, getSiteToken, getToken, isTokenExpiringSoon, removeToken, setSiteToken, setToken } from '@/utils/cookieUtils';
import { getTurnstilePass, setTurnstilePass, triggerTurnstileGuard } from '@/composables/useTurnstileGuard';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { ref } from 'vue';

export interface BackendResponse<T = unknown> {
    code: number;
    data: T;
    msg: string;
}

interface BackendHttpInstance extends Omit<AxiosInstance, 'delete' | 'get' | 'head' | 'options' | 'patch' | 'patchForm' | 'post' | 'postForm' | 'put' | 'putForm'> {
    <T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    <T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    delete<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    get<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    head<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    options<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    patchForm<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    postForm<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
    putForm<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<BackendResponse<T>>;
}

const httpInstance = axios.create({
    baseURL: SERVER_ADDRESS,
    // baseURL: "http://127.0.0.1:9999",
    timeout: 60000, // 默认超时时间
}) as BackendHttpInstance;
export const sbVersion = 'V3.16.6.20261111';

interface req<T> {
    url: string;
    data: T;
}
export interface res<T> {
    _failure?: boolean;
    flatData: T | null;
}
export async function post<T, R = any>(req: req<T>): Promise<res<R>> {
    let result: res<R> = {
        _failure: false,
        flatData: null,
    };
    try {
        const res = (await httpInstance.post(req.url, req.data)) as BackendResponse<R>;
        if (res.code === 200) {
            result.flatData = res.data;
        } else {
            console.warn('请求失败', req.url, res.msg);
            result._failure = true;
        }
    } catch (e) {
        console.warn('请求失败', req.url, e);
        result._failure = true;
    }
    return result;
}

export async function get<R = any>(url: string): Promise<res<R>> {
    let result: res<R> = {
        _failure: false,
        flatData: null,
    };
    try {
        const res = (await httpInstance.get(url)) as BackendResponse<R>;
        if (res.code === 200) {
            result.flatData = res.data;
        } else {
            console.warn('请求失败', url, res.msg);
            result._failure = true;
        }
    } catch (e) {
        console.warn('请求失败', url, e);
        result._failure = true;
    }
    return result;
}

/**
 * 后端使用siteToken来统计UV PV IP日均
 * @param length
 * @returns
 */
// 生成随机的 10 位字符 数字组合
function generateRandomToken(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// 获取或生成 siteToken
function getSiteTokenString(): string {
    let siteToken = getSiteToken();
    if (!siteToken) {
        siteToken = generateRandomToken();
        setSiteToken(siteToken);
    }
    return siteToken;
}

type TokenRenewal = {
    code: number;
    token: string;
    refreshToken: string;
};

let pendingRefresh: Promise<string> | null = null;
// 旧请求的 401 可能晚于同一批请求的续期成功响应。
let lastRenewal: { previous: string | null; current: string } | null = null;

async function renewAccessToken(): Promise<string> {
    const previous = getToken();
    const refreshToken = getRefreshToken();
    try {
        if (!refreshToken) throw new Error('缺少续期凭据');
        const { data } = await axios.post<TokenRenewal>(`${SERVER_ADDRESS}/refresh-token`, { refreshToken }, { timeout: httpInstance.defaults.timeout });
        if (data.code !== 200 || !data.token || !data.refreshToken) throw new Error('续期失败');
        if (getRefreshToken() !== refreshToken) throw new Error('登录会话已更换');

        setToken(data.token, data.refreshToken, 15 * 24 * 60 * 60);
        lastRenewal = { previous, current: data.token };
        isRelogin.value.show = true;
        return data.token;
    } catch (cause) {
        if (getRefreshToken() === refreshToken) {
            removeToken();
            useAuthStore().showLogin();
        }
        // 不把续期接口的 HTTP 错误当成业务请求的 401 再次重试。
        throw Object.assign(new Error('登录续期失败'), { cause });
    }
}

function refreshAccessToken(): Promise<string> {
    pendingRefresh ??= renewAccessToken().finally(() => {
        pendingRefresh = null;
    });
    return pendingRefresh;
}

// 请求拦截器
httpInstance.interceptors.request.use(
    async (config) => {
        // 添加 siteToken
        if (getSiteTokenString()) {
            config.headers['siteToken'] = getSiteToken();
        }

        // 用于统计请求来源自sb6657.cn网站前端。如果你要使用网站后端，请移除此请求头，防止我们统计错数据，感谢配合
        config.headers['dpahjdoiaw'] = 'eAR48ZFJwfRTy6SyQPFj';

        // 附加 Cloudflare Turnstile 安全通行证
        const cfPass = getTurnstilePass();
        if (cfPass && !config.headers['X-Turnstile-Pass']) {
            config.headers['X-Turnstile-Pass'] = cfPass;
        }

        const token = getToken();
        if (token) {
            isRelogin.value.show = true;
            const accessToken = pendingRefresh || isTokenExpiringSoon() ? await refreshAccessToken() : token;
            config.headers['Authorization'] = 'Bearer ' + accessToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const errorCode: Record<string, string> = {
    '401': '认证失败，无法访问资源',
    '403': '当前操作没有权限',
    '404': '访问资源不存在',
    default: '系统未知错误，请反馈给管理员',
};
export const isRelogin = ref({ show: Boolean(getToken()) });

function promptLogin() {
    if (!isRelogin.value.show) {
        isRelogin.value.show = true;
        ElMessageBox.confirm('请先登录再使用该功能，或您的登录状态已过期，您可以继续留在该页面，或者重新登录', '请您先登录~', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
        })
            .then(() => {
                isRelogin.value.show = false;
                useAuthStore().showLogin();
            })
            .catch(() => {
                isRelogin.value.show = false;
            });
    }
}

httpInstance.interceptors.response.use(
    (res) => {
        const passHeader = res.headers?.['x-turnstile-pass'] || res.headers?.['X-Turnstile-Pass'];
        if (passHeader) {
            setTurnstilePass(passHeader as string);
        }
        // 未设置状态码则默认成功状态
        const code = res.data.code || 200;
        // 获取错误信息
        const msg = errorCode[code] || res.data.msg || errorCode['default'];
        // 二进制数据则直接返回
        if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
            return res.data;
        }
        if (code === 401) {
            promptLogin();
            return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
        } else if (code === 500) {
            ElMessage({ message: msg, type: 'error', duration: 15000, showClose: true });
            return Promise.reject(new Error(msg));
        } else if (code === 601) {
            ElMessage({ message: msg, type: 'warning' });
            return Promise.reject(new Error(msg));
        } else if (code !== 200) {
            ElNotification.error({ title: msg });
            return Promise.reject('error');
        } else {
            return Promise.resolve(res.data);
        }
    },
    async (error) => {
        console.log('err' + error);
        let { message } = error;
        if (error.response?.status === 4000) {
            ElMessageBox.alert(error.response.data, '你的操作太快啦', {
                confirmButtonText: 'OK',
            });
            return Promise.reject(error);
        }

        if (error.response) {
            switch (error.response.status) {
                case 401: {
                    const config = error.config;
                    if (!config || config._retriedAfterRefresh) throw error;
                    const current = getToken();
                    const sent = config.headers.Authorization;
                    if (!sent) {
                        if (!current) promptLogin();
                        throw error;
                    }
                    if (sent !== 'Bearer ' + current) {
                        // 只重放本次续期前发出的请求，不能用另一个账号接着重试。
                        if (!current || lastRenewal?.current !== current || sent !== 'Bearer ' + lastRenewal.previous) throw error;
                    } else {
                        await refreshAccessToken();
                    }
                    config._retriedAfterRefresh = true;
                    return httpInstance(config);
                }
                case 403:
                    if (error.response?.data?.needTurnstile) {
                        const action = error.response.data.action || 'general';
                        try {
                            const newPass = await triggerTurnstileGuard(action);
                            error.config.headers['X-Turnstile-Pass'] = newPass;
                            return httpInstance(error.config);
                        } catch (guardErr) {
                            return Promise.reject(guardErr);
                        }
                    }
                    if (error.response?.data?.msg) {
                        ElMessage({ message: error.response.data.msg, type: 'error', duration: 5 * 1000 });
                        return Promise.reject(error);
                    }
                    break;
                default:
                    if (message === 'Network Error') {
                        message = '接口连接异常';
                    } else if (message.includes('timeout')) {
                        message = '接口请求超时';
                    } else if (message.includes('Request failed with status code')) {
                        message = '接口' + message.substr(message.length - 3) + '异常';
                    }
                    ElMessage({ message: message, type: 'error', duration: 5 * 1000 });
                    return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default httpInstance;
