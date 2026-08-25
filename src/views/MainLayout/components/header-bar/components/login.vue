<template>
    <div>
        <div class="login-box">
            <div class="title">登 录</div>
            <el-form :model="loginForm" ref="formRef" :rules="rules" autocomplete="on" @submit.prevent="login">
                <el-form-item prop="username">
                    <el-input prefix-icon="Avatar" size="large" clearable v-model="loginForm.username"
                        placeholder="请输入邮箱" autocomplete="username" />
                </el-form-item>
                <el-form-item prop="password">
                    <el-input show-password size="large" prefix-icon="Lock" v-model="loginForm.password"
                        placeholder="请输入密码" autocomplete="current-password" />
                </el-form-item>
                <el-form-item prop="code">
                    <el-input v-model="loginForm.code" class="captcha-input" size="large" clearable autocomplete="off"
                        placeholder="请输入验证码">
                        <template #prefix>
                            <img src="@/assets/icons/validCode.svg" class="captcha-icon">
                        </template>
                    </el-input>
                    <div class="login-code">
                        <img :src="codeUrl" @click="getCode" class="login-code-img" @keyup.enter="login" />
                    </div>
                </el-form-item>
                <div class="login-options">
                    <el-checkbox v-model="loginForm.rememberMe" class="auto-login">15天内自动登录</el-checkbox>
                    <button type="button" class="text-link" @click="reg">还没有账号？去注册 &gt;</button>
                    <button type="button" class="text-link" @click="showResetPassword">重置密码 &gt;</button>
                </div>

                <el-form-item>
                    <el-button :loading="loading" type="primary" native-type="submit" class="login-submit">
                        <span v-if="!loading">登 录</span>
                        <span v-else>登 录 中...</span>
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        <el-dialog :align-center="true" v-model="resetPasswordView" :draggable="true" :width="dialogWidth"
            :modal="false" :append-to-body="true">
            <reset-password v-show="resetPasswordView" :closeDialog="closeResetPassword"></reset-password>
        </el-dialog>
    </div>
</template>

<script setup>
import httpInstance, { isRelogin } from "@/apis/httpInstance";
import { useIsMobile } from '@/composables/useIsMobile';
import { useAuthStore } from '@/stores/useAuthStore';
import { setToken } from "@/utils/cookieUtils";
import { ElMessage } from "element-plus";
import Cookies from "js-cookie";
import { reactive, ref } from "vue";
import resetPassword from './resetPassword.vue';

const authStore = useAuthStore();

const props = defineProps({
    onRegister: {
        type: Function,
        required: true
    },
    closeDialog: {
        type: Function,
        required: true
    }
});

const codeUrl = ref("");
const loading = ref(false);
const loginForm = ref({
    username: "",
    password: "",
    rememberMe: false,
    code: "",
    uuid: ""
});
const rules = reactive({
    username: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
    ],
    code: [
        { required: true, message: '请输入验证码', trigger: "change" }
    ]
})
const formRef = ref()

const resetPasswordView = ref(false);
const isMobile = useIsMobile();
const dialogWidth = ref('400px');

function getDialogWidth() {
    if (isMobile.value) {
        dialogWidth.value = '95%';
    }
}
getDialogWidth();

function login() {
    formRef.value.validate((valid) => {
        if (valid) {
            loading.value = true;
            httpInstance.post('/login', loginForm.value).then(res => {
                if (res.code === 200) {
                    ElMessage.success('登录成功')
                    isRelogin.value.show = true;
                    setToken(res.token, res.refreshToken, 15 * 24 * 60 * 60, loginForm.value.rememberMe)
                    closeLoginDialog();
                } else {
                    loading.value = false;
                    ElMessage.error(res.msg)
                }
            }).catch(() => {
                loading.value = false;
                if (captchaEnabled.value) {
                    getCode();
                }
            })
        }
    })
}
const captchaEnabled = ref(true);
function getCode() {
    httpInstance.get('/captchaImage').then(res => {
        captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
        if (captchaEnabled.value) {
            codeUrl.value = "data:image/gif;base64," + res.img;
            loginForm.value.uuid = res.uuid;
        }
    });
}

function clearLegacyPasswordCookies() {
    Cookies.remove("username");
    Cookies.remove("password");
    Cookies.remove("rememberMe");
}

clearLegacyPasswordCookies();
getCode();

function reg() {
    if (typeof props.onRegister === 'function') {
        props.onRegister();
    } else {
        console.error('onRegister is not a function');
    }
}

function closeLoginDialog() {
    props.closeDialog();
    // 广播登录成功：投稿弹窗等组件据此刷新自身登录状态提示
    authStore.notifyLoginSuccess();
}

function showResetPassword() {
    resetPasswordView.value = true;
}

function closeResetPassword() {
    resetPasswordView.value = false;
}
</script>

<style scoped lang="scss">
.title {
    text-align: center;
    color: #707070;
}

.captcha-input {
    width: 63%;
}

.captcha-icon {
    width: 16px;
}

.login-code-img {
    height: 38px;
    margin-left: 12px;
}

.login-code {
    width: 33%;
    height: 40px;
    float: right;

    img {
        cursor: pointer;
        vertical-align: middle;
    }
}

.login-options {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-bottom: 12px;
}

.auto-login {
    margin-right: auto;
}

.text-link {
    padding: 0;
    border: 0;
    color: #1677ff;
    font: inherit;
    background: transparent;
    cursor: pointer;
}

.login-submit {
    width: 100%;
}
</style>
