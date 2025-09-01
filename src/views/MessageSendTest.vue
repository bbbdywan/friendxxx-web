<template>
  <div class="message-send-test">
    <h2>消息发送测试</h2>
    
    <!-- WebSocket连接状态 -->
    <div class="connection-section">
      <h3>WebSocket连接</h3>
      <div class="connection-info">
        <p><strong>连接状态:</strong> 
          <span :class="connectionState.isConnected ? 'status-connected' : 'status-disconnected'">
            {{ connectionState.isConnected ? '已连接' : '未连接' }}
          </span>
        </p>
        <p><strong>连接用户ID:</strong> {{ connectionState.userId }}</p>
        <p><strong>WebSocket URL:</strong> ws://127.0.0.1:8080/api/websocket/{{ currentUserId }}</p>
      </div>
      
      <div class="connection-actions">
        <van-field
          v-model="currentUserId"
          label="当前用户ID"
          placeholder="输入当前用户ID"
          type="number"
        />
        <van-button 
          type="primary" 
          @click="connectWebSocket"
          :loading="connecting"
          :disabled="connectionState.isConnected"
        >
          连接WebSocket
        </van-button>
        <van-button 
          @click="disconnectWebSocket"
          :disabled="!connectionState.isConnected"
        >
          断开连接
        </van-button>
      </div>
    </div>
    
    <!-- 消息发送测试 -->
    <div class="send-section">
      <h3>发送消息</h3>
      <div class="send-form">
        <van-field
          v-model="targetUserId"
          label="目标用户ID"
          placeholder="输入目标用户ID"
          type="number"
        />
        <van-field
          v-model="messageContent"
          label="消息内容"
          placeholder="输入要发送的消息"
          type="textarea"
          rows="3"
        />
        <van-button 
          type="primary" 
          @click="sendMessage"
          :disabled="!connectionState.isConnected"
          block
        >
          发送消息
        </van-button>
      </div>
      
      <!-- 发送的消息格式预览 -->
      <div class="message-preview">
        <h4>将要发送的消息格式:</h4>
        <pre>{{ messagePreview }}</pre>
      </div>
    </div>
    
    <!-- 接收到的消息 -->
    <div class="received-section" v-if="receivedMessages.length > 0">
      <h3>接收到的消息</h3>
      <div class="message-list">
        <div 
          v-for="(message, index) in receivedMessages" 
          :key="index"
          class="received-message"
        >
          <div class="message-header">
            <span class="time">{{ formatTime(message.timestamp) }}</span>
            <span class="type">{{ message.type }}</span>
          </div>
          <div class="message-body">
            <pre>{{ JSON.stringify(message.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 发送历史 -->
    <div class="sent-section" v-if="sentMessages.length > 0">
      <h3>发送历史</h3>
      <div class="message-list">
        <div 
          v-for="(message, index) in sentMessages" 
          :key="index"
          class="sent-message"
        >
          <div class="message-header">
            <span class="time">{{ formatTime(message.timestamp) }}</span>
            <span class="status" :class="message.success ? 'success' : 'failed'">
              {{ message.success ? '成功' : '失败' }}
            </span>
          </div>
          <div class="message-body">
            <pre>{{ JSON.stringify(message.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作日志 -->
    <div class="logs-section">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import wsManager from '../utils/websocket.js'
import { showToast } from 'vant'

// 响应式数据
const connecting = ref(false)
const currentUserId = ref(1)
const targetUserId = ref(2)
const messageContent = ref('你好，这是一条测试消息')

const connectionState = ref({
  isConnected: false,
  userId: null
})

const receivedMessages = ref([])
const sentMessages = ref([])
const logs = ref([])

// 计算属性：消息预览
const messagePreview = computed(() => {
  return JSON.stringify({
    type: 'private',
    toUserId: String(targetUserId.value),
    message: messageContent.value
  }, null, 2)
})

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

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 更新连接状态
const updateConnectionState = () => {
  connectionState.value = wsManager.getConnectionState()
}

// 连接WebSocket
const connectWebSocket = async () => {
  try {
    connecting.value = true
    addLog(`开始连接WebSocket，用户ID: ${currentUserId.value}`, 'info')
    
    await wsManager.connect(currentUserId.value)
    
    // 添加消息处理器
    wsManager.addMessageHandler(handleWebSocketMessage)
    wsManager.addConnectionHandler(handleConnectionChange)
    
    updateConnectionState()
    addLog('WebSocket连接成功', 'success')
    
    showToast({
      type: 'success',
      message: 'WebSocket连接成功'
    })
  } catch (error) {
    addLog(`WebSocket连接失败: ${error.message}`, 'error')
    showToast({
      type: 'fail',
      message: 'WebSocket连接失败'
    })
  } finally {
    connecting.value = false
  }
}

// 断开WebSocket
const disconnectWebSocket = () => {
  wsManager.removeMessageHandler(handleWebSocketMessage)
  wsManager.removeConnectionHandler(handleConnectionChange)
  wsManager.disconnect()
  updateConnectionState()
  addLog('WebSocket连接已断开', 'info')
  
  showToast('WebSocket连接已断开')
}

// 处理WebSocket消息
const handleWebSocketMessage = (message) => {
  addLog(`收到WebSocket消息: ${JSON.stringify(message)}`, 'success')
  
  receivedMessages.value.unshift({
    timestamp: new Date(),
    type: 'received',
    data: message
  })
  
  // 只保留最近10条消息
  if (receivedMessages.value.length > 10) {
    receivedMessages.value = receivedMessages.value.slice(0, 10)
  }
}

// 处理连接状态变化
const handleConnectionChange = (event) => {
  addLog(`连接状态变化: ${event.type}`, 'info')
  updateConnectionState()
}

// 发送消息
const sendMessage = () => {
  if (!messageContent.value.trim()) {
    showToast('请输入消息内容')
    return
  }
  
  if (!connectionState.value.isConnected) {
    showToast('WebSocket未连接')
    return
  }
  
  const messageData = {
    type: 'private',
    toUserId: String(targetUserId.value),
    message: messageContent.value.trim()
  }
  
  addLog(`发送消息: ${JSON.stringify(messageData)}`, 'info')
  
  const success = wsManager.sendMessage('private', targetUserId.value, messageContent.value.trim())
  
  // 记录发送历史
  sentMessages.value.unshift({
    timestamp: new Date(),
    success: success,
    data: messageData
  })
  
  // 只保留最近10条发送记录
  if (sentMessages.value.length > 10) {
    sentMessages.value = sentMessages.value.slice(0, 10)
  }
  
  if (success) {
    addLog('消息发送成功', 'success')
    showToast({
      type: 'success',
      message: '消息发送成功'
    })
  } else {
    addLog('消息发送失败', 'error')
    showToast({
      type: 'fail',
      message: '消息发送失败'
    })
  }
}

onMounted(() => {
  addLog('消息发送测试页面加载完成', 'info')
  updateConnectionState()
})

onUnmounted(() => {
  // 清理WebSocket连接
  wsManager.removeMessageHandler(handleWebSocketMessage)
  wsManager.removeConnectionHandler(handleConnectionChange)
})
</script>

<style scoped>
.message-send-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.connection-section, .send-section, .received-section, .sent-section, .logs-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.connection-info p {
  margin: 8px 0;
  font-size: 14px;
}

.status-connected {
  color: #07c160;
  font-weight: bold;
}

.status-disconnected {
  color: #ee0a24;
  font-weight: bold;
}

.connection-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.send-form {
  margin-bottom: 20px;
}

.message-preview {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.message-preview pre {
  margin: 0;
  font-size: 14px;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
}

.received-message, .sent-message {
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.received-message {
  background: #e8f5e8;
}

.sent-message {
  background: #e3f2fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.status.success {
  color: #07c160;
  font-weight: bold;
}

.status.failed {
  color: #ee0a24;
  font-weight: bold;
}

.message-body pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  margin: 5px 0;
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

h2, h3, h4 {
  color: var(--primary-pink);
  margin-top: 0;
}
</style>
