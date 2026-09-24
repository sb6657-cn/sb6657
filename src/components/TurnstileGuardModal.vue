<template>
  <el-dialog
    v-model="isGuardVisible"
    title="安全验证"
    width="380px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
    append-to-body
  >
    <div class="guard-content">
      <div class="guard-header">
        <el-icon class="shield-icon" :size="36"><Lock /></el-icon>
        <p class="guard-title">Cloudflare 安全验证</p>
        <p class="guard-desc">为抵御恶意脚本压测，请完成人机安全验证</p>
      </div>

      <TurnstileWidget
        v-if="isGuardVisible"
        :action="guardAction"
        @success="handleTurnstileSuccess"
        @error="handleTurnstileError"
      />

      <div v-if="verifying" class="verifying-text">
        <span>正在验证并建立安全连接...</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { SERVER_ADDRESS } from '@/constants/backend';
import TurnstileWidget from '@/components/TurnstileWidget.vue';
import {
  isGuardVisible,
  guardAction,
  resolveTurnstileGuard,
} from '@/composables/useTurnstileGuard';

const verifying = ref(false);

async function handleTurnstileSuccess(token: string) {
  verifying.value = true;
  try {
    const res = await axios.post(`${SERVER_ADDRESS}/turnstile/exchange`, {
      token,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.data && res.data.code === 200 && res.data.pass) {
      resolveTurnstileGuard(res.data.pass);
      ElMessage.success('安全验证通过');
    } else {
      ElMessage.error(res.data?.msg || '人机验证换取失败，请重试');
    }
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.msg || '验证服务连接异常，请重试');
  } finally {
    verifying.value = false;
  }
}

function handleTurnstileError() {
  verifying.value = false;
  ElMessage.error('Cloudflare 验证组件加载失败，请检查网络');
}
</script>

<style scoped>
.guard-content {
  text-align: center;
  padding: 10px 0;
}
.guard-header {
  margin-bottom: 16px;
}
.shield-icon {
  color: #fa8c16;
  margin-bottom: 8px;
}
.guard-title {
  font-size: 16px;
  font-weight: 600;
  margin: 4px 0;
}
.guard-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
}
.verifying-text {
  margin-top: 12px;
  font-size: 13px;
  color: #1677ff;
}
</style>
