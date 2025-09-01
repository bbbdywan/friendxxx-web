<template>
  <div class="universal-ai-chat" :class="themeClass">
    <!-- 顶部标题栏 -->
    <div class="chat-header" v-if="showHeader">
      <div class="header-left">
        <button v-if="showBackButton" @click="handleBack" class="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="chat-title">{{ title }}</h1>
      </div>
      <div class="header-right">
        <button v-if="showClearButton" @click="handleClear" class="clear-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message-wrapper"
        :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
      >
        <!-- AI头像 -->
        <div v-if="!message.isUser" class="avatar ai-avatar">
          <img v-if="aiAvatar" :src="aiAvatar" alt="AI" />
          <div v-else class="default-ai-avatar">🤖</div>
        </div>
        
        <!-- 消息内容 -->
        <div class="message-content" :class="{ 'user': message.isUser, 'ai': !message.isUser }">
          <div class="message-text">
            {{ message.content }}
            <span v-if="message.isStreaming" class="typing-cursor">|</span>
          </div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
        
        <!-- 用户头像 -->
        <div v-if="message.isUser" class="avatar user-avatar">
          <img v-if="userAvatar" :src="userAvatar" alt="用户" />
          <div v-else class="default-user-avatar">👤</div>
        </div>
      </div>
      
      <!-- 打字指示器 -->
      <div v-if="isLoading && !isPreheating" class="message-wrapper ai-message">
        <div class="avatar ai-avatar">
          <img v-if="aiAvatar" :src="aiAvatar" alt="AI" />
          <div v-else class="default-ai-avatar">🤖</div>
        </div>
        <div class="typing-indicator">
          <span>{{ loadingText }}</span>
          <div class="typing-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="input-wrapper">
        <input 
          v-model="inputText"
          @keyup.enter="handleSend"
          :placeholder="isPreheating ? preheatText : placeholder"
          :disabled="isLoading || disabled"
          class="message-input"
        />
        <button 
          @click="handleSend"
          :disabled="!inputText.trim() || isLoading || isPreheating || disabled"
          class="send-btn"
        >
          <span v-if="isPreheating">{{ preheatText }}</span>
          <span v-else-if="isLoading">发送中</span>
          <span v-else>{{ sendButtonText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'

export default {
  name: 'UniversalAiChat',
  props: {
    // 基础配置
    title: {
      type: String,
      default: 'AI助手'
    },
    theme: {
      type: String,
      default: 'default', // default, gradient, dark, light
      validator: value => ['default', 'gradient', 'dark', 'light'].includes(value)
    },
    
    // 界面控制
    showHeader: {
      type: Boolean,
      default: true
    },
    showBackButton: {
      type: Boolean,
      default: true
    },
    showClearButton: {
      type: Boolean,
      default: true
    },
    
    // 头像配置
    aiAvatar: {
      type: String,
      default: ''
    },
    userAvatar: {
      type: String,
      default: ''
    },
    
    // 文本配置
    placeholder: {
      type: String,
      default: '输入消息...'
    },
    sendButtonText: {
      type: String,
      default: '发送'
    },
    loadingText: {
      type: String,
      default: 'AI正在思考'
    },
    preheatText: {
      type: String,
      default: 'AI正在准备中...'
    },
    
    // 功能配置
    disabled: {
      type: Boolean,
      default: false
    },
    autoScroll: {
      type: Boolean,
      default: true
    },
    
    // API配置
    apiConfig: {
      type: Object,
      required: true,
      validator: value => {
        return value && typeof value.streamChat === 'function'
      }
    },
    
    // 用户信息
    userId: {
      type: [String, Number],
      required: true
    },
    
    // 初始消息
    initialMessages: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      messages: [],
      inputText: '',
      isLoading: false,
      isPreheating: false,
      messageId: 1
    }
  },
  
  computed: {
    themeClass() {
      return `theme-${this.theme}`
    }
  },
  
  mounted() {
    this.initializeChat()
  },
  
  methods: {
    // 初始化聊天
    async initializeChat() {
      if (this.initialMessages.length > 0) {
        this.messages = [...this.initialMessages]
        this.messageId = Math.max(...this.messages.map(m => m.id || 0)) + 1
      }
      
      // 预热AI服务
      if (this.apiConfig.preheat) {
        await this.preheatAI()
      }
      
      this.scrollToBottom()
    },
    
    // 预热AI服务
    async preheatAI() {
      try {
        this.isPreheating = true
        await this.apiConfig.preheat(this.userId)
      } catch (error) {
        console.warn('AI预热失败:', error)
      } finally {
        this.isPreheating = false
      }
    },
    
    // 发送消息
    async handleSend() {
      if (!this.inputText.trim() || this.isLoading || this.isPreheating) return

      const userMessage = {
        id: this.messageId++,
        content: this.inputText,
        isUser: true,
        timestamp: new Date()
      }

      this.messages.push(userMessage)
      const query = this.inputText
      this.inputText = ''
      
      this.$emit('message-sent', userMessage)
      
      if (this.autoScroll) {
        await this.$nextTick()
        this.scrollToBottom()
      }

      try {
        this.isLoading = true
        await this.handleStreamChat(query)
      } catch (error) {
        console.error('AI聊天错误:', error)
        
        const errorMessage = {
          id: this.messageId++,
          content: '抱歉，我现在无法回答你的问题，请稍后再试。',
          isUser: false,
          timestamp: new Date()
        }
        this.messages.push(errorMessage)
        this.$emit('error', error)
      } finally {
        this.isLoading = false
        if (this.autoScroll) {
          await this.$nextTick()
          this.scrollToBottom()
        }
      }
    },
    
    // 处理流式聊天
    async handleStreamChat(query) {
      // 使用Vue的reactive来确保响应式更新，与原版保持一致
      const aiMessage = reactive({
        id: this.messageId++,
        content: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true
      })
      
      this.messages.push(aiMessage)
      if (this.autoScroll) {
        await this.$nextTick()
        this.scrollToBottom()
      }

      try {
        await this.apiConfig.streamChat(query, this.userId, (chunk) => {
          aiMessage.content += chunk
          if (this.autoScroll) {
            this.scrollToBottom()
          }
        })
        
        aiMessage.isStreaming = false
        this.$emit('message-received', aiMessage)
        
      } catch (error) {
        const lastMessage = this.messages[this.messages.length - 1]
        if (lastMessage && lastMessage.isStreaming) {
          this.messages.pop()
        }
        throw error
      }
    },
    
    // 清空聊天
    async handleClear() {
      if (this.apiConfig.clearMessages) {
        try {
          await this.apiConfig.clearMessages(this.userId)
        } catch (error) {
          console.error('清空聊天记录失败:', error)
        }
      } else {
        console.log('后端没有清空接口，只清空前端显示')
      }

      this.messages = []
      this.$emit('messages-cleared')
    },
    
    // 返回按钮
    handleBack() {
      this.$emit('back')
    },
    
    // 滚动到底部
    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight
      }
    },
    
    // 格式化时间
    formatTime(time) {
      const now = new Date()
      const diff = now - time
      const hours = Math.floor(diff / (1000 * 60 * 60))
      
      if (hours < 1) return '刚刚'
      if (hours < 24) return `${hours}小时前`
      return `${Math.floor(hours / 24)}天前`
    },
    
    // 公共方法：添加消息
    addMessage(message) {
      this.messages.push({
        id: this.messageId++,
        ...message,
        timestamp: message.timestamp || new Date()
      })
      
      if (this.autoScroll) {
        this.$nextTick(() => this.scrollToBottom())
      }
    },
    
    // 公共方法：获取所有消息
    getMessages() {
      return [...this.messages]
    },
    
    // 公共方法：清空消息
    clearMessages() {
      this.messages = []
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.universal-ai-chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部标题栏 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn, .clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover, .clear-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.chat-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.message-wrapper.user-message {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.message-wrapper.ai-message {
  flex-direction: row;
  justify-content: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-avatar {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.user-avatar {
  background: #f3e5f5;
  border: 2px solid #9c27b0;
}

.default-ai-avatar, .default-user-avatar {
  font-size: 20px;
}

.message-content {
  max-width: 70%;
  border-radius: 18px;
  padding: 12px 16px;
  position: relative;
}

.message-content.user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-bottom-right-radius: 6px;
}

.message-content.ai {
  background: white;
  color: #333;
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.typing-cursor {
  animation: blink 1s infinite;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots div {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: pulse 1.4s infinite ease-in-out;
}

.typing-dots div:nth-child(2) { animation-delay: 0.2s; }
.typing-dots div:nth-child(3) { animation-delay: 0.4s; }

/* 输入区域 */
.chat-input {
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #eee;
  position: relative;
  z-index: 50;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 16px;
  background: white;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  border-color: #667eea;
}

.message-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.send-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 动画 */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* 主题样式 */
/* 渐变主题 */
.theme-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.theme-gradient .chat-messages {
  background: rgba(255, 255, 255, 0.05);
}

.theme-gradient .chat-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.theme-gradient .chat-input {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.theme-gradient .message-content.ai {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.theme-gradient .typing-indicator {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* 深色主题 */
.theme-dark {
  background: #1a1a1a;
  color: #fff;
}

.theme-dark .chat-header {
  background: #2d2d2d;
  border-bottom-color: #404040;
  color: #fff;
}

.theme-dark .chat-title {
  color: #fff;
}

.theme-dark .back-btn, .theme-dark .clear-btn {
  color: #ccc;
}

.theme-dark .back-btn:hover, .theme-dark .clear-btn:hover {
  background: #404040;
  color: #fff;
}

.theme-dark .chat-messages {
  background: #1a1a1a;
}

.theme-dark .message-content.ai {
  background: #2d2d2d;
  color: #fff;
}

.theme-dark .typing-indicator {
  background: #2d2d2d;
  color: #ccc;
}

.theme-dark .chat-input {
  background: #2d2d2d;
  border-top-color: #404040;
}

.theme-dark .message-input {
  background: #404040;
  border-color: #555;
  color: #fff;
}

.theme-dark .message-input:focus {
  border-color: #667eea;
}

/* 浅色主题 */
.theme-light .chat-messages {
  background: #ffffff;
}

.theme-light .message-content.ai {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }

  .chat-messages {
    padding: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-input {
    padding: 12px 16px;
  }

  .message-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
}

@media (max-width: 480px) {
  .avatar {
    width: 32px;
    height: 32px;
  }

  .default-ai-avatar, .default-user-avatar {
    font-size: 16px;
  }

  .message-content {
    max-width: 90%;
    padding: 10px 14px;
  }

  .chat-title {
    font-size: 16px;
  }
}
</style>
