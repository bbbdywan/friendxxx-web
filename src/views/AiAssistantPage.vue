<template>
  <div class="ai-assistant-page">
    <!-- 简单的顶部标题 -->
    <div class="header">
      <van-icon name="arrow-left" @click="$router.back()" />
      <h1>AI智能助手</h1>
      <van-icon name="delete-o" @click="clearChat" />
    </div>
    
    <!-- 聊天区域 -->
    <div class="chat-container" ref="chatContent">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message-wrapper"
        :class="{ 'user-wrapper': message.isUser, 'ai-wrapper': !message.isUser }"
      >
        <!-- AI头像 -->
        <img 
          v-if="!message.isUser" 
          src="/aiimage.jpg" 
          class="avatar ai-avatar"
          alt="AI"
        />
        
        <!-- 消息内容 -->
        <div class="message" :class="{ 'user': message.isUser, 'ai': !message.isUser }">
          {{ message.content }}
          <span v-if="message.isStreaming" class="cursor">|</span>
        </div>
        
        <!-- 用户头像 -->
        <img 
          v-if="message.isUser" 
          :src="userStore.userInfo?.avatar || 'https://picsum.photos/40/40?random=me'" 
          class="avatar user-avatar"
          alt="用户"
        />
      </div>
      
      <!-- 打字指示器 - 只在用户发送消息后AI回复时显示 -->
      <div v-if="isLoading && !isPreheating" class="message-wrapper ai-wrapper">
        <img src="/aiimage.jpg" class="avatar ai-avatar" alt="AI" />
        <div class="typing">
          <span>AI正在思考</span>
          <div class="dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <input 
        v-model="inputText"
        @keyup.enter="handleSend"
        :placeholder="isPreheating ? 'AI正在准备中...' : '输入消息...'"
        :disabled="isLoading"
      />
      <button 
        @click="handleSend"
        :disabled="!inputText.trim() || isLoading || isPreheating"
      >
        {{ isPreheating ? '准备中' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { createOriginalStreamApi } from '../utils/aiChatApi.js'
import { useUserStore } from '../stores/user.js'
import { showToast, showDialog } from 'vant'

const userStore = useUserStore()
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const chatContent = ref(null)
const isPreheating = ref(false) // 不需要预热，因为后端没有预热接口
let messageId = 1

// 创建API配置 - 使用与原版完全一致的实现
const apiConfig = createOriginalStreamApi()

// 预热AI服务（简化版，因为后端没有预热接口）
const preheatAI = async () => {
  console.log('后端没有预热接口，跳过预热步骤')
  isPreheating.value = false
}

// 发送消息
const handleSend = async () => {
  if (!inputText.value.trim() || isLoading.value) return

  // 如果还在预热中，等待预热完成
  if (isPreheating.value) {
    showToast('AI正在准备中，请稍候...')
    return
  }

  const userMessage = {
    id: messageId++,
    content: inputText.value,
    isUser: true,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const query = inputText.value
  inputText.value = ''
  
  await scrollToBottom()

  try {
    isLoading.value = true
    await handleStreamChat(query)
  } catch (error) {
    console.error('AI聊天错误:', error)
    
    const errorMessage = {
      id: messageId++,
      content: '抱歉，我现在无法回答你的问题，请稍后再试。',
      isUser: false,
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
    
    showToast('发送失败，请重试')
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// 处理流式聊天
const handleStreamChat = async (query) => {
  try {
    const userId = userStore.userInfo?.id || 'demo-user'

    const aiMessage = reactive({
      id: messageId++,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    })

    messages.value.push(aiMessage)
    await scrollToBottom()

    await apiConfig.streamChat(query, userId, (chunk) => {
      aiMessage.content += chunk
      scrollToBottom()
    })

    aiMessage.isStreaming = false

  } catch (error) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.isStreaming) {
      messages.value.pop()
    }
    throw error
  }
}

// 清空聊天
const clearChat = async () => {
  try {
    await showDialog({
      title: '清空聊天',
      message: '确定要清空所有聊天记录吗？',
      showCancelButton: true
    })

    // 后端没有清空接口，只清空前端显示
    await apiConfig.clearMessages()
    messages.value = []
    showToast('聊天记录已清空')

  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空失败:', error)
      showToast('清空失败，请重试')
    }
  }
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (chatContent.value) {
    chatContent.value.scrollTop = chatContent.value.scrollHeight
  }
}

// 加载聊天历史（简化版，因为后端没有历史记录接口）
const loadChatHistory = async () => {
  try {
    console.log('后端没有历史记录接口，跳过加载历史记录')
    // 可以在这里添加一条欢迎消息
    messages.value = [
      {
        id: messageId++,
        content: '您好！我是AI智能助手，有什么可以帮助您的吗？',
        isUser: false,
        timestamp: new Date()
      }
    ]
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

onMounted(async () => {
  // 并行执行加载历史记录和预热AI服务
  await Promise.all([
    loadChatHistory(),
    preheatAI()
  ])

  scrollToBottom()
})
</script>

<style scoped>
.ai-assistant-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header .van-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
}

.header .van-icon:hover {
  color: #667eea;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.message-wrapper.user-wrapper {
  flex-direction: row;
  justify-content: flex-end;
}

.message-wrapper.ai-wrapper {
  flex-direction: row;
  justify-content: flex-start;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ai-avatar {
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.user-avatar {
  border: 2px solid #667eea;
}

.message {
  max-width: 65%;
  padding: 16px 20px;
  border-radius: 22px;
  line-height: 1.4;
  word-wrap: break-word;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.message.user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-bottom-right-radius: 6px;
}

.message.ai {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-bottom-left-radius: 6px;
  backdrop-filter: blur(10px);
}

.cursor {
  animation: blink 1s infinite;
}

.typing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 20px;
  border-radius: 22px;
  border-bottom-left-radius: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dots {
  display: flex;
  gap: 4px;
}

.dots div {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: pulse 1.4s infinite ease-in-out;
}

.dots div:nth-child(2) { animation-delay: 0.2s; }
.dots div:nth-child(3) { animation-delay: 0.4s; }

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  outline: none;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.3s ease;
}

.input-area input:focus {
  border-color: #667eea;
}

.input-area button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.input-area button:hover {
  transform: translateY(-1px);
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
