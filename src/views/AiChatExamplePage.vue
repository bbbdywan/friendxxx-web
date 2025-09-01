<template>
  <div class="ai-chat-example-page">
    <!-- 顶部导航 -->
    <div class="example-header">
      <van-icon name="arrow-left" @click="$router.back()" />
      <h1>AI聊天组件示例</h1>
      <div class="theme-selector">
        <select v-model="currentTheme" @change="switchTheme">
          <option value="default">默认</option>
          <option value="gradient">渐变</option>
          <option value="dark">深色</option>
          <option value="light">浅色</option>
        </select>
      </div>
    </div>

    <!-- 示例选择器 -->
    <div class="example-tabs">
      <div 
        v-for="(example, index) in examples" 
        :key="index"
        class="tab-item"
        :class="{ active: activeExample === index }"
        @click="switchExample(index)"
      >
        {{ example.name }}
      </div>
    </div>

    <!-- 当前示例描述 -->
    <div class="example-description">
      <h3>{{ examples[activeExample].name }}</h3>
      <p>{{ examples[activeExample].description }}</p>
      <div class="example-features">
        <span
          v-for="feature in examples[activeExample].features"
          :key="feature"
          class="feature-tag"
        >
          {{ feature }}
        </span>
      </div>

      <!-- 流式效果控制 -->
      <div class="stream-controls">
        <label>
          <input type="checkbox" v-model="typewriterEffect" @change="updateApiConfig">
          打字机效果
        </label>
        <label>
          延迟: <input type="range" v-model="chunkDelay" min="0" max="100" @change="updateApiConfig">
          {{ chunkDelay }}ms
        </label>
      </div>
    </div>

    <!-- 聊天组件容器 -->
    <div class="chat-container">
      <UniversalAiChat
        ref="chatRef"
        :key="chatKey"
        :api-config="currentApiConfig"
        :user-id="userId"
        :user-avatar="userAvatar"
        :ai-avatar="aiAvatar"
        :title="examples[activeExample].title"
        :theme="currentTheme"
        :placeholder="examples[activeExample].placeholder"
        :send-button-text="examples[activeExample].sendButtonText"
        :loading-text="examples[activeExample].loadingText"
        :show-back-button="examples[activeExample].showBackButton"
        :show-clear-button="examples[activeExample].showClearButton"
        :initial-messages="examples[activeExample].initialMessages"
        :auto-scroll="examples[activeExample].autoScroll"
        @message-sent="onMessageSent"
        @message-received="onMessageReceived"
        @messages-cleared="onMessagesCleared"
        @back="onBack"
        @error="onError"
      />
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" v-if="showControls">
      <div class="control-buttons">
        <button @click="addSystemMessage" class="control-btn">
          添加系统消息
        </button>
        <button @click="getAllMessages" class="control-btn">
          获取消息列表
        </button>
        <button @click="clearAllMessages" class="control-btn">
          清空消息
        </button>
        <button @click="toggleControls" class="control-btn secondary">
          隐藏控制面板
        </button>
        <button @click="testStreamDirectly" class="control-btn">
          直接测试流式接口
        </button>
        <button @click="testOriginalMethod" class="control-btn">
          测试原版方法
        </button>
        <button @click="compareAPIs" class="control-btn">
          对比API差异
        </button>
      </div>
    </div>

    <!-- 浮动控制按钮 -->
    <div class="floating-controls" v-if="!showControls">
      <button @click="toggleControls" class="floating-btn">
        🎛️
      </button>
    </div>

    <!-- 消息统计 -->
    <div class="message-stats" v-if="messageStats.total > 0">
      <span>消息统计: 总计{{ messageStats.total }}条 | 用户{{ messageStats.user }}条 | AI{{ messageStats.ai }}条</span>
    </div>
  </div>
</template>

<script>
import UniversalAiChat from '../components/UniversalAiChat.vue'
import { createCurrentProjectApi, createAiChatApi, createSimpleStreamApi, createOriginalStreamApi } from '../utils/aiChatApi.js'
import { useUserStore } from '../stores/user.js'
import { showToast } from 'vant'

export default {
  name: 'AiChatExamplePage',
  components: {
    UniversalAiChat
  },
  data() {
    return {
      activeExample: 0,
      currentTheme: 'gradient',
      chatKey: 0, // 用于强制重新渲染组件
      showControls: true, // 默认显示控制面板，方便测试

      // 流式效果配置
      typewriterEffect: false,
      chunkDelay: 50, // 与原版本保持一致
      
      // 用户信息
      userId: '12345',
      userAvatar: '/friendxxx.png',
      aiAvatar: '/aiimage.jpg',
      
      // 消息统计
      messageStats: {
        total: 0,
        user: 0,
        ai: 0
      },
      
      // 示例配置
      examples: [
        {
          name: '基础示例',
          title: '基础AI助手',
          description: '最基本的AI聊天功能，支持流式输出',
          features: ['流式输出', '实时对话', '基础UI'],
          placeholder: '输入消息...',
          sendButtonText: '发送',
          loadingText: 'AI正在思考',
          showBackButton: true,
          showClearButton: true,
          autoScroll: true,
          initialMessages: []
        },
        {
          name: '客服示例',
          title: '智能客服',
          description: '模拟客服场景，包含欢迎消息和常见问题引导',
          features: ['欢迎消息', '问题引导', '专业回复'],
          placeholder: '请输入您的问题...',
          sendButtonText: '提交',
          loadingText: '客服正在为您查询',
          showBackButton: false,
          showClearButton: true,
          autoScroll: true,
          initialMessages: [
            {
              id: 1,
              content: '您好！欢迎使用智能客服系统，我可以帮助您解决各种问题。请直接输入您的问题，我会尽力为您解答。',
              isUser: false,
              timestamp: new Date(Date.now() - 60000)
            }
          ]
        },
        {
          name: '助手示例',
          title: 'AI智能助手',
          description: '功能丰富的AI助手，支持多种交互方式',
          features: ['智能回复', '上下文理解', '多功能'],
          placeholder: '有什么可以帮助您的吗？',
          sendButtonText: '询问',
          loadingText: '助手正在分析',
          showBackButton: true,
          showClearButton: true,
          autoScroll: true,
          initialMessages: [
            {
              id: 1,
              content: '您好！我是您的AI智能助手，可以帮您处理各种问题和任务。',
              isUser: false,
              timestamp: new Date(Date.now() - 30000)
            }
          ]
        },
        {
          name: '自定义示例',
          title: '自定义配置',
          description: '展示组件的高度可定制性，包含特殊配置和样式',
          features: ['自定义样式', '特殊配置', '高级功能'],
          placeholder: '尝试自定义功能...',
          sendButtonText: '执行',
          loadingText: '处理中',
          showBackButton: true,
          showClearButton: false,
          autoScroll: false,
          initialMessages: [
            {
              id: 1,
              content: '这是一个自定义配置的示例，展示了组件的灵活性。',
              isUser: false,
              timestamp: new Date(Date.now() - 45000)
            },
            {
              id: 2,
              content: '请问有什么特殊功能需要测试吗？',
              isUser: true,
              timestamp: new Date(Date.now() - 15000)
            }
          ]
        }
      ]
    }
  },
  
  computed: {
    currentApiConfig() {
      // 使用与原版完全一致的API实现
      return createOriginalStreamApi()
    }
  },
  
  setup() {
    const userStore = useUserStore()
    return {
      userStore
    }
  },
  
  mounted() {
    // 如果有用户信息，使用真实的用户ID和头像
    if (this.userStore.userInfo) {
      this.userId = this.userStore.userInfo.id
      if (this.userStore.userInfo.avatar) {
        this.userAvatar = this.userStore.userInfo.avatar
      }
    }
  },
  
  methods: {
    // 切换示例
    switchExample(index) {
      this.activeExample = index
      this.chatKey++ // 强制重新渲染组件
      this.resetMessageStats()
    },
    
    // 切换主题
    switchTheme() {
      // 主题切换会自动应用到组件
      showToast(`已切换到${this.getThemeName(this.currentTheme)}主题`)
    },
    
    // 获取主题名称
    getThemeName(theme) {
      const themeNames = {
        default: '默认',
        gradient: '渐变',
        dark: '深色',
        light: '浅色'
      }
      return themeNames[theme] || '未知'
    },
    
    // 事件处理
    onMessageSent(message) {
      console.log('用户发送消息:', message)
      this.updateMessageStats('user')
    },
    
    onMessageReceived(message) {
      console.log('AI回复消息:', message)
      this.updateMessageStats('ai')
    },
    
    onMessagesCleared() {
      console.log('消息已清空')
      this.resetMessageStats()
      showToast('聊天记录已清空')
    },
    
    onBack() {
      console.log('返回按钮被点击')
      this.$router.back()
    },
    
    onError(error) {
      console.error('聊天错误:', error)
      showToast('发送失败，请重试')
    },
    
    // 控制面板方法
    addSystemMessage() {
      if (this.$refs.chatRef) {
        const messages = [
          '这是一条系统消息',
          '当前时间：' + new Date().toLocaleTimeString(),
          '系统状态：正常运行',
          '提示：您可以尝试不同的问题',
          '温馨提示：AI正在学习中，回复仅供参考'
        ]
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        
        this.$refs.chatRef.addMessage({
          content: randomMessage,
          isUser: false
        })
        this.updateMessageStats('ai')
      }
    },
    
    getAllMessages() {
      if (this.$refs.chatRef) {
        const messages = this.$refs.chatRef.getMessages()
        console.log('所有消息:', messages)
        showToast(`当前共有 ${messages.length} 条消息`)
      }
    },
    
    clearAllMessages() {
      if (this.$refs.chatRef) {
        this.$refs.chatRef.clearMessages()
        this.resetMessageStats()
        showToast('消息已清空')
      }
    },
    
    toggleControls() {
      this.showControls = !this.showControls
    },
    
    // 消息统计
    updateMessageStats(type) {
      this.messageStats.total++
      if (type === 'user') {
        this.messageStats.user++
      } else if (type === 'ai') {
        this.messageStats.ai++
      }
    },
    
    resetMessageStats() {
      this.messageStats = {
        total: 0,
        user: 0,
        ai: 0
      }
    },

    // 更新API配置
    updateApiConfig() {
      this.chatKey++ // 强制重新渲染组件以应用新配置
    },

    // 直接测试流式接口
    async testStreamDirectly() {
      console.log('开始直接测试流式接口...')

      const testUrl = 'http://localhost:8080/api/helloworld/stream/chat?query=' +
                     encodeURIComponent('请介绍一下你自己') + '&chat-id=test-user'

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'text/plain',
            'Cache-Control': 'no-cache'
          }
        })

        console.log('响应状态:', response.status)
        console.log('响应头:', {
          'content-type': response.headers.get('content-type'),
          'transfer-encoding': response.headers.get('transfer-encoding'),
          'cache-control': response.headers.get('cache-control')
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('流式读取完成，完整响应:', fullResponse)
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk
          console.log('实时数据块:', chunk, '当前总长度:', fullResponse.length)
        }

        showToast('流式测试完成，请查看控制台')

      } catch (error) {
        console.error('流式测试失败:', error)
        showToast('流式测试失败: ' + error.message)
      }
    },

    // 测试原版方法
    async testOriginalMethod() {
      console.log('开始测试原版方法...')

      // 直接导入原版API
      const { streamChat } = await import('../api/ai.js')

      if (this.$refs.chatRef) {
        const { reactive } = await import('vue')

        const aiMessage = reactive({
          id: Date.now(),
          content: '',
          isUser: false,
          timestamp: new Date(),
          isStreaming: true
        })

        this.$refs.chatRef.addMessage(aiMessage)

        try {
          await streamChat('请介绍一下你自己', this.userId, (chunk) => {
            aiMessage.content += chunk
            console.log('原版方法收到数据块:', chunk)
          })

          aiMessage.isStreaming = false
          showToast('原版方法测试完成')

        } catch (error) {
          console.error('原版方法测试失败:', error)
          showToast('原版方法测试失败: ' + error.message)
        }
      }
    }
  }
}
</script>

<style scoped>
.ai-chat-example-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* 顶部导航 */
.example-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.example-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.example-header .van-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.theme-selector select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

/* 示例选择器 */
.example-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}

.tab-item {
  flex-shrink: 0;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #666;
}

.tab-item.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-item:hover {
  background: #f8f9fa;
}

/* 示例描述 */
.example-description {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #eee;
}

.example-description h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.example-description p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.example-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-tag {
  padding: 4px 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stream-controls {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.stream-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.stream-controls input[type="checkbox"] {
  margin: 0;
}

.stream-controls input[type="range"] {
  width: 80px;
  margin: 0 6px;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  position: relative;
  /* 移除 overflow: hidden，确保输入区域可见 */
}

/* 控制面板 */
.control-panel {
  background: white;
  border-top: 1px solid #eee;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.control-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.control-btn.secondary {
  background: #6c757d;
}

.control-btn.secondary:hover {
  background: #5a6268;
}

/* 浮动控制按钮 */
.floating-controls {
  position: fixed;
  bottom: 100px; /* 提高位置，避免遮挡输入区域 */
  right: 20px;
  z-index: 1000;
}

.floating-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.floating-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

/* 消息统计 */
.message-stats {
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .example-header {
    padding: 12px 16px;
  }

  .example-header h1 {
    font-size: 16px;
  }

  .example-tabs {
    padding: 0 8px;
  }

  .tab-item {
    padding: 10px 16px;
    font-size: 13px;
  }

  .example-description {
    padding: 12px 16px;
  }

  .control-panel {
    padding: 12px 16px;
  }

  .control-buttons {
    gap: 8px;
  }

  .control-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .floating-btn {
    width: 48px;
    height: 48px;
    font-size: 18px;
  }

  .message-stats {
    top: 70px;
    right: 16px;
    font-size: 11px;
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .example-features {
    gap: 6px;
  }

  .feature-tag {
    padding: 3px 6px;
    font-size: 11px;
  }

  .theme-selector select {
    padding: 4px 8px;
    font-size: 13px;
  }
}

/* 滚动条样式 */
.example-tabs::-webkit-scrollbar {
  height: 3px;
}

.example-tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.example-tabs::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.example-tabs::-webkit-scrollbar-thumb:hover {
  background: #5a6fd8;
}
</style>
