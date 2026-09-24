<template>
  <div>
    <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="register-form">
      <h3 class="title">注册</h3>
      <el-form-item prop="username">
        <el-input v-model="registerForm.username" type="text" size="large" clearable prefix-icon="Avatar"
          auto-complete="off" placeholder="邮箱-用于登录">
          <template #append>
            <el-button type="primary" :disabled="emailCodeButtonDisabled" size="small" style="padding: 0;font-weight: 500;"
              @click="showMailSecurityDialog">发送邮箱验证码</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item prop="nickName">
        <el-input v-model="registerForm.nickName" type="text" maxlength="20" size="large" clearable
          placeholder="昵称--平台昵称--可改名一次">
        </el-input>
      </el-form-item>
      <!-- 邮箱验证码输入框 -->
      <el-form-item prop="emailCode">
        <el-input v-model="registerForm.emailCode" type="text" maxlength="4" size="large" clearable
          placeholder="请输入邮箱验证码">
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="registerForm.password" type="password" size="large" show-password prefix-icon="Lock"
          auto-complete="off" placeholder="密码" @keyup.enter="handleRegister">
        </el-input>
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input v-model="registerForm.confirmPassword" type="password" size="large" show-password prefix-icon="Lock"
          auto-complete="off" placeholder="确认密码" @keyup.enter="handleRegister">

        </el-input>
      </el-form-item>
      <el-form-item prop="code" v-if="captchaEnabled">
        <el-input size="large" v-model="registerForm.code" auto-complete="off" clearable placeholder="请输入右侧验证码"
          style="width: 63%" @keyup.enter="handleRegister">
          <template #prefix><img src="@/assets/icons/validCode.svg" style="width: 16px;"></template>
        </el-input>
        <div class="register-code">
          <img :src="codeUrl" @click="getCode" class="register-code-img" />
        </div>
      </el-form-item>
      <el-form-item style="width:100%;">
        <TurnstileWidget ref="registerTurnstileRef" action="register" v-model="registerTurnstileToken" />
        <el-button :loading="loading" size="large" type="primary" style="width:100%;" @click.prevent="handleRegister">
          <span v-if="!loading">注 册</span>
          <span v-else>注 册 中...</span>
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 安全验证对话框 (发送邮箱验证码前) -->
    <el-dialog v-model="mailSecurityDialogVisible" title="安全验证" width="360px" :show-close="true" append-to-body>
      <div style="text-align: center; padding: 10px 0;">
        <p style="margin-bottom: 12px; color: #666;">请完成人机验证以发送验证码</p>
        <TurnstileWidget v-if="mailSecurityDialogVisible" ref="mailTurnstileRef" action="mail_code" @success="handleMailTurnstileSuccess" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessageBox, ElMessage } from "element-plus";
import httpInstance from "@/apis/httpInstance";
import TurnstileWidget from "@/components/TurnstileWidget.vue";
import { Right, Check } from '@element-plus/icons-vue'
import { ref } from 'vue'

const registerRef = ref()
const registerForm = ref({
  username: "",
  nickName: "",
  password: "",
  confirmPassword: "",
  code: "",
  uuid: "",
  emailCode: "",

});

const equalToPassword = (rule, value, callback) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const emailLikePattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const notEmailFormat = (rule, value, callback) => {
  if (value && emailLikePattern.test(value)) {
    callback(new Error('昵称不能为邮箱格式'));
  } else {
    callback();
  }
};

const registerRules = {
  username: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: emailLikePattern, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  nickName: [
    { required: true, trigger: 'blur', message: '请输入平台昵称' },
    { validator: notEmailFormat, trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: "blur", message: "请输入您的密码" },
    { min: 6, max: 20, message: "用户密码长度必须介于 6 和 20 之间，且数字和英文混合", trigger: "blur" },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/, message: "密码必须是数字和英文混合", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入您的密码" },
    { required: true, validator: equalToPassword, trigger: "blur" }
  ],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }],
  emailCode: [{ required: true, trigger: "change", message: "请输入邮箱验证码" }],
};

const codeUrl = ref("");
const loading = ref(false);
const captchaEnabled = ref(true);

const emailCodeButtonText = ref("发送邮箱验证码");
const emailCodeButtonDisabled = ref(false);
let emailCodeTimer = null;

const mailSecurityDialogVisible = ref(false);
const mailTurnstileRef = ref();
const registerTurnstileRef = ref();
const registerTurnstileToken = ref("");

function showMailSecurityDialog() {
  if (!registerForm.value.username) {
    ElMessage.info("请先输入邮箱");
    return;
  }
  mailSecurityDialogVisible.value = true;
}

function handleMailTurnstileSuccess(token) {
  mailSecurityDialogVisible.value = false;
  getEmailCode(token);
}

function getEmailCode(token) {
  if (!registerForm.value.username) {
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

  // 发送请求，附带 Turnstile Token
  httpInstance.get("/login/getMailCode", {
    params: {
      toEMail: registerForm.value.username
    },
    headers: {
      'cf-turnstile-response': token
    }
  }).then(res => {
    if (res.code === 200) {
      ElMessage.success("验证码已发送，请查收邮箱");
    } else {
      ElMessageBox.alert(res.msg || '邮箱不存在！ 或其他错误，请联系开发者', '系统提示', {
        confirmButtonText: 'OK'
      });
      clearInterval(emailCodeTimer);
      emailCodeButtonDisabled.value = false;
      emailCodeButtonText.value = "发送邮箱验证码";
    }
  })
    .catch(() => {
      clearInterval(emailCodeTimer);
      emailCodeButtonDisabled.value = false;
      emailCodeButtonText.value = "发送邮箱验证码";
    });
}
function handleRegister() {
  registerRef.value.validate(valid => {
    if (valid) {
      if (!registerTurnstileToken.value) {
        ElMessage.warning('请先完成人机安全验证');
        return;
      }
      loading.value = true;
      httpInstance.post('/register', registerForm.value, {
        headers: {
          'cf-turnstile-response': registerTurnstileToken.value
        }
      }).then(res => {
        const username = registerForm.value.username;
        if (res.code === 200) {
          ElMessageBox.alert("<font color='red'>恭喜你，您的账号 " + username + " 注册成功！</font>", "系统提示", {
            dangerouslyUseHTMLString: true,
            type: "success",
          }).then(() => {
            //注册成功后的操作，跳转到登录页面
          }).catch(() => { });
        } else {
          ElMessage.error(res.msg);
          registerTurnstileRef.value?.reset();
          loading.value = false;
          if (captchaEnabled.value) {
            getCode();
          }
        }

      }).catch(() => {
        registerTurnstileRef.value?.reset();
        loading.value = false;
        if (captchaEnabled.value) {
          getCode();
        }
      });
    }
  });
}

function getCode() {
  httpInstance.get('/captchaImage').then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img;
      registerForm.value.uuid = res.uuid;
    }
  });
}

getCode();
</script>

<style lang='scss' scoped>
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.register-form {
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

.register-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.register-code {
  width: 33%;
  height: 40px;
  float: right;

  img {
    cursor: pointer;
    vertical-align: middle;
  }
}

.el-register-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: var(--body-color);
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}

.register-code-img {
  height: 40px;
  padding-left: 12px;
}

@media (max-width: 601px) {
  .register {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 224px;
    background-image: url("../assets/images/login-background.jpg");
    background-size: cover;
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
