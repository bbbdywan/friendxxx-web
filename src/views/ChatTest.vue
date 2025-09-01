<template>
  <div class="chat-test">
    <h2>聊天功能测试</h2>
    
    <!-- WebSocket连接状态 -->
    <div class="connection-status">
      <h3>WebSocket连接状态</h3>
      <div class="status-info">
        <p><strong>连接状态:</strong> 
          <span :class="connectionState.isConnected ? 'status-connected' : 'status-disconnected'">
            {{ connectionState.isConnected ? '已连接' : '未连接' }}
          </span>
        </p>
        <p><strong>用户ID:</strong> {{ connectionState.userId || '未设置' }}</p>
        <p><strong>重连次数:</strong> {{ connectionState.reconnectAttempts }}</p>
      </div>
      
      <div class="connection-actions">
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
    
    <!-- 聊天历史测试 -->
    <div class="chat-history-test">
      <h3>聊天历史测试</h3>
      <div class="test-form">
        <van-field
          v-model="testUserId1"
          label="用户1 ID"
          placeholder="请输入用户1的ID"
          type="number"
        />
        <van-field
          v-model="testUserId2"
          label="用户2 ID"
          placeholder="请输入用户2的ID"
          type="number"
        />
        <van-button 
          type="primary" 
          @click="fetchChatHistory"
          :loading="historyLoading"
          block
        >
          获取聊天历史
        </van-button>
      </div>
      
      <!-- 聊天历史结果 -->
      <div class="chat-history-result" v-if="chatHistory.length > 0">
        <h4>聊天历史 ({{ chatHistory.length }} 条消息)</h4>
        <div class="message-list">
          <div 
            v-for="message in chatHistory" 
            :key="message.id"
            class="message-item"
            :class="{ 'sent': message.sender === 'me' }"
          >
            <div class="message-info">
              <span class="sender">{{ message.sender === 'me' ? '我' : '对方' }}</span>
              <span class="time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 消息发送测试 -->
    <div class="message-send-test">
      <h3>消息发送测试</h3>
      <div class="send-form">
        <van-field
          v-model="targetUserId"
          label="目标用户ID"
          placeholder="请输入目标用户ID"
          type="number"
        />
        <van-field
          v-model="messageContent"
          label="消息内容"
          placeholder="请输入要发送的消息"
          type="textarea"
          rows="3"
        />
        <van-button 
          type="primary" 
          @click="sendTestMessage"
          :disabled="!connectionState.isConnected"
          block
        >
          发送消息
        </van-button>
      </div>
    </div>
    
    <!-- 接收到的消息 -->
    <div class="received-messages" v-if="receivedMessages.length > 0">
      <h3>接收到的消息</h3>
      <div class="message-list">
        <div 
          v-for="(message, index) in receivedMessages" 
          :key="index"
          class="received-message"
        >
          <div class="message-info">
            <span class="sender">来自用户: {{ message.fromUserId }}</span>
            <span class="time">{{ formatTime(new Date()) }}</span>
          </div>
          <div class="message-content">{{ message.message }}</div>
        </div>
      </div>
    </div>
    
    <!-- 操作日志 -->
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
import { ref, onMounted, onUnmounted } from 'vue'
import { getChatMessages } from '../api/chat.js'
import { useUserStore } from '../stores/user.js'
import wsManager from '../utils/websocket.js'
import { showToast } from 'vant'

const userStore = useUserStore()

// 响应式数据
const connecting = ref(false)
const historyLoading = ref(false)
const connectionState = ref({
  isConnected: false,
  userId: null,
  reconnectAttempts: 0
})

const testUserId1 = ref(1)
const testUserId2 = ref(2)
const targetUserId = ref(2)
const messageContent = ref('你好，这是一条测试消息')

const chatHistory = ref([])
const receivedMessages = ref([])
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

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString()
}

// 连接WebSocket
const connectWebSocket = async () => {
  try {
    connecting.value = true
    addLog('开始连接WebSocket...', 'info')
    
    const userId = userStore.userInfo?.id || 1
    await wsManager.connect(userId)
    
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
  wsManager.disconnect()
  updateConnectionState()
  addLog('WebSocket连接已断开', 'info')
  
  showToast('WebSocket连接已断开')
}

// 处理WebSocket消息
const handleWebSocketMessage = (message) => {
  addLog(`收到WebSocket消息: ${JSON.stringify(message)}`, 'success')
  receivedMessages.value.unshift(message)
  
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

// 更新连接状态
const updateConnectionState = () => {
  connectionState.value = wsManager.getConnectionState()
}

// 获取聊天历史
const fetchChatHistory = async () => {
  try {
    historyLoading.value = true
    addLog(`获取聊天历史: 用户${testUserId1.value} 和 用户${testUserId2.value}`, 'info')
    
    const response = await getChatMessages(testUserId1.value, testUserId2.value)
    addLog(`聊天历史API响应: ${JSON.stringify(response)}`, 'info')
    
    if (response.code === 200 || response.code === 0) {
      const data = response.data
      
      if (data.messageList && Array.isArray(data.messageList)) {
        chatHistory.value = data.messageList.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.type || 'text',
          sender: msg.senderId == testUserId1.value ? 'me' : 'other',
          timestamp: new Date(msg.createTime),
          senderId: msg.senderId,
          receiverId: msg.receiverId
        }))
        
        addLog(`成功获取 ${chatHistory.value.length} 条聊天记录`, 'success')
        showToast({
          type: 'success',
          message: `获取到 ${chatHistory.value.length} 条聊天记录`
        })
      } else {
        addLog('聊天历史数据为空', 'warning')
        chatHistory.value = []
      }
    } else {
      addLog(`获取聊天历史失败: ${response.message}`, 'error')
      showToast({
        type: 'fail',
        message: response.message || '获取聊天历史失败'
      })
    }
  } catch (error) {
    addLog(`获取聊天历史异常: ${error.message}`, 'error')
    showToast({
      type: 'fail',
      message: '网络错误，请重试'
    })
  } finally {
    historyLoading.value = false
  }
}

// 发送测试消息
const sendTestMessage = () => {
  if (!messageContent.value.trim()) {
    showToast('请输入消息内容')
    return
  }
  
  if (!connectionState.value.isConnected) {
    showToast('WebSocket未连接')
    return
  }
  
  addLog(`发送消息到用户${targetUserId.value}: ${messageContent.value}`, 'info')
  
  const success = wsManager.sendMessage('private', targetUserId.value, messageContent.value)
  
  if (success) {
    addLog('消息发送成功', 'success')
    showToast({
      type: 'success',
      message: '消息发送成功'
    })
    messageContent.value = ''
  } else {
    addLog('消息发送失败', 'error')
    showToast({
      type: 'fail',
      message: '消息发送失败'
    })
  }
}

onMounted(() => {
  addLog('聊天测试页面加载完成', 'info')
  updateConnectionState()
})

onUnmounted(() => {
  // 清理WebSocket连接
  wsManager.removeMessageHandler(handleWebSocketMessage)
  wsManager.removeConnectionHandler(handleConnectionChange)
})
</script>

<style scoped>
.chat-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.connection-status, .chat-history-test, .message-send-test, .received-messages, .logs {
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
  gap: 10px;
  margin-top: 15px;
}

.test-form, .send-form {
  margin-bottom: 15px;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.message-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #f8f9fa;
}

.message-item.sent {
  background: #e3f2fd;
  margin-left: 20px;
}

.received-message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #e8f5e8;
}

.message-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.message-content {
  font-size: 14px;
  color: #333;
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

h2, h3, h4 {
  color: var(--primary-pink);
  margin-top: 0;
}
</style>
