<template>
  <div class="chat-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <h1>聊天</h1>
      <div class="nav-actions">
        <van-icon name="search" size="20" @click="showSearch = true" />
        <van-icon name="add-o" size="20" class="ml-4" @click="showAddModal = true" />
      </div>
    </div>

    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-bar">
      <van-search 
        v-model="searchKeyword" 
        placeholder="搜索聊天记录..." 
        @cancel="showSearch = false"
        show-action
      />
    </div>

    <!-- 聊天列表 -->
    <div class="chat-list" v-if="!loading">
      <div 
        v-for="chat in filteredChats" 
        :key="chat.id"
        class="chat-item"
        @click="enterChat(chat)"
      >
        <div class="chat-avatar">
          <van-image :src="chat.user.avatar" fit="cover" round width="50" height="50" />
          <div v-if="chat.user.isOnline" class="online-dot"></div>
          <div v-if="chat.unreadCount > 0" class="unread-badge">
            {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
          </div>
        </div>
        
        <div class="chat-content">
          <div class="chat-header">
            <h3 class="chat-name">{{ chat.user.name }}</h3>
            <span class="chat-time">{{ formatTime(chat.lastMessage.timestamp) }}</span>
          </div>
          <div class="chat-preview">
            <span class="last-message" :class="{ unread: chat.unreadCount > 0 }">
              {{ getMessagePreview(chat.lastMessage) }}
            </span>
            <van-icon v-if="chat.lastMessage.type === 'image'" name="photo-o" size="14" />
            <van-icon v-if="chat.lastMessage.type === 'voice'" name="volume-o" size="14" />
          </div>
        </div>
        
        <div class="chat-actions">
          <van-icon 
            name="delete-o" 
            size="16" 
            color="#999"
            @click.stop="deleteChat(chat.id)"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-if="filteredChats.length === 0"
      illustration="💬"
      title="暂无聊天记录"
      description="去发现页面找到心仪的人开始聊天吧"
      action-text="去发现"
      @action="$router.push('/discover')"
    />

    <!-- 添加聊天弹窗 -->
    <van-popup v-model:show="showAddModal" position="bottom" :style="{ height: '60%' }">
      <div class="add-modal">
        <div class="modal-header">
          <h3>开始新聊天</h3>
          <van-icon name="cross" @click="showAddModal = false" />
        </div>
        
        <div class="contact-list">
          <div 
            v-for="contact in contacts" 
            :key="contact.id"
            class="contact-item"
            @click="startNewChat(contact)"
          >
            <van-image :src="contact.avatar" fit="cover" round width="40" height="40" />
            <div class="contact-info">
              <h4>{{ contact.name }}</h4>
              <p>{{ contact.bio }}</p>
            </div>
            <div v-if="contact.isOnline" class="online-status">在线</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除聊天"
      message="确定要删除这个聊天记录吗？"
      show-cancel-button
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { getChatList, getMessageList, deleteChatMessage } from '@/api/chat'
import wsManager from '@/utils/websocket'
import EmptyState from '../components/EmptyState.vue'

const router = useRouter()
const userStore = useUserStore()
const searchKeyword = ref('')
const showSearch = ref(false)
const showAddModal = ref(false)
const chats = ref([])
const loading = ref(false)

// 获取聊天列表
const fetchChatList = async () => {
  try {
    loading.value = true
    
    // 确保用户已登录
    if (!userStore.userInfo?.id) {
      await userStore.fetchCurrentUser()
    }
    
    // 确保用户缓存已加载
    if (!userStore.userCacheLoaded) {
      await userStore.loadUserCache()
    }
    
    const currentUserId = parseInt(userStore.userInfo.id)
    
    // 获取最近发消息的用户列表，传递当前用户ID
    const response = await getMessageList(currentUserId)
    
    if (response.code === 200 && response.data) {
      chats.value = response.data
        .map(item => {
          const senderId = parseInt(item.senderId)
          const receiverId = parseInt(item.receiverId)
          
          // 判断聊天对象ID：如果当前用户是发送者，聊天对象就是接收者；反之亦然
          const chatUserId = currentUserId === senderId ? receiverId : senderId
          const senderInfo = userStore.getCachedUser(chatUserId)
          
          console.log(`处理消息: 发送者${senderId}, 接收者${receiverId}, 当前用户${currentUserId}, 聊天对象${chatUserId}:`, senderInfo)
          
          // 如果获取不到用户信息，返回null，后续会被过滤掉
          if (!senderInfo) {
            console.log(`用户${chatUserId}信息不存在，将从聊天列表中移除`)
            return null
          }
          
          return {
            id: chatUserId,
            user: {
              id: chatUserId,
              name: senderInfo?.username || senderInfo?.userName || `用户${chatUserId}`,
              avatar: senderInfo?.avatarUrl || senderInfo?.avatar || `https://picsum.photos/200/200?random=${chatUserId}`,
              isOnline: senderInfo?.isOnline || false
            },
            lastMessage: {
              content: item.content || '开始聊天吧',
              type: 'text',
              timestamp: new Date(item.createTime),
              sender: currentUserId === senderId ? 'me' : 'other'
            },
            unreadCount: 0
          }
        })
        .filter(chat => chat !== null) // 过滤掉null值（即获取不到用户信息的聊天）
        .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp))
      
      console.log('处理后的聊天列表:', chats.value)
    }
  } catch (error) {
    console.error('获取聊天列表失败:', error)
    showToast('获取聊天列表失败')
  } finally {
    loading.value = false
  }
}

// 过滤聊天列表
const filteredChats = computed(() => {
  if (!searchKeyword.value) return chats.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return chats.value.filter(chat => 
    chat.user.name.toLowerCase().includes(keyword) ||
    chat.lastMessage.content.toLowerCase().includes(keyword)
  )
})

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  
  // 今天的消息只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天的消息显示"昨天"
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  // 一周内的消息显示星期几
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const dayDiff = Math.floor((now - date) / (24 * 60 * 60 * 1000))
  if (dayDiff < 7) {
    return `星期${weekDays[date.getDay()]}`
  }
  
  // 其他显示日期
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 获取消息预览
const getMessagePreview = (message) => {
  if (message.type === 'text') {
    return message.content
  } else if (message.type === 'image') {
    return '[图片]'
  } else if (message.type === 'voice') {
    return '[语音]'
  } else if (message.type === 'video') {
    return '[视频]'
  } else if (message.type === 'location') {
    return '[位置]'
  } else {
    return '[未知消息类型]'
  }
}

// 删除聊天
const deleteChat = async (chatId) => {
  try {
    // await showDialog({
    //   title: '删除聊天',
    //   message: '确定要删除这个聊天吗？聊天记录将会被清空。',
    //   showCancelButton: true
    // })
    
    // 构造聊天标识 private_{minId}_{maxId}
    const currentUserId = userStore.userInfo?.id
    const otherUserId = chatId
    const minId = Math.min(currentUserId, otherUserId)
    const maxId = Math.max(currentUserId, otherUserId)
    const chatKey = `private_${minId}_${maxId}`
    
    // 调用后端删除接口
    await deleteChatMessage(chatKey)
    
    // 从列表中移除
    chats.value = chats.value.filter(chat => chat.id !== chatId)
    showToast('聊天已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除聊天失败:', error)
      showToast('删除失败，请重试')
    }
  }
}

// 初始化时加载用户缓存和注册消息监听
onMounted(async () => {
  console.log('ChatPage mounted, 开始初始化...')
  console.log('wsManager状态:', wsManager)
  console.log('用户信息:', userStore.userInfo)
  
  await fetchChatList()
  
  // 确保用户信息已加载
  if (!userStore.userInfo?.id) {
    console.log('用户信息未加载，尝试获取...')
    await userStore.fetchCurrentUser()
  }
  
  // 加载用户缓存
  try {
    await userStore.loadUserCache()
    console.log('用户缓存加载完成，缓存大小:', userStore.userCache?.size)
  } catch (error) {
    console.error('加载用户缓存失败:', error)
  }
  
  // 测试缓存是否正常工作
  console.log('测试获取用户ID为1的缓存信息:', userStore.getCachedUser(1))
  
  // 注册消息监听...
  if (wsManager) {
    if (typeof wsManager.onMessage === 'function') {
      wsManager.onMessage('private', handleIncomingMessage)
      console.log('已注册private消息监听')
    }
  }
})

// 组件卸载时清理监听器
onUnmounted(() => {
  console.log('ChatPage unmounted, 清理监听器...')
  if (wsManager && typeof wsManager.offMessage === 'function') {
    wsManager.offMessage('private', handleIncomingMessage)
    console.log('已移除private消息监听器')
  }
})

// 处理接收到的WebSocket消息 - 添加更详细的调试
const handleIncomingMessage = (message) => {
  console.log('ChatPage收到新消息:', message)
  
  const { fromUserId, message: content, timestamp, type, toUserId } = message
  
  if (type !== 'private' || !fromUserId || !content) {
    console.log('消息类型不匹配或缺少必要字段')
    return
  }
  
  const currentUserId = parseInt(userStore.userInfo?.id)
  const senderId = parseInt(fromUserId)
  const receiverId = parseInt(toUserId)
  
  console.log('类型转换后 - 当前用户:', currentUserId, '发送者:', senderId, '接收者:', receiverId)
  
  if (receiverId === currentUserId) {
    console.log('这是发给当前用户的消息，开始处理...')
    
    // 详细检查缓存状态
    console.log('用户缓存是否已加载:', userStore.userCacheLoaded)
    console.log('用户缓存大小:', userStore.userCache?.size)
    console.log('缓存中的所有用户ID:', Array.from(userStore.userCache?.keys() || []))
    
    // 从缓存中获取发送者信息
    const senderInfo = userStore.getCachedUser(senderId)
    console.log('从缓存获取的发送者信息:', senderInfo)
    
    if (senderInfo) {
      console.log('使用缓存中的用户信息')
      updateChatList(senderId, senderInfo, content, timestamp)
    } else {
      console.warn(`未找到用户ID ${senderId} 的缓存信息，使用默认信息`)
      
      // 如果缓存未加载，先尝试加载缓存
      if (!userStore.userCacheLoaded) {
        console.log('缓存未加载，尝试重新加载...')
        userStore.loadUserCache().then(() => {
          const retryUserInfo = userStore.getCachedUser(senderId)
          if (retryUserInfo) {
            console.log('重新加载后找到用户信息:', retryUserInfo)
            updateChatList(senderId, retryUserInfo, content, timestamp)
          } else {
            console.log('重新加载后仍未找到用户信息，使用默认信息')
            updateChatList(senderId, {
              username: `用户${senderId}`,
              avatarUrl: `https://picsum.photos/200/200?random=${senderId}`,
              isOnline: false
            }, content, timestamp)
          }
        }).catch(error => {
          console.error('重新加载缓存失败:', error)
          updateChatList(senderId, {
            username: `用户${senderId}`,
            avatarUrl: `https://picsum.photos/200/200?random=${senderId}`,
            isOnline: false
          }, content, timestamp)
        })
        return // 等待异步加载完成
      }
      
      // 使用默认信息
      updateChatList(senderId, {
        username: `用户${senderId}`,
        avatarUrl: `https://picsum.photos/200/200?random=${senderId}`,
        isOnline: false
      }, content, timestamp)
    }
  }
}

// 计算未读消息总数
const calculateTotalUnreadCount = () => {
  const total = chats.value.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
  console.log('未读消息总数:', total)
  
  // 更新用户store中的未读消息数（如果有这个功能）
  if (userStore.setUnreadCount) {
    userStore.setUnreadCount(total)
  }
  
  return total
}

// 进入聊天详情页
const enterChat = (chat) => {
  console.log('进入聊天详情页:', chat.id)
  
  // 清除该聊天的未读消息数
  const chatIndex = chats.value.findIndex(c => c.id === chat.id)
  if (chatIndex !== -1) {
    chats.value[chatIndex].unreadCount = 0
    saveChatsToStorage()
    calculateTotalUnreadCount()
  }
  
  // 跳转到聊天详情页
  router.push(`/chat/${chat.id}`)
}

// 保存聊天列表到本地存储
const saveChatsToStorage = () => {
  try {
    const chatData = {
      chats: chats.value,
      timestamp: Date.now()
    }
    localStorage.setItem('chatList', JSON.stringify(chatData))
    console.log('聊天列表已保存到本地存储')
  } catch (error) {
    console.error('保存聊天列表失败:', error)
  }
}

// 从本地存储加载聊天列表
const loadChatsFromStorage = () => {
  try {
    const stored = localStorage.getItem('chatList')
    if (stored) {
      const chatData = JSON.parse(stored)
      if (chatData.chats && Array.isArray(chatData.chats)) {
        chats.value = chatData.chats
        calculateTotalUnreadCount()
        console.log('从本地存储加载聊天列表:', chats.value.length, '条')
      }
    }
  } catch (error) {
    console.error('加载本地聊天列表失败:', error)
  }
}

// 更新聊天列表
const updateChatList = (userId, userInfo, messageContent, timestamp) => {
  console.log('开始更新聊天列表:', { userId, userInfo, messageContent, timestamp })
  
  const existingChatIndex = chats.value.findIndex(chat => chat.id === userId)
  console.log('现有聊天记录索引:', existingChatIndex)
  
  const chatItem = {
    id: userId,
    user: {
      id: userId,
      name: userInfo.username || userInfo.name || `用户${userId}`,
      avatar: userInfo.avatarUrl || userInfo.avatar || `https://picsum.photos/200/200?random=${userId}`,
      isOnline: userInfo.isOnline || false
    },
    lastMessage: {
      content: messageContent,
      type: 'text',
      timestamp: new Date(timestamp),
      sender: 'other'
    },
    unreadCount: 1
  }
  
  console.log('创建的聊天项:', chatItem)
  
  if (existingChatIndex >= 0) {
    // 更新现有聊天记录
    const existingChat = chats.value[existingChatIndex]
    chatItem.unreadCount = (existingChat.unreadCount || 0) + 1
    
    console.log('更新现有聊天记录')
    // 移除旧记录并添加到顶部
    chats.value.splice(existingChatIndex, 1)
    chats.value.unshift(chatItem)
  } else {
    // 添加新的聊天记录到顶部
    console.log('添加新的聊天记录')
    chats.value.unshift(chatItem)
  }
  
  console.log('聊天列表更新完成，当前列表:', chats.value)
  
  // 强制触发响应式更新
  nextTick(() => {
    console.log('强制更新完成')
  })
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding-bottom: 80px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-nav h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ml-4 {
  margin-left: 16px;
}

.search-bar {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
}

.chat-list {
  padding: 0 var(--spacing-lg);
}

.chat-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 182, 193, 0.2);
}

.chat-avatar {
  position: relative;
  margin-right: var(--spacing-lg);
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--primary-pink);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.chat-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.chat-preview {
  display: flex;
  align-items: center;
  gap: 4px;
}

.last-message {
  font-size: 14px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.last-message.unread {
  color: var(--color-text);
  font-weight: 600;
}

.chat-actions {
  margin-left: var(--spacing-md);
}

.add-modal {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 18px;
  color: var(--color-text);
  margin: 0;
}

.contact-list {
  space-y: var(--spacing-md);
}

.contact-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: var(--spacing-md);
}

.contact-item:hover {
  border-color: var(--primary-pink);
  background: rgba(255, 182, 193, 0.05);
}

.contact-info {
  flex: 1;
  margin-left: var(--spacing-lg);
}

.contact-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.contact-info p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.online-status {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-item {
    padding: var(--spacing-md);
  }
  
  .chat-avatar {
    margin-right: var(--spacing-md);
  }
}
</style>
























