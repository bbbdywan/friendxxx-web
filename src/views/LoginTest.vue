<template>
  <div class="login-test">
    <h2>登录流程测试</h2>
    
    <!-- 登录表单 -->
    <div class="login-form">
      <h3>登录测试</h3>
      <van-form @submit="handleLogin">
        <van-field
          v-model="loginForm.userAccount"
          name="userAccount"
          label="账号"
          placeholder="请输入账号"
          required
        />
        <van-field
          v-model="loginForm.userpassword"
          type="password"
          name="userpassword"
          label="密码"
          placeholder="请输入密码"
          required
        />
        <div class="form-actions">
          <van-button 
            type="primary" 
            native-type="submit"
            :loading="loading"
            block
          >
            登录测试
          </van-button>
        </div>
      </van-form>
    </div>
    
    <!-- 状态显示 -->
    <div class="status-display">
      <h3>当前状态</h3>
      <div class="status-item">
        <span class="label">Token:</span>
        <span class="value">{{ token || '无' }}</span>
      </div>
      <div class="status-item">
        <span class="label">用户信息:</span>
        <span class="value">{{ userInfo ? '已加载' : '未加载' }}</span>
      </div>
      <div class="status-item">
        <span class="label">登录状态:</span>
        <span class="value">{{ isLoggedIn ? '已登录' : '未登录' }}</span>
      </div>
    </div>
    
    <!-- 用户信息详情 -->
    <div class="user-details" v-if="userInfo">
      <h3>用户详情</h3>
      <pre>{{ JSON.stringify(userInfo, null, 2) }}</pre>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <van-button @click="testRouteGuard">测试路由守卫</van-button>
      <van-button @click="goToHome">跳转首页</van-button>
      <van-button @click="clearData">清除数据</van-button>
    </div>
    
    <!-- 日志显示 -->
    <div class="logs">
      <h3>操作日志</h3>
      <div class="log-list">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const logs = ref([])

const loginForm = ref({
  userAccount: 'yu666',
  userpassword: '123'
})

// 计算属性
const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 添加日志
const addLog = (message, type = 'info') => {
  const log = {
    time: new Date().toLocaleTimeString(),
    message,
    type
  }
  logs.value.unshift(log)
  console.log(`[${type.toUpperCase()}] ${message}`)
}

// 登录处理
const handleLogin = async () => {
  if (!loginForm.value.userAccount || !loginForm.value.userpassword) {
    addLog('请填写完整信息', 'error')
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  addLog(`开始登录，账号: ${loginForm.value.userAccount}`, 'info')
  
  try {
    const result = await userStore.login(loginForm.value)
    addLog(`登录API响应: ${JSON.stringify(result)}`, 'info')
    
    if (result.success) {
      addLog('登录成功！', 'success')
      addLog(`Token: ${userStore.token}`, 'info')
      addLog(`用户信息: ${JSON.stringify(userStore.userInfo)}`, 'info')
      addLog(`登录状态: ${userStore.isLoggedIn}`, 'info')
      
      showToast({
        type: 'success',
        message: '登录成功'
      })
      
      // 等待一下再跳转
      setTimeout(() => {
        addLog('准备跳转到首页', 'info')
        router.replace('/')
      }, 1000)
    } else {
      addLog(`登录失败: ${result.message}`, 'error')
      showToast({
        type: 'fail',
        message: result.message || '登录失败'
      })
    }
  } catch (error) {
    addLog(`登录异常: ${error.message}`, 'error')
    console.error('登录错误:', error)
    showToast({
      type: 'fail',
      message: '登录失败，请重试'
    })
  } finally {
    loading.value = false
  }
}

// 测试路由守卫
const testRouteGuard = async () => {
  addLog('测试路由守卫...', 'info')
  const status = await userStore.checkLoginStatus()
  addLog(`路由守卫检查结果: ${status}`, status ? 'success' : 'error')
}

// 跳转首页
const goToHome = () => {
  addLog('手动跳转到首页', 'info')
  router.push('/')
}

// 清除数据
const clearData = () => {
  userStore.logout()
  logs.value = []
  addLog('已清除所有数据', 'info')
}

onMounted(() => {
  addLog('登录测试页面加载完成', 'info')
  addLog(`初始状态 - Token: ${token.value ? '有' : '无'}, UserInfo: ${userInfo.value ? '有' : '无'}`, 'info')
})
</script>

<style scoped>
.login-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.login-form, .status-display, .user-details, .actions, .logs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-actions {
  margin-top: 20px;
}

.status-item {
  display: flex;
  margin: 10px 0;
}

.label {
  font-weight: bold;
  width: 100px;
  color: #333;
}

.value {
  color: #666;
  word-break: break-all;
}

.user-details pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  margin: 8px 0;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.log-item.info {
  background: #e3f2fd;
}

.log-item.success {
  background: #e8f5e8;
  color: #2e7d32;
}

.log-item.error {
  background: #ffebee;
  color: #c62828;
}

.log-time {
  margin-right: 10px;
  min-width: 80px;
  font-weight: bold;
}

.log-message {
  word-break: break-all;
}

h2, h3 {
  color: var(--primary-pink);
  margin-top: 0;
}
</style>
