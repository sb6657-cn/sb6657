import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const loginVisible = ref(false)
    const userId = ref<number>(0)
    // 登录成功计数器：每次登录成功自增，供任意组件 watch 后刷新自身登录态
    const loginSuccessTick = ref(0)

    function showLogin() {
        loginVisible.value = true
    }

    function hideLogin() {
        loginVisible.value = false
    }

    function setUserId(id: number) {
        userId.value = id
    }

    /** 登录成功后调用：关闭登录弹窗并广播成功信号 */
    function notifyLoginSuccess() {
        loginVisible.value = false
        loginSuccessTick.value++
    }

    return {
        loginVisible,
        userId,
        loginSuccessTick,
        showLogin,
        hideLogin,
        setUserId,
        notifyLoginSuccess
    }
})