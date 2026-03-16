<template>
  <div class="ai-chat-page">
    <!-- 简单的顶部标题 -->
    <div class="header">
      <van-icon name="arrow-left" @click="$router.back()" />
      <h1>狸子</h1>
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
import { simpleChat, streamChat, getAiMessageList, deleteAiMessages } from '../api/ai.js'
import { useUserStore } from '../stores/user.js'
import { showToast, showDialog } from 'vant'

const userStore = useUserStore()
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const chatContent = ref(null)
const isPreheating = ref(true)
let messageId = 1

// 预热AI服务
const preheatAI = async () => {
  try {
    console.log('开始预热AI服务...')
    isPreheating.value = true
    
    // 使用simpleChat接口预热，固定chat-id=0
    await simpleChat('你好', '0')
    
    console.log('AI服务预热完成')
  } catch (error) {
    console.log('AI服务预热失败，但不影响正常使用:', error)
  } finally {
    isPreheating.value = false
  }
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
    const userId = userStore.userInfo?.id
    if (!userId) {
      throw new Error('用户信息不完整')
    }
    
    const aiMessage = reactive({
      id: messageId++,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    })
    
    messages.value.push(aiMessage)
    await scrollToBottom()

    await streamChat(query, userId, (chunk) => {
      aiMessage.content += chunk
      scrollToBottom()
    }, 2)
    
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
    
    const userId = userStore.userInfo?.id
    if (!userId) {
      showToast('用户信息不完整')
      return
    }
    
    const response = await deleteAiMessages(userId)
    
    if (response.code === 200) {
      messages.value = []
      showToast('聊天记录已清空')
    } else {
      showToast('清空失败，请重试')
    }
    
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

// 加载聊天历史
const loadChatHistory = async () => {
  try {
    if (!userStore.userInfo?.id) {
      await userStore.fetchCurrentUser()
    }

    if (!userStore.userInfo?.id) return

    const response = await getAiMessageList(userStore.userInfo.id)

    if (response.code === 200 && response.data && Array.isArray(response.data)) {
      const historyMessages = response.data.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.type === 'USER',
        timestamp: new Date(msg.timestamp)
      }))

      historyMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      messages.value = historyMessages
      
      if (historyMessages.length > 0) {
        const maxId = Math.max(...historyMessages.map(msg => parseInt(msg.id) || 0))
        messageId = maxId + 1
      }

      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
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
.ai-chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.header .van-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
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
}

.ai-avatar {
  border: 2px solid #e0e0e0;
}

.user-avatar {
  border: 2px solid #007AFF;
}

.message {
  max-width: 65%;
  padding: 16px 20px;
  border-radius: 22px;
  line-height: 1.4;
  word-wrap: break-word;
  font-size: 16px;
}

.message.user {
  background: #007AFF;
  color: white;
  border-bottom-right-radius: 6px;
}

.message.ai {
  background: white;
  color: #333;
  border-bottom-left-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
  background: white;
  padding: 16px 20px;
  border-radius: 22px;
  border-bottom-left-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
  background: white;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 16px;
}

.input-area button {
  padding: 12px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
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









