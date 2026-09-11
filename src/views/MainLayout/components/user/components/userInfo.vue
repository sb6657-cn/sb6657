<template>
  <el-form ref="userRef" :model="form" :rules="rules" label-width="80px">
    <el-form-item label="昵称" prop="nickName">
      <el-input v-model="form.nickName" maxlength="30" :disabled="renameQuota <= 0" />
      <span class="rename-tip" v-if="renameQuota >= 0">剩余改名次数：{{ renameQuota }}</span>
    </el-form-item>
    <el-form-item label="手机号">
      <el-input :model-value="form.phonenumber" disabled maxlength="11" />
    </el-form-item>
    <el-form-item label="邮箱">
      <el-input :model-value="form.email" disabled maxlength="50" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">保存</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, getCurrentInstance, watch } from 'vue';
import httpInstance from "@/apis/httpInstance";

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
});
const emit = defineEmits(['nickname-updated']);

const { proxy } = getCurrentInstance();

const form = ref({});
const renameQuota = ref(-1);

const rules = ref({
  nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
});

function submit() {
  proxy.$refs.userRef.validate(valid => {
    if (valid) {
      if (form.value.nickName === props.user?.nickName) {
        proxy.$modal.msgSuccess("修改成功");
        return;
      }
      httpInstance.put("/system/user/profile", { nickName: form.value.nickName }).then(res => {
        proxy.$modal.msgSuccess("修改成功");
        emit('nickname-updated', form.value.nickName);
        if (res && res.data && res.data.renameQuota !== undefined) {
          renameQuota.value = Number(res.data.renameQuota);
        } else if (renameQuota.value > 0) {
          renameQuota.value = renameQuota.value - 1;
        }
      });
    }
  });
}

watch(() => props.user, user => {
  if (user) {
    form.value = { nickName: user.nickName, phonenumber: user.phonenumber, email: user.email };
    if (user.renameQuota === undefined || user.renameQuota === null || user.renameQuota === '') {
      renameQuota.value = 1;
    } else {
      renameQuota.value = Number(user.renameQuota);
    }
  }
},{ immediate: true });
</script>

<style lang="scss" scoped>
.rename-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;

  html.dark & {
    color: var(--el-text-color-secondary);
  }
}
</style>
