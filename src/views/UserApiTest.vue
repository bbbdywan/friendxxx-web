<template>
  <div class="user-api-test">
    <h2>用户API测试</h2>
    
    <!-- 测试按钮 -->
    <div class="test-actions">
      <van-button 
        type="primary" 
        @click="testUserTagsList"
        :loading="loading.tagsList"
        block
      >
        测试获取用户列表 (/user/tagsList)
      </van-button>
      
      <van-button 
        @click="testGetUserById"
        :loading="loading.userDetail"
        block
        class="mt-3"
      >
        测试获取用户详情 (/user/{id})
      </van-button>
    </div>
    
    <!-- 用户列表结果 -->
    <div class="test-result" v-if="usersList.length > 0">
      <h3>用户列表结果</h3>
      <div class="user-list">
        <div 
          v-for="user in usersList" 
          :key="user.id"
          class="user-item"
          @click="selectUser(user)"
        >
          <van-image 
            :src="user.avatar || `https://picsum.photos/60/60?random=${user.id}`"
            width="60"
            height="60"
            round
          />
          <div class="user-info">
            <div class="user-name">{{ user.userName || user.userAccount }}</div>
            <div class="user-details">
              年龄: {{ user.age || '未知' }} | 
              性别: {{ user.gender === 0 ? '男' : user.gender === 1 ? '女' : '未知' }}
            </div>
            <div class="user-tags">
              <van-tag 
                v-for="tag in parseTags(user.tags || '[]').slice(0, 3)" 
                :key="tag"
                size="mini"
                type="primary"
              >
                {{ tag }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 用户详情结果 -->
    <div class="test-result" v-if="selectedUser">
      <h3>用户详情结果</h3>
      <div class="user-detail">
        <pre>{{ JSON.stringify(selectedUser, null, 2) }}</pre>
      </div>
    </div>
    
    <!-- 日志 -->
    <div class="logs">
      <h3>API调用日志</h3>
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
import { ref } from 'vue'
import { getUserTagsList, getUserById } from '../api/user.js'
import { parseTags } from '../api/types.js'
import { showToast } from 'vant'

// 响应式数据
const loading = ref({
  tagsList: false,
  userDetail: false
})

const usersList = ref([])
const selectedUser = ref(null)
const logs = ref([])

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

// 测试获取用户列表
const testUserTagsList = async () => {
  try {
    loading.value.tagsList = true
    addLog('开始调用 /user/tagsList API', 'info')
    
    const response = await getUserTagsList()
    addLog(`API响应: ${JSON.stringify(response)}`, 'info')
    
    if (response.code === 200 || response.code === 0) {
      const users = Array.isArray(response.data) ? response.data : response.data?.records || []
      usersList.value = users
      
      addLog(`成功获取 ${users.length} 个用户`, 'success')
      showToast({
        type: 'success',
        message: `获取到 ${users.length} 个用户`
      })
    } else {
      addLog(`API调用失败: ${response.message}`, 'error')
      showToast({
        type: 'fail',
        message: response.message || 'API调用失败'
      })
    }
  } catch (error) {
    addLog(`API调用异常: ${error.message}`, 'error')
    showToast({
      type: 'fail',
      message: '网络错误，请重试'
    })
  } finally {
    loading.value.tagsList = false
  }
}

// 选择用户并获取详情
const selectUser = async (user) => {
  addLog(`选择用户: ${user.userName || user.userAccount} (ID: ${user.id})`, 'info')
  await testGetUserById(user.id)
}

// 测试获取用户详情
const testGetUserById = async (userId = 1) => {
  try {
    loading.value.userDetail = true
    addLog(`开始调用 /user/${userId} API`, 'info')
    
    const response = await getUserById(userId)
    addLog(`API响应: ${JSON.stringify(response)}`, 'info')
    
    if (response.code === 200 || response.code === 0) {
      selectedUser.value = response.data
      
      addLog(`成功获取用户详情: ${response.data.userName || response.data.userAccount}`, 'success')
      showToast({
        type: 'success',
        message: '获取用户详情成功'
      })
    } else {
      addLog(`API调用失败: ${response.message}`, 'error')
      showToast({
        type: 'fail',
        message: response.message || 'API调用失败'
      })
    }
  } catch (error) {
    addLog(`API调用异常: ${error.message}`, 'error')
    showToast({
      type: 'fail',
      message: '网络错误，请重试'
    })
  } finally {
    loading.value.userDetail = false
  }
}
</script>

<style scoped>
.user-api-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-actions {
  margin-bottom: 20px;
}

.test-result {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #e9ecef;
}

.user-info {
  margin-left: 15px;
  flex: 1;
}

.user-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.user-details {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.user-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.user-detail pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  white-space: pre-wrap;
}

.logs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

.mt-3 {
  margin-top: 12px;
}
</style>
