<template>
  <div class="pc-login">
    <div class="login-bg">
      <div class="login-card">
        <div class="login-header">
          <img src="/log.png" alt="Logo" class="login-logo" />
          <h1>心事小屋</h1>
          <p>遇见有趣的灵魂</p>
        </div>

        <el-form ref="formRef" :model="loginForm" :rules="rules" @submit.prevent="handleLogin" class="login-form">
          <el-form-item prop="userAccount" v-if="!isGuestMode">
            <el-input v-model="loginForm.userAccount" placeholder="请输入账号" prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item prop="userpassword" v-if="!isGuestMode">
            <el-input v-model="loginForm.userpassword" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item v-if="isGuestMode">
            <el-input v-model="guestForm.nickname" placeholder="请输入昵称" prefix-icon="User" size="large" />
          </el-form-item>

          <el-form-item>
            <el-button v-if="!isGuestMode" type="primary" size="large" :loading="loading" @click="handleLogin" style="width:100%">
              登 录
            </el-button>
            <el-button v-else type="primary" size="large" :loading="guestLoading" @click="confirmGuestLogin" style="width:100%">
              开始体验
            </el-button>
          </el-form-item>

          <el-form-item>
            <el-button v-if="!isGuestMode" size="large" @click="isGuestMode = true" style="width:100%">
              体验用户一键登录
            </el-button>
            <el-button v-else size="large" @click="isGuestMode = false" style="width:100%">
              返回登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { hrlogin } from '@/api/user.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const guestLoading = ref(false)
const isGuestMode = ref(false)
const loginForm = ref({ userAccount: '', userpassword: '' })
const guestForm = ref({ nickname: '' })

const rules = {
  userAccount: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  userpassword: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginForm.value.userAccount || !loginForm.value.userpassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  try {
    const result = await userStore.login(loginForm.value)
    if (result.success) {
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/pc'
      router.replace(redirect)
    } else {
      ElMessage.error(result.message || '登录失败')
    }
  } catch {
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const confirmGuestLogin = async () => {
  if (!guestForm.value.nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  guestLoading.value = true
  try {
    const response = await hrlogin({
      username: guestForm.value.nickname,
      userPassword: null, userAccount: null, avatarUrl: null, tags: null
    })
    if (response.code === 200) {
      userStore.userInfo = response.data
      localStorage.setItem('userInfo', JSON.stringify(response.data))
      ElMessage.success(`欢迎 ${response.data.userName}！`)
      router.replace(route.query.redirect || '/pc')
    } else {
      ElMessage.error(response.message || '体验登录失败')
    }
  } catch {
    ElMessage.error('体验登录失败，请重试')
  } finally {
    guestLoading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) router.replace('/pc')
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.pc-login {
  height: 100vh;
  overflow: hidden;
}

.login-bg {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #ff6b9d 50%, #f093fb 100%);
}

.login-card {
  width: 420px;
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-logo {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-header p {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
}

.login-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
}

.login-form :deep(.el-button--default) {
  border-radius: 10px;
  font-size: 16px;
}
</style>
