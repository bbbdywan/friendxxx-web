<template>
  <div class="recommend-debug">
    <h2>推荐用户调试</h2>
    
    <!-- 控制按钮 -->
    <div class="controls">
      <van-button 
        type="primary" 
        @click="fetchUsers"
        :loading="loading"
        block
      >
        获取推荐用户 (前2个)
      </van-button>
      
      <van-button 
        @click="clearUsers"
        block
        class="mt-2"
      >
        清空用户列表
      </van-button>
    </div>
    
    <!-- 当前推荐用户状态 -->
    <div class="status-section">
      <h3>当前推荐用户状态</h3>
      <div class="status-info">
        <p><strong>用户数量:</strong> {{ recommendUsers.length }}</p>
        <p><strong>加载状态:</strong> {{ loading ? '加载中' : '已完成' }}</p>
        <p><strong>最后更新:</strong> {{ lastUpdate || '未更新' }}</p>
      </div>
    </div>
    
    <!-- 推荐用户列表 -->
    <div class="users-section" v-if="recommendUsers.length > 0">
      <h3>推荐用户列表</h3>
      <div class="user-list">
        <div 
          v-for="(user, index) in recommendUsers" 
          :key="user.id"
          class="user-item"
        >
          <div class="user-index">{{ index + 1 }}</div>
          <van-image 
            :src="user.avatar"
            width="60"
            height="60"
            round
          />
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-details">
              ID: {{ user.id }} | 年龄: {{ user.age }} | 距离: {{ user.distance.toFixed(1) }}km
            </div>
            <div class="user-tags">
              <van-tag 
                v-for="tag in user.tags" 
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
    
    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <p>暂无推荐用户数据</p>
      <p>点击上方按钮获取数据</p>
    </div>
    
    <!-- API调用日志 -->
    <div class="logs-section">
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
import { ref, onMounted } from 'vue'
import { getUserTagsList } from '../api/user.js'
import { parseTags } from '../api/types.js'
import { showToast } from 'vant'

// 响应式数据
const loading = ref(false)
const recommendUsers = ref([])
const lastUpdate = ref('')
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
  
  // 只保留最近20条日志
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 获取推荐用户
const fetchUsers = async () => {
  try {
    loading.value = true
    // 先清空现有数据
    recommendUsers.value = []
    addLog('开始获取推荐用户列表...', 'info')
    addLog('已清空现有用户列表', 'info')
    
    const response = await getUserTagsList()
    addLog(`API响应: ${JSON.stringify(response)}`, 'info')
    
    if (response.code === 200 || response.code === 0) {
      // 处理用户数据，只取前2个用户作为推荐
      const users = Array.isArray(response.data) ? response.data : response.data?.records || []
      addLog(`原始用户数据长度: ${users.length}`, 'info')
      
      if (users.length === 0) {
        addLog('API返回的用户数据为空', 'warning')
        showToast('没有获取到用户数据')
        return
      }
      
      const processedUsers = users.slice(0, 2).map(user => {
        console.log('处理用户数据:', user)
        const tags = parseTags(user.tags || '[]')
        console.log('解析后的标签:', tags)

        return {
          id: user.id,
          name: user.username || user.userName || user.userAccount || '用户',
          age: user.age || 0,
          distance: Math.random() * 5 + 0.5,
          avatar: user.avatarUrl || user.avatar || `https://picsum.photos/200/200?random=${user.id}`,
          isOnline: Math.random() > 0.5,
          tags: Array.isArray(tags) ? tags.slice(0, 2) : [],
          gender: user.gender,
          signature: user.signature || ''
        }
      })
      
      recommendUsers.value = processedUsers
      lastUpdate.value = new Date().toLocaleString()
      
      addLog(`成功处理 ${processedUsers.length} 个用户`, 'success')
      addLog(`推荐用户列表已更新`, 'success')
      
      showToast({
        type: 'success',
        message: `获取到 ${processedUsers.length} 个推荐用户`
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
    loading.value = false
  }
}

// 清空用户列表
const clearUsers = () => {
  recommendUsers.value = []
  lastUpdate.value = ''
  addLog('已手动清空用户列表', 'info')
  showToast('已清空用户列表')
}

onMounted(() => {
  addLog('推荐用户调试页面加载完成', 'info')
})
</script>

<style scoped>
.recommend-debug {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
}

.mt-2 {
  margin-top: 8px;
}

.status-section, .users-section, .logs-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-info p {
  margin: 8px 0;
  font-size: 14px;
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
  position: relative;
}

.user-index {
  position: absolute;
  top: 5px;
  left: 5px;
  background: var(--primary-pink);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
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
  font-size: 12px;
  margin-bottom: 8px;
}

.user-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background: white;
  border-radius: 8px;
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

.log-item.warning {
  background: #fff3e0;
  color: #f57c00;
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
