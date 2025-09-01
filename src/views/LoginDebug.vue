<template>
  <div class="login-debug">
    <h2>登录状态调试</h2>
    
    <div class="status-info">
      <h3>当前状态</h3>
      <p><strong>Token:</strong> {{ token || '无' }}</p>
      <p><strong>用户信息:</strong> {{ userInfo ? '已加载' : '未加载' }}</p>
      <p><strong>登录状态:</strong> {{ isLoggedIn ? '已登录' : '未登录' }}</p>
      <p><strong>当前路由:</strong> {{ $route.path }}</p>
    </div>
    
    <div class="user-info" v-if="userInfo">
      <h3>用户详情</h3>
      <pre>{{ JSON.stringify(userInfo, null, 2) }}</pre>
    </div>
    
    <div class="actions">
      <van-button type="primary" @click="testLogin">测试登录</van-button>
      <van-button @click="logout">退出登录</van-button>
      <van-button @click="goHome">去首页</van-button>
      <van-button @click="refreshStatus">刷新状态</van-button>
    </div>
    
    <div class="logs">
      <h3>操作日志</h3>
      <div class="log-item" v-for="(log, index) in logs" :key="index">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const logs = ref([])

const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const addLog = (message) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  console.log(message)
}

const testLogin = async () => {
  addLog('开始测试登录')
  
  const testData = {
    userAccount: 'yu666',
    userpassword: '123'
  }
  
  try {
    const result = await userStore.login(testData)
    addLog(`登录结果: ${JSON.stringify(result)}`)
    
    if (result.success) {
      showToast('登录成功')
      addLog('登录成功，准备跳转')
      setTimeout(() => {
        router.replace('/')
      }, 1000)
    } else {
      showToast('登录失败')
    }
  } catch (error) {
    addLog(`登录错误: ${error.message}`)
    showToast('登录出错')
  }
}

const logout = async () => {
  await userStore.logout()
  addLog('已退出登录')
  showToast('已退出登录')
}

const goHome = () => {
  addLog('尝试跳转到首页')
  router.push('/')
}

const refreshStatus = () => {
  addLog(`刷新状态 - Token: ${token.value ? '有' : '无'}, UserInfo: ${userInfo.value ? '有' : '无'}, IsLoggedIn: ${isLoggedIn.value}`)
}

onMounted(() => {
  addLog('登录调试页面加载完成')
  refreshStatus()
})
</script>

<style scoped>
.login-debug {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.status-info, .user-info, .actions, .logs {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-info p {
  margin: 8px 0;
}

.user-info pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.log-item {
  display: flex;
  margin: 5px 0;
  font-size: 14px;
}

.log-time {
  color: #666;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  color: #333;
}

h2, h3 {
  color: var(--primary-pink);
  margin-top: 0;
}
</style>
