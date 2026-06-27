<template>
  <div class="pc-chat">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-search">
        <el-input v-model="searchKeyword" placeholder="搜索聊天..." prefix-icon="Search" clearable />
      </div>
      <div class="conversation-list">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          class="conversation-item"
          :class="{ active: currentChatId === chat.id }"
          @click="selectChat(chat)"
        >
          <div class="conv-avatar">
            <el-avatar :size="48" :src="chat.user.avatar">{{ (chat.user.name || '用')[0] }}</el-avatar>
            <div class="online-dot" v-if="chat.user.isOnline"></div>
          </div>
          <div class="conv-info">
            <div class="conv-top">
              <span class="conv-name">{{ chat.user.name }}</span>
              <span class="conv-time">{{ formatTime(chat.lastMessage?.timestamp) }}</span>
            </div>
            <div class="conv-bottom">
              <span class="conv-preview">{{ getMessagePreview(chat.lastMessage) }}</span>
              <el-badge v-if="chat.unreadCount > 0" :value="chat.unreadCount > 99 ? '99+' : chat.unreadCount" class="conv-badge" />
            </div>
          </div>
        </div>
        <div v-if="filteredChats.length === 0" class="empty-conv">
          <el-empty description="暂无聊天记录" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 右侧聊天详情 -->
    <div class="chat-main">
      <template v-if="currentChat">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div class="header-info">
            <h3>{{ currentChat.user.name }}</h3>
            <span class="online-text" v-if="currentChat.user.isOnline">在线</span>
            <span class="offline-text" v-else>离线</span>
          </div>
          <div class="header-actions">
            <el-button text @click="viewProfile">
              <el-icon><User /></el-icon>
            </el-button>
            <el-button text @click="deleteCurrentChat">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="message-area" ref="messageArea">
          <div v-for="(msg, index) in currentMessages" :key="msg.id" class="message-wrapper">
            <!-- 时间分隔 -->
            <div v-if="shouldShowTime(msg, index)" class="time-divider">
              <span>{{ formatMessageTime(msg.timestamp) }}</span>
            </div>
            <!-- 消息气泡 -->
            <div class="message-item" :class="{ sent: msg.sender === 'me' }">
              <el-avatar v-if="msg.sender !== 'me'" :size="40" :src="currentChat.user.avatar">{{ (currentChat.user.name || '用')[0] }}</el-avatar>
              <div class="message-bubble" :class="msg.sender === 'me' ? 'bubble-sent' : 'bubble-received'">
                {{ msg.content }}
              </div>
              <el-avatar v-if="msg.sender === 'me'" :size="40" :src="userStore.userInfo?.avatar || userStore.userInfo?.avatarUrl">我</el-avatar>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="输入消息..."
            @keyup.enter.exact="sendMessage"
            resize="none"
          />
          <el-button type="primary" class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">
            发送
          </el-button>
        </div>
      </template>

      <!-- 未选择聊天 -->
      <div v-else class="no-chat-selected">
        <el-empty description="选择一个聊天开始对话" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMessageList, getChatMessages, sendMessage as sendMessageApi } from '@/api/chat.js'
import { useUserStore } from '@/stores/user.js'
import { wsManager } from '@/utils/websocket.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Delete } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')
const chatList = ref([])
const currentChatId = ref(null)
const currentMessages = ref([])
const inputText = ref('')
const messageArea = ref(null)
const loading = ref(false)

const currentChat = computed(() => chatList.value.find(c => c.id === currentChatId.value))

const filteredChats = computed(() => {
  if (!searchKeyword.value) return chatList.value
  return chatList.value.filter(c => c.user.name.includes(searchKeyword.value))
})

const loadChatList = async () => {
  try {
    loading.value = true
    // 确保用户信息存在
    if (!userStore.userInfo?.id) {
      await userStore.fetchCurrentUser()
    }
    // 先加载用户缓存（和移动端一样）
    if (!userStore.userCacheLoaded) {
      await userStore.loadUserCache()
    }
    const currentUserId = parseInt(userStore.userInfo.id)
    const response = await getMessageList(currentUserId)
    if (response.code === 200 && response.data) {
      chatList.value = (response.data || [])
        .map(item => {
          // 判断聊天对象：如果我是发送者，对方是接收者；反之亦然
          const senderId = parseInt(item.senderId)
          const receiverId = parseInt(item.receiverId)
          const chatUserId = currentUserId === senderId ? receiverId : senderId
          
          // 优先使用接口返回的用户信息
          const chatUserName = item.chatUserName || `用户${chatUserId}`
          const chatUserAvatar = item.chatUserAvatar || ''
          
          return {
            id: chatUserId,
            user: {
              id: chatUserId,
              name: chatUserName,
              avatar: chatUserAvatar,
              isOnline: false
            },
            lastMessage: {
              content: item.content || '开始聊天吧',
              type: 'text',
              timestamp: new Date(item.createTime),
              sender: currentUserId === senderId ? 'me' : 'other'
            },
            unreadCount: item.unreadCount || 0
          }
        })
        .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp))
    }
  } catch (error) {
    console.error('加载聊天列表失败:', error)
  } finally {
    loading.value = false
  }
}

const selectChat = async (chat) => {
  currentChatId.value = chat.id
  try {
    const myId = parseInt(userStore.userInfo?.id)
    const response = await getChatMessages(myId, chat.user.id)
    if (response.code === 200 && response.data) {
      const data = response.data
      // 消息列表在 messageList 字段中（和移动端一致）
      const msgList = data.messageList || data || []
      if (Array.isArray(msgList)) {
        currentMessages.value = msgList.map(msg => {
          const senderId = parseInt(msg.senderId)
          return {
            id: msg.id,
            content: msg.content || '',
            sender: senderId === myId ? 'me' : 'other',
            timestamp: msg.createTime || msg.timestamp,
            type: msg.type === 'private' ? 'text' : (msg.type || 'text')
          }
        })
      }
    }
    await scrollToBottom()
    // 清除未读
    chat.unreadCount = 0
  } catch (error) {
    console.error('加载聊天记录失败:', error)
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim() || !currentChat.value) return

  const content = inputText.value.trim()

  // 如果WebSocket未连接，先尝试连接
  if (!wsManager.isConnected()) {
    if (userStore.userInfo?.id) {
      wsManager.connect(userStore.userInfo.id)
    }
  }

  const messageData = {
    type: 'private',
    toUserId: String(currentChat.value.user.id),
    message: content
  }

  // sendMessage 内部会等待连接建立（最多3秒）
  const success = await wsManager.sendMessage(messageData)

  if (success) {
    const newMsg = {
      id: Date.now(),
      content,
      sender: 'me',
      timestamp: new Date().toISOString(),
      type: 'text'
    }
    currentMessages.value.push(newMsg)
    inputText.value = ''
    await scrollToBottom()
    currentChat.value.lastMessage = { content, timestamp: new Date().toISOString(), type: 'text' }
  } else {
    ElMessage.error('消息发送失败，请检查网络连接')
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatMessageTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const shouldShowTime = (msg, index) => {
  if (index === 0) return true
  const prev = currentMessages.value[index - 1]
  if (!prev?.timestamp || !msg.timestamp) return false
  return new Date(msg.timestamp) - new Date(prev.timestamp) > 5 * 60 * 1000
}

const getMessagePreview = (msg) => {
  if (!msg) return ''
  if (msg.type === 'image') return '[图片]'
  if (msg.type === 'voice') return '[语音]'
  return msg.content || ''
}

const viewProfile = () => {
  if (currentChat.value) {
    router.push(`/pc/user/${currentChat.value.user.id}`)
  }
}

const deleteCurrentChat = async () => {
  try {
    await ElMessageBox.confirm('确定删除这个聊天吗？', '删除聊天', { type: 'warning' })
    chatList.value = chatList.value.filter(c => c.id !== currentChatId.value)
    currentChatId.value = null
    currentMessages.value = []
    ElMessage.success('已删除')
  } catch {}
}

// WebSocket 消息监听
onMounted(() => {
  loadChatList()

  // 确保 WebSocket 已连接
  if (!wsManager.isConnected() && userStore.userInfo?.id) {
    wsManager.connect(userStore.userInfo.id)
  }

  // 注册私聊消息处理器（type 为 'private'）
  wsManager.onMessage('private', handlePrivateMessage)
})

const handlePrivateMessage = (data) => {
    const fromId = String(data.fromUserId || data.fromId || data.senderId)
    // 如果当前正在和发送者聊天，追加消息到对话区
    if (currentChat.value && fromId === String(currentChat.value.user.id)) {
      currentMessages.value.push({
        id: Date.now(),
        content: data.message || data.content,
        sender: 'other',
        timestamp: new Date().toISOString(),
        type: 'text'
      })
      scrollToBottom()
    }
    // 无论是否在当前对话中，都刷新聊天列表以更新最后消息
    loadChatList()
}

onUnmounted(() => {
  wsManager.offMessage('private', handlePrivateMessage)
})
</script>

<style scoped>
.pc-chat {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f7fa;
}

.chat-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-search {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #fafafa;
}

.conversation-item:hover {
  background: #fafafa;
}

.conversation-item.active {
  background: #fff0f5;
}

.conv-avatar {
  position: relative;
  flex-shrink: 0;
}

.conv-avatar .online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conv-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-preview {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.conv-badge {
  flex-shrink: 0;
  margin-left: 8px;
}

.empty-conv {
  padding: 60px 20px;
}

/* 右侧聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.online-text {
  font-size: 12px;
  color: #4CAF50;
}

.offline-text {
  font-size: 12px;
  color: #999;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.time-divider {
  text-align: center;
  margin: 16px 0;
}

.time-divider span {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 10px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.message-item.sent {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 60%;
  padding: 12px 16px;
  line-height: 1.5;
  font-size: 14px;
  word-break: break-word;
}

.bubble-received {
  background: white;
  color: #333;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.bubble-sent {
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.input-area {
  background: white;
  border-top: 1px solid #e8e8e8;
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-shrink: 0;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
}

.send-btn {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
  border-radius: 12px;
  height: 40px;
  padding: 0 24px;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
