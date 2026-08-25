import { SERVER_ADDRESS } from '@/constants/backend';
import { useAuthStore } from '@/stores/useAuthStore';
import { getRefreshToken, getSiteToken, getToken, isTokenExpiringSoon, removeToken, setSiteToken, setToken } from '@/utils/cookieUtils';
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
export const sbVersion = 'V3.15.2.20260825';

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

let authStore: ReturnType<typeof useAuthStore> | null = null;
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

// 是否正在刷新 token
let isRefreshing = false;
// 重试队列
let retryRequests: Function[] = [];

// 刷新 token 的函数
async function refreshToken() {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await axios.post(`${SERVER_ADDRESS}/refresh-token`, {
            refreshToken,
        });

        if (response.data.code === 200) {
            const { token, refreshToken: newRefreshToken } = response.data;
            // 更新 token
            setToken(token, newRefreshToken, 15 * 24 * 60 * 60);
            return token;
        } else {
            throw new Error('Refresh token failed');
        }
    } catch (error) {
        // 刷新失败，清除所有 token
        removeToken();
        throw error;
    }
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

        const token = getToken();
        if (token) {
            // 如果有有效token，确保isRelogin状态为true
            if (!isRelogin.value.show) {
                isRelogin.value.show = true;
            }

            // 检查 token 是否即将过期
            if (isTokenExpiringSoon()) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    try {
                        // 刷新 token
                        const newToken = await refreshToken();
                        // 确保刷新成功后登录状态为true
                        isRelogin.value.show = true;
                        // 更新请求头
                        config.headers['Authorization'] = 'Bearer ' + newToken;
                        // 重试队列中的请求
                        retryRequests.forEach((cb) => cb(newToken));
                        retryRequests = [];
                    } catch (error) {
                        // 刷新失败，清除重试队列
                        retryRequests = [];
                        // 显示登录框
                        if (authStore) {
                            authStore.showLogin();
                        }
                        return Promise.reject(error);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    // 如果正在刷新，将请求加入重试队列
                    return new Promise((resolve) => {
                        retryRequests.push((token: string) => {
                            config.headers['Authorization'] = 'Bearer ' + token;
                            resolve(config);
                        });
                    });
                }
            } else {
                // token 未过期，直接使用
                config.headers['Authorization'] = 'Bearer ' + token;
            }
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
httpInstance.interceptors.response.use(
    (res) => {
        if (!authStore) {
            try {
                authStore = useAuthStore();
            } catch (e) {
                console.warn('Pinia 尚未初始化，无法获取 authStore');
            }
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
            if (!isRelogin.value.show) {
                isRelogin.value.show = true;
                ElMessageBox.confirm('请先登录再使用该功能，或您的登录状态已过期，您可以继续留在该页面，或者重新登录', '请您先登录~', {
                    confirmButtonText: '重新登录',
                    cancelButtonText: '取消',
                    type: 'warning',
                })
                    .then(() => {
                        isRelogin.value.show = false;
                        if (authStore) {
                            authStore.showLogin();
                        } else {
                            try {
                                const store = useAuthStore();
                                store.showLogin();
                            } catch (e) {
                                console.warn('Pinia 尚未初始化，无法获取 authStore');
                            }
                        }
                    })
                    .catch(() => {
                        isRelogin.value.show = false;
                    });
            }
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
                case 401:
                    // token 过期或无效
                    if (!isRefreshing) {
                        isRefreshing = true;
                        try {
                            // 尝试刷新 token
                            const newToken = await refreshToken();
                            // 确保刷新成功后登录状态为true
                            isRelogin.value.show = true;
                            // 重试原请求
                            error.config.headers['Authorization'] = 'Bearer ' + newToken;
                            return httpInstance(error.config);
                        } catch (refreshError) {
                            // 刷新失败，清除 token 并显示登录框
                            removeToken();
                            if (!isRelogin.value.show) {
                                isRelogin.value.show = true;
                                ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
                                    confirmButtonText: '重新登录',
                                    cancelButtonText: '取消',
                                    type: 'warning',
                                })
                                    .then(() => {
                                        isRelogin.value.show = false;
                                        if (authStore) {
                                            authStore.showLogin();
                                        }
                                    })
                                    .catch(() => {
                                        isRelogin.value.show = false;
                                    });
                            }
                            return Promise.reject(refreshError);
                        } finally {
                            isRefreshing = false;
                        }
                    } else {
                        // 如果正在刷新，将请求加入重试队列
                        return new Promise((resolve) => {
                            retryRequests.push((token: string) => {
                                error.config.headers['Authorization'] = 'Bearer ' + token;
                                resolve(httpInstance(error.config));
                            });
                        });
                    }
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
