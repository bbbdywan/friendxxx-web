<template>
  <div class="chat-debug">
    <h2>聊天显示调试</h2>
    
    <!-- 消息列表调试 -->
    <div class="messages-debug">
      <h3>消息列表调试</h3>
      <div class="debug-info">
        <p><strong>消息数量:</strong> {{ messages.length }}</p>
        <p><strong>用户ID:</strong> {{ userStore.userInfo?.id }}</p>
        <p><strong>聊天对象ID:</strong> {{ chatUserId }}</p>
      </div>
      
      <!-- 原始消息数据 -->
      <div class="raw-data">
        <h4>原始消息数据</h4>
        <pre>{{ JSON.stringify(messages, null, 2) }}</pre>
      </div>
      
      <!-- 消息显示测试 -->
      <div class="message-display-test">
        <h4>消息显示测试</h4>
        <div class="test-messages">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="test-message-item"
            :class="{ 'sent': message.sender === 'me' }"
          >
            <div class="message-header">
              <span class="sender">{{ message.sender === 'me' ? '我' : '对方' }}</span>
              <span class="time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-body">
              <div class="content">{{ message.content }}</div>
              <div class="type">类型: {{ message.type }}</div>
              <div class="ids">发送者: {{ message.senderId }}, 接收者: {{ message.receiverId }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <van-button type="primary" @click="loadTestMessages" block>
        加载测试消息
      </van-button>
      
      <van-button @click="fetchRealChatHistory" :loading="loading" block class="mt-2">
        获取真实聊天记录
      </van-button>
      
      <van-button @click="addTestMessage" block class="mt-2">
        添加测试消息
      </van-button>
      
      <van-button @click="clearMessages" block class="mt-2">
        清空消息
      </van-button>
    </div>
    
    <!-- 发送消息测试 -->
    <div class="send-test">
      <h3>发送消息测试</h3>
      <van-field
        v-model="testMessage"
        placeholder="输入测试消息"
        type="textarea"
        rows="2"
      />
      <van-button type="primary" @click="sendTestMessage" block class="mt-2">
        发送测试消息
      </van-button>
    </div>
    
    <!-- 日志 -->
    <div class="logs">
      <h3>操作日志</h3>
      <div class="log-list">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
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
import { getChatMessages } from '../api/chat.js'
import { useUserStore } from '../stores/user.js'
import { showToast } from 'vant'

const userStore = useUserStore()

// 响应式数据
const messages = ref([])
const loading = ref(false)
const testMessage = ref('这是一条测试消息')
const chatUserId = ref(2)
const logs = ref([])

// 添加日志
const addLog = (message) => {
  const log = {
    time: new Date().toLocaleTimeString(),
    message
  }
  logs.value.unshift(log)
  console.log(message)
  
  // 只保留最近10条日志
  if (logs.value.length > 10) {
    logs.value = logs.value.slice(0, 10)
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '无时间'
  try {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (error) {
    return '时间错误'
  }
}

// 加载测试消息
const loadTestMessages = () => {
  messages.value = [
    {
      id: 1,
      content: '你好，这是第一条测试消息',
      type: 'text',
      sender: 'other',
      timestamp: new Date(Date.now() - 60000),
      senderId: 2,
      receiverId: 1
    },
    {
      id: 2,
      content: '你好，这是我的回复',
      type: 'text',
      sender: 'me',
      timestamp: new Date(Date.now() - 30000),
      senderId: 1,
      receiverId: 2
    },
    {
      id: 3,
      content: '这是最新的一条消息',
      type: 'text',
      sender: 'other',
      timestamp: new Date(),
      senderId: 2,
      receiverId: 1
    }
  ]
  
  addLog(`加载了 ${messages.value.length} 条测试消息`)
}

// 获取真实聊天记录
const fetchRealChatHistory = async () => {
  try {
    loading.value = true
    addLog('开始获取真实聊天记录...')
    
    const userId1 = userStore.userInfo?.id || 1
    const userId2 = chatUserId.value
    
    addLog(`获取用户 ${userId1} 和用户 ${userId2} 的聊天记录`)
    
    const response = await getChatMessages(userId1, userId2)
    addLog(`API响应: ${JSON.stringify(response)}`)
    
    if (response.code === 200 || response.code === 0) {
      const data = response.data
      
      if (data.messageList && Array.isArray(data.messageList)) {
        addLog(`原始消息数据: ${JSON.stringify(data.messageList)}`)
        
        messages.value = data.messageList.map((msg, index) => {
          const processedMsg = {
            id: msg.id,
            content: msg.content,
            type: msg.type || 'text',
            sender: msg.senderId == userId1 ? 'me' : 'other',
            timestamp: new Date(msg.createTime),
            senderId: msg.senderId,
            receiverId: msg.receiverId
          }
          
          addLog(`处理消息 ${index}: ${JSON.stringify(processedMsg)}`)
          return processedMsg
        })
        
        addLog(`成功处理 ${messages.value.length} 条消息`)
        showToast({
          type: 'success',
          message: `获取到 ${messages.value.length} 条消息`
        })
      } else {
        addLog('消息列表为空或格式错误')
        messages.value = []
      }
    } else {
      addLog(`API调用失败: ${response.message}`)
      showToast({
        type: 'fail',
        message: response.message || '获取聊天记录失败'
      })
    }
  } catch (error) {
    addLog(`获取聊天记录异常: ${error.message}`)
    showToast({
      type: 'fail',
      message: '网络错误，请重试'
    })
  } finally {
    loading.value = false
  }
}

// 添加测试消息
const addTestMessage = () => {
  const newMessage = {
    id: Date.now(),
    content: testMessage.value,
    type: 'text',
    sender: 'me',
    timestamp: new Date(),
    senderId: userStore.userInfo?.id || 1,
    receiverId: chatUserId.value
  }
  
  messages.value.push(newMessage)
  addLog(`添加测试消息: ${testMessage.value}`)
}

// 发送测试消息
const sendTestMessage = () => {
  addTestMessage()
  testMessage.value = `测试消息 ${Date.now()}`
}

// 清空消息
const clearMessages = () => {
  messages.value = []
  addLog('已清空所有消息')
}

onMounted(() => {
  addLog('聊天调试页面加载完成')
  addLog(`当前用户: ${JSON.stringify(userStore.userInfo)}`)
})
</script>

<style scoped>
.chat-debug {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.messages-debug, .actions, .send-test, .logs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.debug-info p {
  margin: 8px 0;
  font-size: 14px;
}

.raw-data pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.test-messages {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.test-message-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  background: #f8f9fa;
}

.test-message-item.sent {
  background: #e3f2fd;
  margin-left: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.message-body {
  font-size: 14px;
}

.content {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.type, .ids {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mt-2 {
  margin-top: 8px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  margin: 5px 0;
  font-size: 14px;
  padding: 5px;
  background: #f8f9fa;
  border-radius: 4px;
}

.log-time {
  margin-right: 10px;
  min-width: 80px;
  font-weight: bold;
  color: #666;
}

.log-message {
  word-break: break-all;
  color: #333;
}

h2, h3, h4 {
  color: var(--primary-pink);
  margin-top: 0;
}
</style>
