<template>
  <div class="login-page">
    <!-- 状态栏背景 -->
    <div class="status-bar"></div>
    
    <!-- 主要内容区域 -->
    <div class="login-container">
      <!-- 标题区域 -->
      <div class="login-header">
        <h1 class="page-title">登录/注册</h1>
        <p class="page-subtitle">点击体验账号一键登录</p>
      </div>

      <!-- 应用图标 -->
      <div class="app-icon-container">
        <div class="app-icon">
          <img src="/friendxxx.png" alt="应用图标" class="icon-image" />
        </div>
      </div>

      <!-- 登录表单 -->
      <div class="login-form-container">
        <van-form @submit="handleLogin" class="login-form">
          <!-- 账号输入框 -->
          <div class="input-group">
            <van-field
              v-if="!isGuestMode"
              v-model="loginForm.userAccount"
              name="userAccount"
              placeholder="请输入账号"
              :border="false"
              class="custom-input"
              :rules="[{ required: true, message: '请输入账号' }]"
              clearable
            />
            <van-field
              v-else
              v-model="guestForm.nickname"
              name="nickname"
              placeholder="请输入昵称"
              :border="false"
              class="custom-input"
              :rules="[{ required: true, message: '请输入昵称' }]"
              clearable
            />
          </div>

          <!-- 密码输入框 -->
          <div v-if="!isGuestMode" class="input-group">
            <van-field
              v-model="loginForm.userpassword"
              type="password"
              name="userpassword"
              placeholder="请输入密码"
              :border="false"
              class="custom-input"
              :rules="[{ required: true, message: '请输入密码' }]"
              clearable
            />
          </div>

          <!-- 登录按钮 -->
          <div class="login-button-container">
            <van-button 
              v-if="!isGuestMode"
              round 
              block 
              type="primary" 
              native-type="submit"
              :loading="loading"
              loading-text="登录中..."
              size="large"
              class="login-button"
            >
              下一步
            </van-button>
            
            <van-button 
              v-else
              round 
              block 
              type="primary" 
              :loading="guestLoading"
              loading-text="登录中..."
              size="large"
              class="login-button"
              @click="confirmGuestLogin"
            >
              开始体验
            </van-button>
            
            <!-- 体验用户一键登录按钮 -->
            <van-button 
              v-if="!isGuestMode"
              round 
              block 
              type="default" 
              :loading="guestLoading"
              loading-text="切换中..."
              size="large"
              class="guest-login-button"
              @click="switchToGuestMode"
            >
              体验用户一键登录
            </van-button>
            
            <!-- 返回登录按钮 -->
            <van-button 
              v-else
              round 
              block 
              type="default" 
              size="large"
              class="guest-login-button"
              @click="switchToLoginMode"
            >
              返回登录
            </van-button>
          </div>
        </van-form>
      </div>

    </div>

    <!-- 忘记密码弹窗 -->
    <van-popup v-model:show="showForgotModal" :style="{ padding: '20px' }">
      <div class="forgot-modal">
        <h3>找回密码</h3>
        <van-form @submit="handleForgotPassword">
          <van-field
            v-model="forgotForm.userAccount"
            label="账号"
            placeholder="请输入用户名或手机号"
            :rules="[{ required: true, message: '请输入账号' }]"
          />
          <van-field
            v-model="forgotForm.phone"
            label="手机号"
            placeholder="请输入绑定的手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
          />
          <div class="forgot-actions">
            <van-button block type="primary" native-type="submit">
              发送验证码
            </van-button>
            <van-button block plain @click="showForgotModal = false">
              取消
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { hrlogin } from '../api/user.js'
import { showToast, showSuccessToast, Toast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const guestLoading = ref(false)
const showForgotModal = ref(false)
const isGuestMode = ref(false)

const loginForm = ref({
  userAccount: '',
  userpassword: ''
})

const guestForm = ref({
  nickname: ''
})

const forgotForm = ref({
  userAccount: '',
  phone: ''
})

// 保存账号到本地存储
const saveAccountToStorage = () => {
  if (rememberAccount.value && loginForm.value.userAccount) {
    localStorage.setItem('rememberedAccount', loginForm.value.userAccount)
    localStorage.setItem('rememberAccountFlag', 'true')
  } else {
    localStorage.removeItem('rememberedAccount')
    localStorage.removeItem('rememberAccountFlag')
  }
}

// 从本地存储加载记住的账号
const loadRememberedAccount = () => {
  const remembered = localStorage.getItem('rememberedAccount')
  const rememberFlag = localStorage.getItem('rememberAccountFlag')
  
  if (remembered && rememberFlag === 'true') {
    loginForm.value.userAccount = remembered
    rememberAccount.value = true
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginForm.value.userAccount || !loginForm.value.userpassword) {
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  
  try {
    console.log('开始登录，参数:', loginForm.value)
    const result = await userStore.login(loginForm.value)
    console.log('登录结果:', result)

    if (result.success) {
      console.log('登录成功，用户信息:', userStore.userInfo)
      console.log('登录状态:', userStore.isLoggedIn)

      // 在登录成功后添加调试
      console.log('准备显示登录成功提示')
      showToast({
        message: '登录成功',
        type: 'success',
        duration: 2000
      })

      setTimeout(() => {
        const redirectPath = route.query.redirect || '/'
        console.log('准备跳转到:', redirectPath)
        router.replace(redirectPath)
      }, 100)
    } else {
      showToast({
        type: 'fail',
        message: result.message || '登录失败'
      })
    }
  } catch (error) {
    console.error('登录错误:', error)
    showToast({
      type: 'fail',
      message: '登录失败，请重试'
    })
  } finally {
    loading.value = false
  }
}

// 其他方法

const handleForgotPassword = () => {
  showToast('验证码已发送')
  showForgotModal.value = false
}

onMounted(() => {
  // 如果已经登录，直接跳转到首页
  if (userStore.isLoggedIn) {
    router.replace('/')
  }
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

// 体验用户一键登录
const handleGuestLogin = async () => {
  guestLoading.value = true
  
  const guestData = {
    userAccount: 'guest',
    userpassword: 'guest123'
  }
  
  try {
    console.log('开始体验用户登录')
    const result = await userStore.login(guestData)
    console.log('体验用户登录结果:', result)

    if (result.success) {
      showToast({
        message: '体验登录成功',
        type: 'success',
        duration: 2000
      })

      setTimeout(() => {
        const redirectPath = route.query.redirect || '/'
        console.log('体验用户跳转到:', redirectPath)
        router.replace(redirectPath)
      }, 100)
    } else {
      showToast({
        type: 'fail',
        message: result.message || '体验登录失败'
      })
    }
  } catch (error) {
    console.error('体验登录错误:', error)
    showToast({
      type: 'fail',
      message: '体验登录失败，请重试'
    })
  } finally {
    guestLoading.value = false
  }
}

// 切换到体验模式
const switchToGuestMode = () => {
  isGuestMode.value = true
  guestForm.value.nickname = ''
}

// 切换回登录模式
const switchToLoginMode = () => {
  isGuestMode.value = false
  loginForm.value.userAccount = ''
  loginForm.value.userpassword = ''
}

// 确认体验登录
const confirmGuestLogin = async () => {
  if (!guestForm.value.nickname) {
    showToast('请输入昵称')
    return
  }

  guestLoading.value = true
  
  const hrData = {
    username: guestForm.value.nickname,
    userPassword: null,
    userAccount: null,
    avatarUrl: null,
    tags: null
  }
  
  try {
    console.log('开始HR体验登录，昵称:', guestForm.value.nickname)
    const response = await hrlogin(hrData)
    console.log('HR登录API响应:', response)

    if (response.code === 200) {
      // 将HR登录返回的数据存储到用户状态中
      const userData = response.data
      userStore.userInfo = userData
      localStorage.setItem('userInfo', JSON.stringify(userData))
      
      showToast({
        message: `欢迎 ${userData.userName}！`,
        type: 'success',
        duration: 2000
      })

      setTimeout(() => {
        const redirectPath = route.query.redirect || '/'
        console.log('HR体验用户跳转到:', redirectPath)
        router.replace(redirectPath)
      }, 100)
    } else {
      showToast({
        type: 'fail',
        message: response.message || 'HR体验登录失败'
      })
    }
  } catch (error) {
    console.error('HR体验登录错误:', error)
    showToast({
      type: 'fail',
      message: 'HR体验登录失败，请重试'
    })
  } finally {
    guestLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #E8F5E8 0%, #F0F8F0 30%, #F8FFF8 70%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 状态栏背景 */
.status-bar {
  height: 44px;
  background: transparent;
}

/* 主容器 */
.login-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 32px;
  align-items: center;
  justify-content: flex-start;
  padding-top: 40px;
}

/* 标题区域 - 参考图片左上角样式 */
.login-header {
  text-align: left;
  width: 100%;
  margin-bottom: 80px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2C2C2C;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.page-subtitle {
  font-size: 15px;
  font-weight: 400;
  color: #666666;
  margin: 0;
  line-height: 1.4;
}

/* 应用图标 - 图标占满整个卡片 */
.app-icon-container {
  margin-bottom: 100px;
}

.app-icon {
  width: 120px;
  height: 120px;
  border-radius: 28px;
  background: #333333;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px;
}

/* 表单容器 */
.login-form-container {
  width: 100%;
  max-width: 320px;
}

.input-group {
  margin-bottom: 20px;
}

.custom-input {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.custom-input :deep(.van-field__control) {
  font-size: 16px;
  padding: 18px 0;
  color: #333;
}

.custom-input :deep(.van-field__control::placeholder) {
  color: #999;
  font-weight: 400;
}

/* 记住账号选项 */
.remember-account {
  margin: 24px 0 32px 0;
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.remember-account :deep(.van-checkbox__label) {
  color: #666;
  font-size: 14px;
  font-weight: 400;
}

.remember-account :deep(.van-checkbox__icon) {
  margin-right: 8px;
}

/* 登录按钮 */
.login-button-container {
  margin-bottom: 20px;
  margin-top: 40px;
}

.login-button {
  background: #333333;
  border: none;
  border-radius: 28px;
  height: 56px;
  font-size: 17px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
}

.login-button:active {
  background: #222222;
  transform: translateY(1px);
}

.login-button:disabled {
  background: #999999;
}

/* 体验用户登录按钮 */
.guest-login-button {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #4CAF50;
  border-radius: 28px;
  height: 56px;
  font-size: 17px;
  font-weight: 600;
  color: #4CAF50;
  box-shadow: 0 2px 12px rgba(76, 175, 80, 0.2);
}

.guest-login-button:active {
  background: rgba(76, 175, 80, 0.1);
  transform: translateY(1px);
}

.guest-login-button:disabled {
  background: #f5f5f5;
  border-color: #ccc;
  color: #999;
}

/* 底部链接 */
.login-footer {
  margin-top: auto;
  padding-bottom: 40px;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.link {
  color: #4CAF50;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.divider {
  color: #ccc;
}

/* 忘记密码弹窗 */
.forgot-modal {
  width: 280px;
}

.forgot-modal h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.forgot-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 0 24px;
    padding-top: 30px;
  }
  
  .app-icon {
    width: 100px;
    height: 100px;
    border-radius: 24px;
  }
  
  .icon-image {
    border-radius: 24px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
}

@media (max-height: 700px) {
  .app-icon-container {
    margin-bottom: 60px;
  }
  
  .login-header {
    margin-bottom: 50px;
  }
  
  .login-container {
    padding-top: 20px;
  }
}
</style>

<style>
/* 全局样式，确保 Toast 正常显示 */
.van-toast {
  z-index: 9999 !important;
  min-width: 96px !important;
  padding: 8px 12px !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: #fff !important;
  border-radius: 6px !important;
}

.van-toast--success {
  background-color: #07c160 !important;
}
</style>






























