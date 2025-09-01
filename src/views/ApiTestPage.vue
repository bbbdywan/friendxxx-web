<template>
  <div class="api-test-page">
    <div class="test-header">
      <h1>API接口测试</h1>
      <p>测试后端接口连接状态</p>
    </div>

    <!-- 连接状态 -->
    <div class="connection-status">
      <div class="status-item" :class="{ connected: apiStatus.connected }">
        <van-icon :name="apiStatus.connected ? 'success' : 'warning-o'" />
        <span>后端连接状态: {{ apiStatus.connected ? '已连接' : '未连接' }}</span>
      </div>
      <div class="api-info">
        <p>API地址: {{ apiBaseUrl }}</p>
        <p>最后测试时间: {{ apiStatus.lastTest || '未测试' }}</p>
      </div>
    </div>

    <!-- 测试按钮 -->
    <div class="test-actions">
      <van-button 
        type="primary" 
        block 
        @click="testConnection"
        :loading="testing"
      >
        测试连接
      </van-button>
    </div>

    <!-- 登录测试 -->
    <div class="test-section">
      <h3>登录接口测试</h3>
      <van-form @submit="testLogin">
        <van-cell-group inset>
          <van-field
            v-model="loginForm.userAccount"
            label="用户名"
            placeholder="请输入测试用户名"
            required
          />
          <van-field
            v-model="loginForm.userpassword"
            type="password"
            label="密码"
            placeholder="请输入测试密码"
            required
          />
        </van-cell-group>
        <div class="form-actions">
          <van-button 
            type="primary" 
            native-type="submit"
            :loading="loginTesting"
            block
          >
            测试登录
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 其他API测试 -->
    <div class="api-tests">
      <h3>其他API测试</h3>
      <div class="test-buttons">
        <van-button
          @click="testGetUserProfile"
          :loading="testing"
          block
        >
          测试获取用户信息
        </van-button>

        <van-button
          @click="testGetUserTags"
          :loading="testing"
          block
        >
          测试获取用户标签
        </van-button>

        <van-button
          @click="testGetGroups"
          :loading="testing"
          block
        >
          测试获取群聊列表
        </van-button>

        <van-button
          @click="testGetOnlineUsers"
          :loading="testing"
          block
        >
          测试获取在线用户
        </van-button>
      </div>
    </div>

    <!-- 测试结果 -->
    <div class="test-results">
      <h3>测试结果</h3>
      <div class="result-list">
        <div 
          v-for="(result, index) in testResults" 
          :key="index"
          class="result-item"
          :class="{ success: result.success, error: !result.success }"
        >
          <div class="result-header">
            <span class="result-method">{{ result.method }}</span>
            <span class="result-url">{{ result.url }}</span>
            <span class="result-status">{{ result.success ? '成功' : '失败' }}</span>
          </div>
          <div class="result-time">{{ result.time }}</div>
          <div v-if="result.data" class="result-data">
            <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
          </div>
          <div v-if="result.error" class="result-error">
            {{ result.error }}
          </div>
        </div>
      </div>
    </div>

    <!-- 清除结果 -->
    <div class="clear-actions">
      <van-button plain @click="clearResults">
        清除结果
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { login, getCurrentUser, updateUser, getUserById, getUserTagsList } from '../api/user.js'
import { getChatMessages, getOnlineUsers, sendServerMessage } from '../api/chat.js'
import { createGroup, getGroupList, joinGroup } from '../api/group.js'
import { showToast } from 'vant'

// 响应式数据
const testing = ref(false)
const loginTesting = ref(false)
const apiStatus = ref({
  connected: false,
  lastTest: null
})

const loginForm = ref({
  userAccount: 'test',
  userpassword: 'test123'
})

const testResults = ref([])

// API基础地址
const apiBaseUrl = '/api' // 使用相对路径

// 添加测试结果
const addTestResult = (method, url, success, data = null, error = null) => {
  testResults.value.unshift({
    method,
    url,
    success,
    data,
    error,
    time: new Date().toLocaleString()
  })
  
  // 只保留最近20条结果
  if (testResults.value.length > 20) {
    testResults.value = testResults.value.slice(0, 20)
  }
}

// 测试连接
const testConnection = async () => {
  testing.value = true

  try {
    // 测试登录接口的OPTIONS请求来检查连接
    const response = await fetch(`${apiBaseUrl}/user/login`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // OPTIONS请求成功或者返回405(方法不允许)都表示服务器在线
    if (response.ok || response.status === 405) {
      apiStatus.value.connected = true
      apiStatus.value.lastTest = new Date().toLocaleString()

      addTestResult('OPTIONS', '/user/login', true, {
        status: 'Server is online',
        statusCode: response.status
      })

      showToast({
        type: 'success',
        message: '后端服务连接成功'
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    apiStatus.value.connected = false
    apiStatus.value.lastTest = new Date().toLocaleString()

    addTestResult('OPTIONS', '/user/login', false, null, error.message)

    showToast({
      type: 'fail',
      message: '连接失败: ' + error.message
    })
  } finally {
    testing.value = false
  }
}

// 测试登录
const testLogin = async () => {
  if (!loginForm.value.userAccount || !loginForm.value.userpassword) {
    showToast('请填写用户名和密码')
    return
  }

  loginTesting.value = true
  
  try {
    const response = await login(loginForm.value)
    
    addTestResult('POST', '/user/login', true, response)
    
    showToast({
      type: 'success',
      message: '登录测试成功'
    })
  } catch (error) {
    addTestResult('POST', '/user/login', false, null, error.message)
    
    showToast({
      type: 'fail',
      message: '登录测试失败: ' + error.message
    })
  } finally {
    loginTesting.value = false
  }
}

// 测试获取用户信息
const testGetUserProfile = async () => {
  try {
    testing.value = true
    const response = await getCurrentUser()
    addTestResult('GET', '/api/user/profile', true, response)
    showToast('获取用户信息成功')
  } catch (error) {
    addTestResult('GET', '/api/user/profile', false, null, error.message)
    showToast('获取用户信息失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// 测试获取用户标签
const testGetUserTags = async () => {
  try {
    testing.value = true
    const response = await getUserTagsList()
    addTestResult('GET', '/api/user/tagsList', true, response)
    showToast('获取用户标签成功')
  } catch (error) {
    addTestResult('GET', '/api/user/tagsList', false, null, error.message)
    showToast('获取用户标签失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// 测试获取群聊列表
const testGetGroups = async () => {
  try {
    testing.value = true
    const response = await getGroupList()
    addTestResult('GET', '/api/group/grouplist', true, response)
    showToast('获取群聊列表成功')
  } catch (error) {
    addTestResult('GET', '/api/group/grouplist', false, null, error.message)
    showToast('获取群聊列表失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// 测试获取在线用户
const testGetOnlineUsers = async () => {
  try {
    testing.value = true
    const response = await getOnlineUsers()
    addTestResult('GET', '/api/websocket/online-users', true, response)
    showToast('获取在线用户成功')
  } catch (error) {
    addTestResult('GET', '/api/websocket/online-users', false, null, error.message)
    showToast('获取在线用户失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

// 清除结果
const clearResults = () => {
  testResults.value = []
  showToast('已清除测试结果')
}

// 页面加载时自动测试连接
onMounted(() => {
  testConnection()
})
</script>

<style scoped>
.api-test-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: var(--spacing-lg);
  padding-bottom: 100px;
}

.test-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.test-header h1 {
  font-size: 24px;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.test-header p {
  color: var(--color-text-secondary);
  margin: 0;
}

.connection-status {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-lg);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.status-item.connected {
  color: #4CAF50;
}

.status-item:not(.connected) {
  color: #ff4757;
}

.api-info p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 4px 0;
}

.test-actions {
  margin-bottom: var(--spacing-lg);
}

.test-section {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-lg);
}

.test-section h3 {
  font-size: 18px;
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
}

.api-tests {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.api-tests h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 15px 0;
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-actions {
  margin-top: var(--spacing-lg);
}

.test-results {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-lg);
}

.test-results h3 {
  font-size: 18px;
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
}

.result-list {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.result-item.success {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.result-item.error {
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.05);
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.result-method {
  background: var(--primary-pink);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.result-url {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  flex: 1;
}

.result-status {
  font-size: 12px;
  font-weight: 600;
}

.result-item.success .result-status {
  color: #4CAF50;
}

.result-item.error .result-status {
  color: #ff4757;
}

.result-time {
  font-size: 10px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.result-data {
  background: #f8f9fa;
  border-radius: 4px;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.result-data pre {
  font-size: 10px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-error {
  color: #ff4757;
  font-size: 12px;
  background: rgba(255, 71, 87, 0.1);
  padding: var(--spacing-sm);
  border-radius: 4px;
}

.clear-actions {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .result-url {
    word-break: break-all;
  }
}
</style>

