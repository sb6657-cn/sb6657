<template>
    <RouterLink class="card checkin-strip" to="/checkin">
        <span class="strip-title">签到中心</span>
        <span class="strip-status">{{ statusText }}</span>
        <span class="strip-go">{{ goText }}</span>
    </RouterLink>
</template>

<script setup lang="ts">
import { API } from '@/constants/backend';
import { get, isRelogin } from '@/apis/httpInstance';
import { useAuthStore } from '@/stores/useAuthStore';
import { computed, onMounted, ref, watch } from 'vue';

interface CheckinStatus {
    continuous: number;
    coin?: number;
}

const authStore = useAuthStore();
const signed = ref(false);
const continuous = ref(0);

const statusText = computed(() => {
    if (!isRelogin.value.show) {
        return '登录后每天领梗币';
    }
    if (signed.value) {
        return continuous.value > 0 ? `今日已签到 · 连续 ${continuous.value} 天` : '今日已签到';
    }
    return '今日未签到';
});

const goText = computed(() => (isRelogin.value.show && !signed.value ? '去签到' : '去看看'));

async function loadStatus() {
    if (!isRelogin.value.show) {
        signed.value = false;
        continuous.value = 0;
        return;
    }
    const res = await get<CheckinStatus | null>(API.CHECKIN_STATUS);
    if (res._failure) {
        signed.value = false;
        continuous.value = 0;
        return;
    }
    signed.value = !!res.flatData;
    continuous.value = res.flatData?.continuous || 0;
}

onMounted(() => {
    void loadStatus();
});

watch(
    () => [isRelogin.value.show, authStore.loginSuccessTick],
    () => {
        void loadStatus();
    },
);
</script>

<style scoped lang="scss">
.checkin-strip {
    display: flex;
    width: 100%;
    align-items: baseline;
    gap: 10px;
    color: inherit;
    text-decoration: none;

    &:hover {
        color: inherit;
    }

    &:hover .strip-title,
    &:hover .strip-go {
        color: var(--el-color-primary);
    }
}

.strip-title {
    flex-shrink: 0;
    color: var(--body-color);
    font-size: 16px;
    font-weight: 600;
    transition: color 0.15s ease;
}

.strip-status {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
}

.strip-go {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--el-color-primary);
    font-size: 13px;
    transition: color 0.15s ease;
}
</style>
