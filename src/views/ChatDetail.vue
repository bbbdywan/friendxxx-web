<template>
  <div class="chat-detail">
    <!-- 顶部导航 -->
    <div class="chat-header">
      <van-nav-bar 
        :title="chatUser.name"
        left-arrow
        @click-left="$router.back()"
      >
        <template #right>
          <van-icon name="phone-o" size="20" @click="makeCall" />
          <van-icon name="video-o" size="20" class="ml-4" @click="makeVideoCall" />
          <van-icon name="ellipsis" size="20" class="ml-4" @click="showMoreActions = true" />
        </template>
      </van-nav-bar>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageList">
      <!-- 加载更多历史记录 -->
      <div v-if="hasMoreHistory" class="load-more-history">
        <van-button 
          size="small" 
          type="default" 
          @click="loadMoreHistory"
          :loading="loadingHistory"
        >
          加载更多历史记录
        </van-button>
      </div>

      <!-- 消息项 -->
      <div 
        v-for="(message, index) in displayMessages" 
        :key="message.id"
        class="message-wrapper"
      >
        <!-- 时间分隔线 -->
        <div 
          v-if="shouldShowTime(message, index)" 
          class="time-divider"
        >
          <span class="time-text">{{ formatMessageTime(message.timestamp) }}</span>
        </div>

        <!-- 消息气泡 -->
        <div 
          class="message-item"
          :class="{ 'message-sent': message.sender === 'me' }"
        >
          <!-- 对方头像 - 只在接收消息时显示，在左边 -->
          <div class="message-avatar" v-if="message.sender !== 'me'">
            <van-image 
              :src="chatUser.avatar" 
              fit="cover" 
              round 
              width="44" 
              height="44"
              :error-icon="'user-o'"
            />
          </div>

          <!-- 消息内容 -->
          <div class="message-content">
            <!-- 文本消息 -->
            <div 
              v-if="message.type === 'text'" 
              class="message-bubble text-message"
              @click="handleBubbleClick($event, message)"
            >
              <div class="bubble-content">{{ message.content || '[空消息]' }}</div>
              <div class="message-status" v-if="message.sender === 'me'">
                <van-icon 
                  name="success" 
                  size="12" 
                  color="#07c160"
                  v-if="message.status === 'read'"
                />
                <van-icon 
                  name="clock-o" 
                  size="12" 
                  color="#999"
                  v-else-if="message.status === 'sent'"
                />
                <van-icon 
                  name="warning-o" 
                  size="12" 
                  color="#ee0a24"
                  v-else-if="message.status === 'failed'"
                />
              </div>
            </div>

            <!-- 图片消息 -->
            <div v-else-if="message.type === 'image'" class="message-bubble image-message">
              <van-image 
                :src="message.content" 
                fit="cover" 
                width="200" 
                height="150"
                radius="8"
                @click="previewImage(message.content)"
              />
            </div>

            <!-- 语音消息 -->
            <div v-else-if="message.type === 'voice'" class="message-bubble voice-message">
              <van-icon name="volume-o" size="16" />
              <div class="voice-duration">{{ message.duration || '0' }}"</div>
              <div class="voice-waves" v-if="message.isPlaying">
                <div class="wave" v-for="i in 5" :key="i"></div>
              </div>
            </div>
          </div>

          <!-- 我的头像 - 只在发送消息时显示，在右边 -->
          <div class="message-avatar" v-if="message.sender === 'me'">
            <van-image 
              :src="userStore.userInfo?.avatar || 'https://picsum.photos/44/44?random=me'" 
              fit="cover" 
              round 
              width="44" 
              height="44"
              :error-icon="'user-o'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="input-area">
      <div class="input-toolbar">
        <van-icon 
          name="add-o" 
          size="24" 
          color="#666"
          @click="showActionSheet = true" 
        />
        <div class="input-wrapper">
          <van-field
            v-model="inputText"
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
            rows="1"
            autosize
            type="textarea"
          />
          <van-icon 
            v-if="inputText.trim()"
            name="send" 
            size="20" 
            color="var(--van-primary-color)"
            @click="sendMessage"
            class="send-btn"
          />
          <van-icon 
            v-else
            name="audio" 
            size="20"
            color="#666"
            @touchstart="startRecording"
            @touchend="stopRecording"
            class="voice-btn"
          />
        </div>
        <van-icon 
          name="smile-o" 
          size="24" 
          color="#666"
          @click="showEmojiPicker = true" 
        />
      </div>
    </div>

    <!-- 操作面板 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actionSheetActions"
      @select="handleActionSelect"
    />

    <!-- 表情选择器 -->
    <van-popup v-model:show="showEmojiPicker" position="bottom" :style="{ height: '40%' }">
      <div class="emoji-picker">
        <div class="emoji-grid">
          <div 
            v-for="emoji in emojis" 
            :key="emoji"
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 更多操作 -->
    <van-action-sheet
      v-model:show="showMoreActions"
      :actions="moreActions"
      @select="handleMoreAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showImagePreview, showToast, showDialog } from 'vant'
import { getChatMessages, clearUnread } from '@/api/chat'
import { useUserStore } from '@/stores/user'
import { wsManager } from '../utils/websocket.js'
import { getApiErrorMessage } from '../utils/error.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const inputText = ref('')
const showActionSheet = ref(false)
const showEmojiPicker = ref(false)
const showMoreActions = ref(false)
const messageList = ref(null)
const loading = ref(false)
const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const displayMessageCount = ref(50) // 初始显示的消息数量

// 聊天用户信息
const chatUser = ref({
  id: 0,
  name: '',
  avatar: '',
  isOnline: false
})

// 初始化聊天对象信息
const initChatUser = async () => {
  const userId = parseInt(route.params.id)
  console.log('初始化聊天对象，用户ID:', userId)
  
  if (!userId) {
    console.error('无效的用户ID')
    showToast('无效的用户ID')
    router.push('/chat')
    return
  }
  
  // 设置初始聊天对象信息
  chatUser.value = {
    id: userId,
    name: '加载中...',
    avatar: 'https://picsum.photos/200/200?random=' + userId,
    isOnline: false
  }
  
  // 获取聊天历史记录会同时更新聊天对象信息
  await fetchChatHistory()
}

// 消息列表
const messages = ref([])

// 显示的消息列表（分页显示）
const displayMessages = computed(() => {
  const totalMessages = messages.value.length
  if (totalMessages <= displayMessageCount.value) {
    hasMoreHistory.value = false
    return messages.value
  } else {
    hasMoreHistory.value = true
    // 显示最新的消息
    return messages.value.slice(totalMessages - displayMessageCount.value)
  }
})

// 操作面板选项
const actionSheetActions = [
  { name: '相册', icon: 'photo-o' },
  { name: '拍照', icon: 'photograph' },
  { name: '位置', icon: 'location-o' },
  { name: '文件', icon: 'folder-o' }
]

// 更多操作选项
const moreActions = [
  { name: '查看资料', icon: 'user-o' },
  { name: '清空聊天记录', icon: 'delete-o' },
  { name: '举报', icon: 'warning-o' }
]

// 表情包
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'
]

// 获取聊天历史记录 - 修复字段类型问题
const fetchChatHistory = async () => {
  // 确保用户信息已加载
  if (!userStore.userInfo?.id) {
    console.log('用户信息未加载，尝试获取...')
    await userStore.fetchCurrentUser()
  }

  if (!userStore.userInfo?.id || !chatUser.value.id) {
    console.warn('用户信息不完整，无法获取聊天记录')
    return
  }

  try {
    loading.value = true
    console.log('获取聊天历史记录:', userStore.userInfo.id, chatUser.value.id)

    const response = await getChatMessages(userStore.userInfo.id, chatUser.value.id)
    console.log('聊天历史API响应:', response)

    if (response.code === 200 && response.data) {
      const data = response.data
      
      // 更新聊天对象信息（这是对方的信息）
      if (data.userName) {
        chatUser.value.name = data.userName
      }
      if (data.avatar) {
        chatUser.value.avatar = data.avatar.trim()
      }
      
      // 处理消息列表 - 修复字段类型问题
      if (data.messageList && Array.isArray(data.messageList)) {
        messages.value = data.messageList.map(msg => {
          // 确保ID和用户ID都转换为数字进行比较
          const senderId = parseInt(msg.senderId)
          const currentUserId = parseInt(userStore.userInfo.id)
          
          console.log('处理消息:', {
            msgId: msg.id,
            content: msg.content,
            senderId: senderId,
            currentUserId: currentUserId,
            isMe: senderId === currentUserId
          })
          
          return {
            id: msg.id,
            content: msg.content || '', // 确保content不为空
            type: msg.type === 'private' ? 'text' : (msg.type || 'text'), // 修正消息类型
            sender: senderId === currentUserId ? 'me' : 'other',
            timestamp: new Date(msg.createTime),
            senderId: senderId,
            receiverId: parseInt(msg.receiverId)
          }
        })
        
        console.log('处理后的消息列表:', messages.value)
        
        // 滚动到底部显示最新消息
        nextTick(() => {
          scrollToBottom()
        })
      }
    }
  } catch (error) {
    console.error('获取聊天历史记录失败:', error)
    showToast(getApiErrorMessage(error, '获取聊天记录失败'))
  } finally {
    loading.value = false
  }
}

// 初始化聊天功能 - 修复重复消息处理问题
const initChat = async () => {
  try {
    console.log('初始化聊天功能')

    // 确保WebSocket已连接
    if (!userStore.wsConnected) {
      console.log('WebSocket未连接，尝试连接...')
      await userStore.connectWebSocket()
    }

    // 注册私聊消息处理器
    wsManager.onMessage('private', handleWebSocketMessage)
    
    console.log('聊天功能初始化完成')
  } catch (error) {
    console.error('聊天功能初始化失败:', error)
    showToast({
      type: 'fail',
      message: '聊天功能初始化失败'
    })
  }
}

// 处理WebSocket消息 - 修复字段类型问题
const handleWebSocketMessage = (message) => {
  console.log('收到WebSocket消息:', message)
  console.log('消息类型:', message.type)
  console.log('当前聊天对象ID:', chatUser.value.id)
  console.log('当前用户ID:', userStore.userInfo.id)

  // 服务端实际字段：fromUserId, message, timestamp, id
  const senderId = parseInt(message.fromUserId || message.senderId || message.sender_id)
  const messageContent = message.message ?? message.content ?? message.text ?? ''
  const messageTime = message.timestamp || message.createTime || message.time || Date.now()
  const messageId = message.id || message.messageId || message.timestamp || Date.now()

  const currentChatUserId = parseInt(chatUser.value.id)
  const currentUserId = parseInt(userStore.userInfo.id)

  console.log('解析结果:', {
    senderId,
    currentChatUserId,
    currentUserId,
    messageContent,
    isFromChatUser: senderId === currentChatUserId,
    isFromMe: senderId === currentUserId
  })

  // 如果是私聊消息
  if (message.type === 'private') {
    let shouldDisplay = false
    let sender = 'other'

    // 判断是否应该显示这条消息
    if (senderId === currentChatUserId) {
      // 来自聊天对象发给我的消息
      shouldDisplay = true
      sender = 'other'
      console.log('这是来自聊天对象的消息')
    } else if (senderId === currentUserId) {
      // 我发给聊天对象的消息（通常不会收到自己的消息）
      console.log('收到自己发送的消息，可能是服务器回显')
      return
    } else {
      console.log('这条消息不属于当前聊天会话')
      showToast({
        type: 'success',
        message: `收到来自用户${senderId}的新消息`
      })
      return
    }

    if (shouldDisplay) {
      // 收到新消息后重新拉取历史记录，确保数据一致
      fetchChatHistory().then(() => {
        nextTick(() => scrollToBottom())
      })
    }
  }
}



// 发送消息
const sendMessage = () => {
  console.log('开始发送消息，输入内容:', inputText.value)

  if (!inputText.value.trim()) {
    console.log('消息内容为空，取消发送')
    return
  }

  // 检查WebSocket连接状态
  if (!wsManager.isConnected()) {
    console.log('WebSocket未连接，尝试重连...')
    showToast({
      type: 'fail',
      message: '网络连接已断开，正在重连...'
    })
    // 尝试重新连接
    if (userStore.userInfo?.id) {
      userStore.connectWebSocket()
    }
    return
  }

  const messageContent = inputText.value.trim()
  console.log('准备发送消息:', messageContent)

  // 构造消息对象
  const messageData = {
    type: 'private',
    toUserId: String(chatUser.value.id),
    message: messageContent
  }

  // 通过WebSocket发送消息
  const success = wsManager.sendMessage(messageData)
  console.log('WebSocket发送结果:', success)

  if (success) {
    // 立即添加到本地消息列表（乐观更新）
    const newMessage = {
      id: Date.now(),
      content: messageContent,
      type: 'text',
      sender: 'me',
      timestamp: new Date(),
      senderId: userStore.userInfo.id,
      receiverId: chatUser.value.id
    }

    console.log('添加新消息到本地列表:', newMessage)
    messages.value.push(newMessage)

    // 确保新发送的消息能被显示
    const totalMessages = messages.value.length
    if (totalMessages > displayMessageCount.value) {
      displayMessageCount.value = totalMessages
    }

    inputText.value = ''

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } else {
    console.log('消息发送失败')
    showToast({
      type: 'fail',
      message: '消息发送失败，请检查网络连接'
    })
  }
}

// 滚动到底部 - 参考friend项目的优化实现
const scrollToBottom = (smooth = true) => {
  if (messageList.value) {
    const scrollOptions = {
      top: messageList.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    }
    messageList.value.scrollTo(scrollOptions)
  }
}

// 判断是否显示时间分隔线
const shouldShowTime = (message, index) => {
  if (index === 0) return true
  
  const prevMessage = displayMessages.value[index - 1]
  if (!prevMessage) return true
  
  const currentTime = new Date(message.timestamp)
  const prevTime = new Date(prevMessage.timestamp)
  
  // 如果时间间隔超过5分钟，显示时间
  return (currentTime - prevTime) > 5 * 60 * 1000
}

// 格式化消息时间（用于时间分隔线）
const formatMessageTime = (timestamp) => {
  try {
    if (!timestamp) return ''

    const now = new Date()
    const messageTime = timestamp instanceof Date ? timestamp : new Date(timestamp)

    if (isNaN(messageTime.getTime())) {
      return ''
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate())
    
    const diffDays = Math.floor((today - messageDate) / (24 * 60 * 60 * 1000))
    
    if (diffDays === 0) {
      // 今天 - 显示时间
      return messageTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      // 昨天
      return '昨天 ' + messageTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays < 7) {
      // 一周内 - 显示星期
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return weekdays[messageTime.getDay()] + ' ' + messageTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      // 超过一周 - 显示日期
      return messageTime.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      }) + ' ' + messageTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    console.error('格式化消息时间错误:', error)
    return ''
  }
}

const previewImage = (url) => {
  showImagePreview([url])
}

const insertEmoji = (emoji) => {
  inputText.value += emoji
  showEmojiPicker.value = false
}

const handleActionSelect = (action) => {
  console.log('选择操作:', action.name)
  showActionSheet.value = false
  
  switch (action.name) {
    case '相册':
      // 选择图片
      break
    case '拍照':
      // 拍照
      break
    case '位置':
      // 发送位置
      break
    case '文件':
      // 选择文件
      break
  }
}

const handleMoreAction = (action) => {
  console.log('更多操作:', action.name)
  showMoreActions.value = false
  
  switch (action.name) {
    case '查看资料':
      router.push(`/user/${chatUser.value.id}`)
      break
    case '清空聊天记录':
      messages.value = []
      break
    case '举报':
      // 举报用户
      break
  }
}

const makeCall = () => {
  console.log('拨打电话')
}

const makeVideoCall = () => {
  console.log('视频通话')
}

const startRecording = () => {
  console.log('开始录音')
}

const stopRecording = () => {
  console.log('停止录音')
}

// 加载更多历史消息
const loadMoreHistory = () => {
  if (loadingHistory.value) return

  loadingHistory.value = true

  // 增加显示的消息数量
  const increment = 30
  const newCount = displayMessageCount.value + increment
  const totalMessages = messages.value.length

  setTimeout(() => {
    // 保存当前滚动位置
    const currentScrollHeight = messageList.value?.scrollHeight || 0

    displayMessageCount.value = Math.min(newCount, totalMessages)

    // 恢复滚动位置，避免跳动
    nextTick(() => {
      if (messageList.value) {
        const newScrollHeight = messageList.value.scrollHeight
        const scrollDiff = newScrollHeight - currentScrollHeight
        messageList.value.scrollTop += scrollDiff
      }
      loadingHistory.value = false
    })
  }, 300) // 模拟加载延迟
}

// 处理滚动事件
const handleScroll = () => {
  if (!messageList.value || loadingHistory.value) return

  // 当滚动到顶部附近时，自动加载更多历史消息
  if (messageList.value.scrollTop < 100 && hasMoreHistory.value) {
    loadMoreHistory()
  }
}

onMounted(async () => {
  console.log('聊天详情页面加载完成')

  // 初始化聊天对象
  await initChatUser()

  // 初始化聊天功能
  await initChat()

  // 清零该会话未读数
  const currentUserId = userStore.userInfo?.id
  const otherUserId = route.params.id
  if (currentUserId && otherUserId) {
    clearUnread(currentUserId, otherUserId).catch(() => {})
  }
})

onUnmounted(() => {
  console.log('聊天详情页面卸载')
  // 移除私聊消息处理器
  wsManager.offMessage('private', handleWebSocketMessage)
})
</script>

<style scoped>
/* 清新气泡设计变量 */
:root {
  --bubble-primary-fill: hsla(180, 15%, 98%, 0.88);
  --bubble-gradient-top: hsl(195, 5%, 100%);
  --bubble-gradient-bottom: hsl(170, 8%, 95%);
  --bubble-text-color: hsl(200, 30%, 45%);
  --bubble-sent-fill: hsla(160, 25%, 92%, 0.9);
  --bubble-sent-gradient-top: hsl(165, 15%, 98%);
  --bubble-sent-gradient-bottom: hsl(155, 20%, 88%);
}

.chat-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.ml-4 {
  margin-left: 16px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
}

.load-more-history {
  text-align: center;
  margin-bottom: 20px;
}

.message-wrapper {
  margin-bottom: 16px;
}

.time-divider {
  text-align: center;
  margin: 20px 0 16px;
}

.time-text {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 13px;
  border-radius: 14px;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  animation: messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin-bottom: 16px;
}

/* 发送的消息 - 整体右对齐，头像在右边 */
.message-item.message-sent {
  justify-content: flex-end;
}

/* 接收的消息 - 整体左对齐，头像在左边 */
.message-item:not(.message-sent) {
  justify-content: flex-start;
}

.message-avatar {
  margin: 0 12px;
  flex-shrink: 0;
}

.message-avatar .van-image {
  width: 52px !important;
  height: 52px !important;
}

/* 发送消息时，头像排在后面（右边） */
.message-sent .message-avatar {
  order: 2;
}

/* 发送消息时，内容排在前面（左边） */
.message-sent .message-content {
  order: 1;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.message-sent .message-content {
  align-items: flex-end;
}

.message-bubble {
  position: relative;
  padding: 18px 22px;
  word-wrap: break-word;
  line-height: 1.8;
  font-size: 17px;
  font-weight: 300;
  min-height: 24px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  transform-origin: center;
}

.message-bubble:hover {
  transform: scale(1.03);
  opacity: 0.82;
  animation: bubbleGlow 2s ease-in-out infinite;
}

.message-bubble:active {
  transform: scale(0.97) scaleY(0.92);
  transition: transform 0.1s ease-out;
}

/* 接收的消息气泡 - 水滴形状 */
.message-item:not(.message-sent) .text-message {
  background: linear-gradient(135deg, var(--bubble-gradient-top) 0%, var(--bubble-primary-fill) 50%, var(--bubble-gradient-bottom) 100%);
  color: var(--bubble-text-color);
  border-radius: 16px 24px 24px 8px;
  border: 0.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

/* 接收消息的小三角 */
.message-item:not(.message-sent) .text-message::before {
  content: '';
  position: absolute;
  left: -7px;
  bottom: 12px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-right: 8px solid var(--bubble-primary-fill);
  filter: blur(0.5px);
  opacity: 0.9;
}

/* 发送的消息气泡 - 青绿色系 */
.message-sent .text-message {
  background: linear-gradient(135deg, var(--bubble-sent-gradient-top) 0%, var(--bubble-sent-fill) 50%, var(--bubble-sent-gradient-bottom) 100%);
  color: hsl(160, 40%, 35%);
  border-radius: 24px 16px 8px 24px;
  border: 0.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

/* 发送消息的小三角 */
.message-sent .text-message::before {
  content: '';
  position: absolute;
  right: -7px;
  bottom: 12px;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-left: 8px solid var(--bubble-sent-fill);
  filter: blur(0.5px);
  opacity: 0.9;
}

/* 顶部高光效果 */
.message-bubble::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 30%;
  background: radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  border-radius: inherit;
  pointer-events: none;
}

/* 内部纹理效果 */
.bubble-content {
  position: relative;
  z-index: 1;
  margin-bottom: 4px;
  font-weight: 300;
  text-align: left;
}

.bubble-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px, 25px 25px;
  opacity: 0.3;
  pointer-events: none;
}

/* 边缘流光动画 */
@keyframes bubbleGlow {
  0%, 100% {
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 2px 8px rgba(0, 0, 0, 0.06),
      0 0 0 0 rgba(135, 206, 250, 0);
  }
  50% {
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      0 2px 12px rgba(0, 0, 0, 0.08),
      0 0 0 2px rgba(135, 206, 250, 0.3);
  }
}

/* 点击粒子效果 */
@keyframes particleBurst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.5) rotate(180deg);
    opacity: 0;
  }
}

.bubble-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, rgba(135, 206, 250, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: particleBurst 0.6s ease-out forwards;
}

/* 涟漪效果 */
@keyframes rippleWave {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.bubble-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(135, 206, 250, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: rippleWave 0.8s ease-out forwards;
}

/* 消息状态图标优化 */
.message-status {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  gap: 4px;
}

.message-status .van-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 入场动画优化 */
@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-2px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 4px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-content {
    max-width: 75%;
  }
  
  .message-bubble {
    font-size: 16px;
    padding: 12px 16px;
  }
  
  .message-item {
    gap: 10px;
    margin-bottom: 14px;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .message-bubble {
    padding: 14px 18px;
    font-size: 15px;
    line-height: 1.6;
  }
  
  .message-content {
    max-width: 78%;
  }
}

@media (max-width: 480px) {
  .message-bubble {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .message-content {
    max-width: 82%;
  }
}

.input-area {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--van-border-color);
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 100;
}

.input-toolbar {
  display: flex;
  align-items: center; /* 改为center，让所有元素居中对齐 */
  gap: 12px;
  width: 100%;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center; /* 改为center对齐 */
  background: #f7f8fa;
  border-radius: 20px;
  padding: 8px 12px;
  min-height: 40px;
  box-sizing: border-box;
}

.input-wrapper .van-field {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

.input-wrapper .van-field .van-field__control {
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.4;
  max-height: 100px;
  min-height: 24px;
  padding: 0;
}

.send-btn,
.voice-btn {
  flex-shrink: 0;
  padding: 8px;
  margin-left: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-1px); /* 向上微调1px */
}

.send-btn:hover,
.voice-btn:hover {
  transform: scale(1.1);
}

.send-btn:active,
.voice-btn:active {
  transform: scale(0.95);
}

/* 左右两侧的图标按钮 */
.input-toolbar > .van-icon:first-child,
.input-toolbar > .van-icon:last-child {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  transform: translateY(-2px); /* 向上微调2px */
}

.input-toolbar > .van-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.input-toolbar > .van-icon:active {
  transform: scale(0.95);
}

/* 确保所有元素垂直居中对齐 */
.input-toolbar * {
  box-sizing: border-box;
}

/* 移除van-field的默认样式 */
.input-wrapper .van-field .van-field__body {
  padding: 0;
}

.input-wrapper .van-field .van-field__control::placeholder {
  color: #969799;
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .input-area {
    padding: 10px 12px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
  
  .input-toolbar {
    gap: 10px;
  }
  
  .input-wrapper {
    padding: 6px 10px;
    min-height: 36px;
  }
  
  .input-toolbar > .van-icon:first-child,
  .input-toolbar > .van-icon:last-child {
    width: 36px;
    height: 36px;
    transform: translateY(-1px); /* 小屏幕上微调1px */
  }
  
  .send-btn,
  .voice-btn {
    transform: translateY(-0.5px); /* 小屏幕上微调0.5px */
  }
}

.emoji-picker {
  padding: 20px;
  background: white;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr); /* 每行显示8个表情 */
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 24px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: #f7f8fa;
}

.emoji-item:hover {
  background: #e8f4fd;
  transform: scale(1.1);
}

.emoji-item:active {
  transform: scale(0.95);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .emoji-grid {
    grid-template-columns: repeat(6, 1fr); /* 小屏幕每行6个 */
    gap: 10px;
  }
  
  .emoji-item {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}

@media (max-width: 360px) {
  .emoji-grid {
    grid-template-columns: repeat(5, 1fr); /* 更小屏幕每行5个 */
  }
}
</style>





























