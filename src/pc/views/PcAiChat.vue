<template>
  <div class="pc-ai-chat">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-left">
        <img src="/aiimage.jpg" class="header-avatar" alt="AI" />
        <span class="header-title">玉子 - AI助手</span>
      </div>
      <el-button :icon="Delete" text @click="clearChat">清空聊天</el-button>
    </div>

    <!-- Chat Area -->
    <div class="chat-area" ref="chatContent">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-wrapper"
        :class="{ 'user-wrapper': message.isUser, 'ai-wrapper': !message.isUser }"
      >
        <!-- AI Avatar -->
        <img
          v-if="!message.isUser"
          src="/aiimage.jpg"
          class="avatar ai-avatar"
          alt="AI"
        />

        <!-- Message Bubble -->
        <div class="message-bubble" :class="{ 'user-bubble': message.isUser, 'ai-bubble': !message.isUser }">
          {{ message.content }}
          <span v-if="message.isStreaming" class="streaming-cursor">|</span>
        </div>

        <!-- User Avatar -->
        <img
          v-if="message.isUser"
          :src="userStore.userInfo?.avatar || userStore.userInfo?.avatarUrl || 'https://picsum.photos/40/40?random=me'"
          class="avatar user-avatar"
          alt="用户"
        />
      </div>

      <!-- Typing Indicator -->
      <div v-if="isLoading && !isPreheating" class="message-wrapper ai-wrapper">
        <img src="/aiimage.jpg" class="avatar ai-avatar" alt="AI" />
        <div class="typing-indicator">
          <span class="typing-text">AI正在思考</span>
          <div class="typing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <el-input
        v-model="inputText"
        size="large"
        :placeholder="isPreheating ? 'AI正在准备中...' : '输入你想说的话...'"
        :disabled="isLoading || isPreheating"
        @keyup.enter="handleSend"
        clearable
      />
      <el-button
        type="primary"
        size="large"
        class="send-btn"
        :disabled="!inputText.trim() || isLoading || isPreheating"
        @click="handleSend"
      >
        {{ isPreheating ? '准备中' : '发送' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { simpleChat, streamChat, getAiMessageList, deleteAiMessages } from '@/api/ai.js'
import { useUserStore } from '@/stores/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const userStore = useUserStore()
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const isPreheating = ref(true)
const chatContent = ref(null)
let messageId = 1

// Preheat AI service
const preheatAI = async () => {
  try {
    console.log('开始预热AI服务...')
    isPreheating.value = true
    await simpleChat('你好', '0')
    console.log('AI服务预热完成')
  } catch (error) {
    console.log('AI服务预热失败，但不影响正常使用:', error)
  } finally {
    isPreheating.value = false
  }
}

// Load chat history
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

// Send message
const handleSend = async () => {
  if (!inputText.value.trim() || isLoading.value) return

  if (isPreheating.value) {
    ElMessage.warning('AI正在准备中，请稍候...')
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

    ElMessage.error('发送失败，请重试')
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// Handle stream chat
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

// Clear chat
const clearChat = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有聊天记录吗？', '清空聊天', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const userId = userStore.userInfo?.id
    if (!userId) {
      ElMessage.warning('用户信息不完整')
      return
    }

    const response = await deleteAiMessages(userId)

    if (response.code === 200) {
      messages.value = []
      ElMessage.success('聊天记录已清空')
    } else {
      ElMessage.error('清空失败，请重试')
    }
  } catch (error) {
    if (error !== 'cancel' && error?.toString() !== 'cancel') {
      console.error('清空失败:', error)
      ElMessage.error('清空失败，请重试')
    }
  }
}

// Scroll to bottom
const scrollToBottom = async () => {
  await nextTick()
  if (chatContent.value) {
    chatContent.value.scrollTop = chatContent.value.scrollHeight
  }
}

onMounted(async () => {
  await Promise.all([
    loadChatHistory(),
    preheatAI()
  ])
  scrollToBottom()
})
</script>

<style scoped>
.pc-ai-chat {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* Chat Area */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.message-wrapper.ai-wrapper {
  justify-content: flex-start;
}

.message-wrapper.user-wrapper {
  justify-content: flex-end;
}

/* Avatars */
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
  border: 2px solid #ff6b9d;
}

/* Message Bubbles */
.message-bubble {
  max-width: 60%;
  padding: 14px 20px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 15px;
}

.ai-bubble {
  background: #fff;
  color: #333;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-bubble {
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  color: #fff;
  border-radius: 18px 18px 4px 18px;
}

/* Streaming Cursor */
.streaming-cursor {
  animation: cursor-blink 1s infinite;
  font-weight: bold;
  margin-left: 2px;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  padding: 14px 20px;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.typing-text {
  font-size: 14px;
  color: #999;
}

.typing-dots {
  display: flex;
  gap: 5px;
}

.typing-dots .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #bbb;
  animation: dot-pulse 1.4s infinite ease-in-out;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Input Area */
.input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.input-area .el-input {
  flex: 1;
}

.send-btn {
  background: linear-gradient(135deg, #ff6b9d, #c084fc) !important;
  border: none !important;
  color: #fff !important;
  padding: 0 28px;
  font-size: 15px;
  border-radius: 8px;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations */
@keyframes cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes dot-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.0);
    opacity: 1;
  }
}

/* Scrollbar */
.chat-area::-webkit-scrollbar {
  width: 6px;
}

.chat-area::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.chat-area::-webkit-scrollbar-track {
  background: transparent;
}
</style>
