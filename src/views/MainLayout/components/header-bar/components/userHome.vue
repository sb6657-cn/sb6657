<template>
    <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" :trigger="isMobile ? 'click' : 'hover'">
        <div class="avatar-wrapper" :class="{ 'mobile-light': isMobile && !theme.isDark }" title="用户中心">
            <span class="avatar-icon-box">
                <User :size="isMobile ? 20 : 22" :stroke-width="2" class="avatar-icon" />
                <span v-if="isRelogin.show" class="login-status-dot" title="已登录" />
            </span>
            <ChevronDown :size="13" :stroke-width="2.5" class="caret-icon" />
        </div>
        <template #dropdown>
            <el-dropdown-menu>
                <router-link to="/growth">
                    <el-dropdown-item>🏆 梗王段位</el-dropdown-item>
                </router-link>
                <router-link to="/checkin">
                    <el-dropdown-item>💰 我的梗币</el-dropdown-item>
                </router-link>
                <el-dropdown-item divided></el-dropdown-item>
                <router-link to="/me-post">
                    <el-dropdown-item>我的帖子</el-dropdown-item>
                </router-link>
                <router-link to="/me-memes">
                    <el-dropdown-item>我的投稿</el-dropdown-item>
                </router-link>
                <template v-if="!isRelogin.show">
                    <el-dropdown-item command="login" divided>
                        <span @click="loginAndReg">登录/注册</span>
                    </el-dropdown-item>
                </template>
                <router-link to="/userInfo">
                    <el-dropdown-item>个人中心</el-dropdown-item>
                </router-link>
                <el-dropdown-item command="login">
                    <span @click="ysCommunityNorms = true">隐私政策</span>
                </el-dropdown-item>
                <template v-if="isRelogin.show">
                    <el-dropdown-item divided command="logout">
                        <span @click="logout">退出登录</span>
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
    <el-dialog :align-center="true" v-model="loginView" :draggable="true" :width="dialogWidth" :modal="false"
        :append-to-body="true">
        <login v-show="loginView" :onRegister="handleRegister" :closeDialog="closeDialog"></login>
    </el-dialog>
    <el-dialog :align-center="true" v-model="registerView" :draggable="true" :width="dialogWidth" :modal="false"
        :append-to-body="true">
        <register v-show="registerView"></register>
    </el-dialog>

    <el-dialog v-model="ysCommunityNorms" title="社区规范与隐私政策"
        style="position: fixed;top: 0; left: 0; right: 0; bottom: 0; margin: auto;" :width="dialogWidth" :modal="false"
        :append-to-body="true">
        <div v-html="CommunityNorms"></div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
import { ref, computed, watch } from 'vue';
import { User, ChevronDown } from '@lucide/vue';
import { removeToken } from '@/utils/cookieUtils';
import login from './login.vue';
import { CommunityNorms } from '@/common/CommunityNorms';
import register from './register.vue';
import { useIsMobile } from '@/composables/useIsMobile';
import { isRelogin } from '@/apis/httpInstance';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/themeStore';

const authStore = useAuthStore();
const theme = useThemeStore();
const isMobile = useIsMobile();

const loginView = ref(false);
const registerView = ref(false);
const ysCommunityNorms = ref(false);

const dialogWidth = computed(() => (isMobile.value ? '95%' : '400px'));

function loginAndReg() {
    loginView.value = true;
    registerView.value = false;
}

function logout() {
    ElMessageBox.confirm('确定退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        removeToken();
        isRelogin.value.show = false;
    }).catch(() => { });
}

function handleRegister() {
    loginView.value = false;
    registerView.value = true;
}

function closeDialog() {
    loginView.value = false;
}

function handleCommand() {}

watch(
    () => authStore.loginVisible,
    (newVal) => {
        loginView.value = newVal;
    }
);

// 弹窗被用户手动关闭（点 X / 遮罩）时同步 store，避免 store 一直停在 true 导致下次 showLogin 不触发
watch(loginView, (visible) => {
    if (!visible && authStore.loginVisible) {
        authStore.hideLogin();
    }
});
</script>

<style lang='scss' scoped>
.right-menu-item {
    display: inline-flex;
    align-items: center;
    height: 100%;
    vertical-align: middle;
}

.avatar-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 32px;
    color: #fff;
    cursor: pointer;
    padding: 0 6px;
    border-radius: 6px;
    transition: background 0.2s, color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    &.mobile-light {
        color: #333;

        &:hover {
            background: rgba(128, 128, 128, 0.15);
        }
    }
}

.avatar-icon-box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.avatar-icon {
    display: block;
}

.caret-icon {
    display: block;
    opacity: 0.8;
    transition: transform 0.2s ease;
}

.right-menu-item:hover .caret-icon {
    transform: rotate(180deg);
}

.login-status-dot {
    position: absolute;
    bottom: -1px;
    right: -2px;
    width: 7px;
    height: 7px;
    background-color: #10b981;
    border: 1.5px solid currentColor;
    border-radius: 50%;
}

@media (min-width: 601px) {
    .DialogView {
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .avatar-wrapper {
        height: 32px;
    }
}

@media (max-width: 600px) {
    .avatar-wrapper {
        height: 24px;
        padding: 0 4px;
        gap: 2px;
    }
}

:deep(.dialog-main) {
    width: 95%;
}
</style>
