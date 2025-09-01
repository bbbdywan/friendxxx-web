import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { login as loginApi, getCurrentUser, getUserTagsList } from '../api/user.js'
import wsManager from '../utils/websocket.js'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(null)
  const wsConnected = ref(false)
  
  // 用户缓存Map
  const userCache = ref(new Map())
  const userCacheLoaded = ref(false)

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => {
    return !!(token.value && userInfo.value)
  })
  
  // WebSocket连接方法
  const connectWebSocket = async () => {
    try {
      if (!userInfo.value?.id) {
        console.log('用户信息不存在，无法连接WebSocket')
        return false
      }
      
      console.log('开始连接WebSocket，用户ID:', userInfo.value.id)
      
      // 连接WebSocket
      wsManager.connect(userInfo.value.id)
      
      // 监听连接状态变化
      wsManager.onMessage('connection', (data) => {
        if (data.type === 'connected') {
          wsConnected.value = true
          console.log('WebSocket连接成功')
        } else if (data.type === 'disconnected') {
          wsConnected.value = false
          console.log('WebSocket连接断开')
        }
      })
      
      // 设置连接状态监听
      const originalOnConnected = wsManager.onConnected
      wsManager.onConnected = () => {
        wsConnected.value = true
        if (originalOnConnected) originalOnConnected()
      }
      
      const originalOnDisconnected = wsManager.onDisconnected
      wsManager.onDisconnected = () => {
        wsConnected.value = false
        if (originalOnDisconnected) originalOnDisconnected()
      }
      
      return true
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      wsConnected.value = false
      return false
    }
  }
  
  // 断开WebSocket连接
  const disconnectWebSocket = () => {
    try {
      wsManager.disconnect()
      wsConnected.value = false
      console.log('WebSocket连接已断开')
      return true
    } catch (error) {
      console.error('断开WebSocket失败:', error)
      return false
    }
  }
  
  // 登录方法 - 确保登录成功后自动连接WebSocket
  const login = async (credentials) => {
    try {
      console.log('Store: 开始登录:', credentials.userAccount)
      
      const response = await loginApi(credentials)
      console.log('Store: 登录API响应:', response)
      
      if (response.code === 200 || response.code === 0) {
        userInfo.value = response.data
        localStorage.setItem('userInfo', JSON.stringify(response.data))
        
        // 登录成功后立即连接WebSocket
        console.log('登录成功，开始连接WebSocket...')
        try {
          await connectWebSocket()
          console.log('WebSocket连接成功')
        } catch (wsError) {
          console.error('WebSocket连接失败:', wsError)
        }
        
        console.log('Store: 登录成功')
        return { success: true, data: response.data }
      }
    } catch (error) {
      console.error('Store: 登录异常:', error)
      return { success: false, message: error.message || '登录失败，请重试' }
    }
  }
  
  // 退出登录 - 移除token处理
  const logout = async () => {
    try {
      // 断开WebSocket连接
      disconnectWebSocket()
      
      // 清除本地数据，移除token相关操作
      userInfo.value = null
      wsConnected.value = false
      localStorage.removeItem('userInfo')
      
      console.log('Store: 已退出登录')
      return true
    } catch (error) {
      console.error('Store: 退出登录失败:', error)
      return false
    }
  }
  
  // 初始化用户信息 - 移除token检查
  const initUserInfo = () => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('userInfo')
      }
    }
  }
  
  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      if (!token.value) {
        console.log('Store: 没有token，无法获取用户信息')
        return false
      }
      
      const response = await getCurrentUser()
      console.log('Store: 获取用户信息响应:', response)
      
      if (response.code === 200 || response.code === 0) {
        const userData = response.data
        userInfo.value = userData
        localStorage.setItem('userInfo', JSON.stringify(userData))
        console.log('Store: 用户信息已更新:', userData)
        return true
      } else {
        console.error('Store: 获取用户信息失败:', response.message)
        return false
      }
    } catch (error) {
      console.error('Store: 获取用户信息异常:', error)
      return false
    }
  }
  
  // 从localStorage获取用户信息
  const getUserInfo = () => {
    try {
      const stored = localStorage.getItem('userInfo')
      if (stored) {
        userInfo.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
    return userInfo.value
  }
  
  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }
  
  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null
    token.value = null
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
  }
  
  // 检查登录状态 - 改为调用API验证
  const checkLoginStatus = async () => {
    try {
      const response = await getCurrentUser()
      if (response.code === 200 || response.code === 0) {
        userInfo.value = response.data
        return true
      }
      
      // 检查是否为用户过期
      if (response.code === 50000 && response.message === '系统内部错误') {
        // 用户过期，清除本地数据
        userInfo.value = null
        localStorage.removeItem('userInfo')
        return false
      }
      
      return false
    } catch (error) {
      if (error.response?.status === 401) {
        // 用户未登录，清除本地数据
        userInfo.value = null
        localStorage.removeItem('userInfo')
        return false
      }
      throw error
    }
  }

  // 获取并缓存所有用户数据
  const loadUserCache = async () => {
    if (userCacheLoaded.value) {
      console.log('用户缓存已加载，跳过重复请求')
      return userCache.value
    }

    try {
      console.log('开始加载用户缓存...')
      const response = await getUserTagsList()
      console.log('getUserTagsList API响应:', response)
      
      if (response.code === 200 || response.code === 0) {
        const users = Array.isArray(response.data) ? response.data : response.data?.records || []
        console.log('解析到的用户数据:', users)
        
        // 清空现有缓存
        userCache.value.clear()
        
        // 将用户数据存入Map缓存
        users.forEach(user => {
          console.log('缓存用户:', user)
          userCache.value.set(user.id, {
            id: user.id,
            username: user.username || user.userName || user.userAccount || '用户',
            avatarUrl: (user.avatarUrl || user.avatar || `https://picsum.photos/200/200?random=${user.id}`).trim(),
            userAccount: user.userAccount || '',
            age: user.age || 0,
            gender: user.gender,
            signature: user.signature || '',
            tags: user.tags || '[]',
            isOnline: user.isOnline || false
          })
        })
        
        userCacheLoaded.value = true
        console.log(`用户缓存加载完成，共缓存 ${userCache.value.size} 个用户`)
        console.log('缓存内容:', Array.from(userCache.value.entries()))
        return userCache.value
      } else {
        throw new Error(response.message || '获取用户列表失败')
      }
    } catch (error) {
      console.error('加载用户缓存失败:', error)
      throw error
    }
  }

  // 批量缓存用户数据
  const cacheUsers = (users) => {
    if (!Array.isArray(users)) return
    
    users.forEach(user => {
      if (user && user.id) {
        userCache.value.set(parseInt(user.id), {
          id: parseInt(user.id),
          username: user.username,
          userName: user.username, // 兼容字段
          avatarUrl: user.avatarUrl,
          avatar: user.avatarUrl, // 兼容字段
          age: user.age,
          gender: user.gender,
          signature: user.signature,
          tags: user.tags,
          isOnline: Math.random() > 0.5 // 模拟在线状态
        })
      }
    })
    
    userCacheLoaded.value = true
    console.log(`批量缓存${users.length}个用户，缓存总数:`, userCache.value.size)
  }

  // 根据用户ID获取缓存的用户信息 - 增强调试
  const getCachedUser = (userId) => {
    console.log('=== getCachedUser 调试信息 ===')
    console.log('查找用户ID:', userId, '类型:', typeof userId)
    console.log('缓存是否已加载:', userCacheLoaded.value)
    console.log('当前缓存大小:', userCache.value.size)
    console.log('缓存中的所有用户ID:', Array.from(userCache.value.keys()))
    
    // 尝试不同的ID类型查找
    const numericId = parseInt(userId)
    const stringId = String(userId)
    
    let user = userCache.value.get(numericId)
    if (!user) {
      user = userCache.value.get(stringId)
    }
    
    console.log('数字ID查找结果:', userCache.value.get(numericId))
    console.log('字符串ID查找结果:', userCache.value.get(stringId))
    console.log('最终找到的用户信息:', user)
    console.log('=== getCachedUser 调试信息结束 ===')
    
    if (!user && !userCacheLoaded.value) {
      console.log('缓存未加载且找不到用户，尝试加载缓存')
      loadUserCache().catch(console.error)
    }
    
    return user
  }

  // 更新用户缓存中的在线状态
  const updateUserOnlineStatus = (userId, isOnline) => {
    const user = userCache.value.get(parseInt(userId))
    if (user) {
      user.isOnline = isOnline
    }
  }

  // 确保未读消息数有默认值
  const totalUnreadCount = ref(0)

  // 安全的更新总未读消息数
  const updateTotalUnreadCount = (count) => {
    const safeCount = Math.max(0, parseInt(count) || 0)
    totalUnreadCount.value = safeCount
    console.log('更新总未读消息数:', safeCount)
  }

  // 增加未读消息数
  const incrementUnreadCount = (increment = 1) => {
    totalUnreadCount.value += increment
    console.log('增加未读消息数:', increment, '总数:', totalUnreadCount.value)
  }

  // 减少未读消息数
  const decrementUnreadCount = (decrement = 1) => {
    totalUnreadCount.value = Math.max(0, totalUnreadCount.value - decrement)
    console.log('减少未读消息数:', decrement, '总数:', totalUnreadCount.value)
  }

  // 清空特定聊天的未读消息数
  const clearChatUnreadCount = (chatId) => {
    // 这个方法会在进入聊天详情页时调用
    console.log('清空聊天未读消息:', chatId)
  }

  return {
    userInfo,
    token,
    wsConnected,
    isLoggedIn,
    login,
    logout,
    connectWebSocket,
    disconnectWebSocket,
    fetchCurrentUser,
    initUserInfo,
    getUserInfo,
    setUserInfo,
    clearUserInfo,
    checkLoginStatus,
    loadUserCache,
    cacheUsers,
    getCachedUser,
    updateUserOnlineStatus,
    totalUnreadCount: readonly(totalUnreadCount),
    updateTotalUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    clearChatUnreadCount
  }
})





























