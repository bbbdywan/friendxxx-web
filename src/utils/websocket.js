// WebSocket管理器
class WebSocketManager {
  constructor() {
    this.ws = null
    this.userId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.messageHandlers = new Map()
  }

  // 连接WebSocket
  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接')
      return
    }

    this.userId = userId
    // 使用当前域名，nginx会代理WebSocket连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    //const host = window.location.host // 确保这行存在
    const host = 'localhost:8080'
    const wsUrl = `${protocol}//${host}/api/websocket/${userId}`
    
    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
      console.log(`正在连接WebSocket: ${wsUrl}`)
    } catch (error) {
      console.error('WebSocket连接失败:', error)
    }
  }

  // 设置事件处理器
  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket连接成功')
      this.reconnectAttempts = 0
      this.onConnected()
    }

    this.ws.onmessage = (event) => {
      try {
        console.log('收到WebSocket原始消息:', event.data)
        
        // 处理非JSON消息（如"连接成功"）
        if (event.data === '连接成功' || event.data === 'connected') {
          console.log('WebSocket连接确认消息')
          return
        }
        
        // 尝试解析JSON消息
        const data = JSON.parse(event.data)
        console.log('解析后的消息:', data)
        this.handleMessage(data)
      } catch (error) {
        // 如果不是JSON，当作普通文本处理
        console.log('收到文本消息:', event.data)
        if (event.data !== '连接成功') {
          console.error('解析WebSocket消息失败:', error, '原始数据:', event.data)
        }
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason)
      this.onDisconnected()
      
      // 自动重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        setTimeout(() => {
          if (this.userId) {
            this.connect(this.userId)
          }
        }, this.reconnectInterval)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
  }

  // 等待连接建立
  async waitForConnection(timeout = 3000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve(true)
        return
      }
      
      const startTime = Date.now()
      const checkConnection = () => {
        if (this.isConnected()) {
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('WebSocket连接超时'))
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      
      checkConnection()
    })
  }

  // 发送消息前确保连接
  async sendMessage(message) {
    // 如果未连接，等待连接建立
    if (!this.isConnected()) {
      console.log('WebSocket未连接，等待连接建立...')
      try {
        await this.waitForConnection()
      } catch (error) {
        console.error('等待WebSocket连接失败:', error)
        return false
      }
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      this.ws.send(messageStr)
      console.log('发送WebSocket消息:', messageStr)
      return true
    } else {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }
  }

  // 处理收到的消息
  handleMessage(data) {
    console.log('处理WebSocket消息:', data)
    
    // 根据消息类型分发给不同的处理器
    const messageType = data.type || 'default'
    const handler = this.messageHandlers.get(messageType)
    
    if (handler) {
      handler(data)
    }
    
    // 同时也触发默认处理器，确保消息不会丢失
    const defaultHandler = this.messageHandlers.get('default')
    if (defaultHandler && messageType !== 'default') {
      defaultHandler(data)
    }
  }

  // 注册消息处理器（避免重复注册）
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler)
  }

  // 移除消息处理器
  offMessage(type) {
    this.messageHandlers.delete(type)
  }

  // 清除所有消息处理器
  clearMessageHandlers() {
    this.messageHandlers.clear()
  }

  // 连接成功回调
  onConnected() {
    // 可以在这里发送心跳或初始化消息
  }

  // 连接断开回调
  onDisconnected() {
    // 连接断开时的处理
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.userId = null
      this.reconnectAttempts = 0
    }
    // 清除消息处理器
    this.clearMessageHandlers()
  }

  // 获取连接状态
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 创建全局WebSocket实例
export const wsManager = new WebSocketManager()

// 默认导出
export default wsManager





