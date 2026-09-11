<template>
  <div>
    <el-form ref="resetPasswordRef" :model="resetForm" :rules="resetRules" class="reset-form">
      <h3 class="title">重置密码</h3>
      <el-form-item prop="username">
        <el-input v-model="resetForm.username" type="text" size="large" clearable prefix-icon="Avatar"
          auto-complete="off" placeholder="请输入注册邮箱">
          <template #append>
            <el-button type="primary" :disabled="emailCodeButtonDisabled" size="small" style="padding: 0;font-weight: 500;"
              @click="showSliderDialog">发送邮箱验证码</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="emailCode">
        <el-input v-model="resetForm.emailCode" type="text" maxlength="4" size="large" clearable
          placeholder="请输入邮箱验证码">
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="resetForm.password" type="password" size="large" show-password prefix-icon="Lock"
          auto-complete="off" placeholder="新密码" @keyup.enter="handleReset">
        </el-input>
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input v-model="resetForm.confirmPassword" type="password" size="large" show-password prefix-icon="Lock"
          auto-complete="off" placeholder="确认新密码" @keyup.enter="handleReset">
        </el-input>
      </el-form-item>
      <el-form-item style="width:100%;">
        <el-button :loading="loading" size="large" type="primary" style="width:100%;" @click.prevent="handleReset">
          <span v-if="!loading">重置密码</span>
          <span v-else>重置中...</span>
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 滑动验证对话框 -->
    <el-dialog v-model="sliderDialogVisible" title="安全验证" width="300px" :show-close="false" :close-on-click-modal="false"
      :close-on-press-escape="false" append-to-body>
      <div class="slider-container">
        <div class="slider-text">请滑动至最右侧完成验证</div>
        <el-slider v-model="sliderValue" :min="0" :max="100" :step="1" :show-tooltip="false"
          :disabled="sliderDisabled" @change="handleSliderChange">
          <template #button>
            <div class="slider-button">
              <el-icon v-if="!sliderSuccess"><Right /></el-icon>
              <el-icon v-else><Check /></el-icon>
            </div>
          </template>
        </el-slider>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import httpInstance from "@/apis/httpInstance";
import { Right, Check } from '@element-plus/icons-vue'

const props = defineProps({
  closeDialog: {
    type: Function,
    required: true
  }
});

const resetPasswordRef = ref();
const resetForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  emailCode: "",
});

const equalToPassword = (rule, value, callback) => {
  if (resetForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const resetRules = {
  username: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: "blur", message: "请输入新密码" },
    { min: 6, max: 20, message: "密码长度必须介于 6 和 20 之间，且数字和英文混合", trigger: "blur" },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/, message: "密码必须是数字和英文混合", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入新密码" },
    { required: true, validator: equalToPassword, trigger: "blur" }
  ],
  emailCode: [{ required: true, trigger: "change", message: "请输入邮箱验证码" }],
};

const loading = ref(false);
const emailCodeButtonText = ref("发送邮箱验证码");
const emailCodeButtonDisabled = ref(false);
let emailCodeTimer = null;

const sliderDialogVisible = ref(false);
const sliderValue = ref(0);
const sliderDisabled = ref(false);
const sliderSuccess = ref(false);

function showSliderDialog() {
  if (!resetForm.value.username) {
    ElMessage.info("请先输入邮箱");
    return;
  }
  sliderDialogVisible.value = true;
  sliderValue.value = 0;
  sliderDisabled.value = false;
  sliderSuccess.value = false;
}

function handleSliderChange(value) {
  if (value === 100) {
    sliderDisabled.value = true;
    sliderSuccess.value = true;
    setTimeout(() => {
      sliderDialogVisible.value = false;
      getEmailCode();
    }, 500);
  }
}

function getEmailCode() {
  if (!resetForm.value.username) {
    ElMessage.info("请先输入邮箱");
    return;
  }

  emailCodeButtonDisabled.value = true;
  let count = 10;
  emailCodeButtonText.value = `${count}分钟 后重试`;

  emailCodeTimer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(emailCodeTimer);
      emailCodeButtonDisabled.value = false;
      emailCodeButtonText.value = "发送邮箱验证码";
    } else {
      emailCodeButtonText.value = `邮箱中已有验证码，或请 ${count}分钟 后重试`;
    }
  }, 1000 * 60 * 10);

  httpInstance.get("/login/getMailCode", {
    params: {
      toEMail: resetForm.value.username
    }
  }).then(res => {
    if (res.code === 200) {
      ElMessage.success("验证码已发送，请查收邮箱");
    } else {
      ElMessageBox.alert(res.msg || '邮箱不存在！或其他错误，请联系开发者', '系统提示', {
        confirmButtonText: 'OK'
      });
      clearInterval(emailCodeTimer);
      emailCodeButtonDisabled.value = false;
      emailCodeButtonText.value = "发送邮箱验证码";
    }
  }).catch(() => {
    clearInterval(emailCodeTimer);
    emailCodeButtonDisabled.value = false;
    emailCodeButtonText.value = "发送邮箱验证码";
  });
}

function handleReset() {
  resetPasswordRef.value.validate(valid => {
    if (valid) {
      loading.value = true;
      httpInstance.post('/resetPassword', resetForm.value).then(res => {
        if (res.code === 200) {
          ElMessageBox.alert("密码重置成功！请使用新密码登录", "系统提示", {
            type: "success",
          }).then(() => {
            props.closeDialog();
          }).catch(() => { });
        } else {
          ElMessage.error(res.msg);
          loading.value = false;
        }
      }).catch((error) => {
        ElMessageBox.alert(error.message, "系统提示", {
            type: "success",
          })
        loading.value = false;
      });
    }
  });
}
</script>

<style lang='scss' scoped>
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.reset-form {
  width: 100%;

  .el-input {
    height: 40px;

    input {
      height: 40px;
    }
  }

  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}

.slider-container {
  padding: 20px;
  text-align: center;

  .slider-text {
    margin-bottom: 20px;
    color: #606266;

    html.dark & {
      color: var(--el-text-color-secondary);
    }
  }

  :deep(.el-slider) {
    .el-slider__runway {
      height: 40px;
      background-color: #f5f7fa;
      border-radius: 20px;

      html.dark & {
        background-color: var(--el-fill-color-light);
      }
    }

    .el-slider__bar {
      height: 40px;
      background-color: #409eff;
      border-radius: 20px;
    }

    .el-slider__button-wrapper {
      width: 40px;
      height: 40px;
      top: -20px;
    }

    .slider-button {
      width: 40px;
      height: 40px;
      background-color: var(--card-bg);
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #409eff;
      font-size: 20px;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

:deep(.el-dialog__header) {
  margin-right: 0;
  text-align: center;
  border-bottom: 1px solid #dcdfe6;
  padding: 15px;
}

:deep(.el-dialog__body) {
  padding: 0;
}
</style> 