<template>
  <div class="debug-page">
    <div class="debug-header">
      <h1>调试页面</h1>
      <p>检查用户信息和API状态</p>
    </div>

    <!-- 登录状态 -->
    <div class="debug-section">
      <h3>登录状态</h3>
      <div class="debug-info">
        <p><strong>Token:</strong> {{ token || '无' }}</p>
        <p><strong>用户信息:</strong> {{ userInfo ? '已加载' : '未加载' }}</p>
        <p><strong>登录状态:</strong> {{ isLoggedIn ? '已登录' : '未登录' }}</p>
      </div>
    </div>

    <!-- 用户信息 -->
    <div class="debug-section" v-if="userInfo">
      <h3>用户信息</h3>
      <div class="debug-info">
        <pre>{{ JSON.stringify(userInfo, null, 2) }}</pre>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="debug-actions">
      <van-button type="primary" @click="testGetProfile" :loading="loading">
        测试获取用户信息
      </van-button>
      <van-button @click="clearStorage">清除本地存储</van-button>
      <van-button @click="goToLogin">跳转登录</van-button>
    </div>

    <!-- 测试结果 -->
    <div class="debug-section" v-if="testResult">
      <h3>测试结果</h3>
      <div class="debug-info">
        <pre>{{ testResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { getCurrentUser } from '../api/user.js'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const testResult = ref('')

// 计算属性
const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 测试获取用户信息
const testGetProfile = async () => {
  loading.value = true
  testResult.value = ''
  
  try {
    console.log('开始测试获取用户信息...')
    
    // 检查token
    const currentToken = localStorage.getItem('token')
    console.log('当前token:', currentToken)
    
    if (!currentToken) {
      testResult.value = '错误: 没有找到token，请先登录'
      return
    }
    
    // 调用API
    const response = await getCurrentUser()
    console.log('API响应:', response)
    
    testResult.value = JSON.stringify({
      success: true,
      response: response,
      timestamp: new Date().toLocaleString()
    }, null, 2)
    
    // 如果成功，更新store
    if (response.code === 200 || response.code === 0) {
      await userStore.fetchCurrentUser()
    }
    
  } catch (error) {
    console.error('测试失败:', error)
    testResult.value = JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toLocaleString()
    }, null, 2)
  } finally {
    loading.value = false
  }
}

// 清除本地存储
const clearStorage = () => {
  localStorage.clear()
  userStore.logout()
  testResult.value = '本地存储已清除'
}

// 跳转登录
const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  console.log('调试页面加载完成')
  console.log('当前用户store状态:', {
    token: userStore.token,
    userInfo: userStore.userInfo,
    isLoggedIn: userStore.isLoggedIn
  })
})
</script>

<style scoped>
.debug-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-header {
  text-align: center;
  margin-bottom: 30px;
}

.debug-header h1 {
  color: var(--primary-pink);
  margin-bottom: 10px;
}

.debug-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.debug-section h3 {
  color: var(--color-text);
  margin-bottom: 15px;
  border-bottom: 2px solid var(--primary-pink);
  padding-bottom: 5px;
}

.debug-info {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}

.debug-info p {
  margin: 5px 0;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.debug-actions .van-button {
  flex: 1;
  min-width: 120px;
}

@media (max-width: 768px) {
  .debug-page {
    padding: 10px;
  }
  
  .debug-actions {
    flex-direction: column;
  }
  
  .debug-actions .van-button {
    flex: none;
  }
}
</style>
