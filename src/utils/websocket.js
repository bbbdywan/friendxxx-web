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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host // 确保这行存在
    //const host = 'localhost:8080'
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
        if (event.data === '连接成功' || event.data === 'connected') {
          return
        }
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        if (event.data !== '连接成功') {
          console.error('解析WebSocket消息失败:', error, '原始数据:', event.data)
        }
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason)
      this.onDisconnected()

      // 自动重连（处理器不清空，重连后继续有效）
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

  // 处理收到的消息，按 type 分发给所有匹配的处理器
  handleMessage(data) {
    const messageType = data.type || 'default'

    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      handlers.forEach(fn => fn(data))
    }

    const defaultHandlers = this.messageHandlers.get('default')
    if (defaultHandlers && messageType !== 'default') {
      defaultHandlers.forEach(fn => fn(data))
    }
  }

  // 注册消息处理器（同一 type 支持多个）
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type).add(handler)
  }

  // 移除指定处理器；不传 handler 则移除该 type 全部
  offMessage(type, handler) {
    if (!handler) {
      this.messageHandlers.delete(type)
      return
    }
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) this.messageHandlers.delete(type)
    }
  }

  // 清除所有消息处理器
  clearMessageHandlers() {
    this.messageHandlers.clear()
  }

  // 等待连接建立
  async waitForConnection(timeout = 3000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) { resolve(true); return }
      const startTime = Date.now()
      const check = () => {
        if (this.isConnected()) resolve(true)
        else if (Date.now() - startTime > timeout) reject(new Error('WebSocket连接超时'))
        else setTimeout(check, 100)
      }
      check()
    })
  }

  // 发送消息
  async sendMessage(message) {
    if (!this.isConnected()) {
      try { await this.waitForConnection() } catch (e) { return false }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const str = typeof message === 'string' ? message : JSON.stringify(message)
      this.ws.send(str)
      return true
    }
    return false
  }

  // 断开连接（不清处理器，重连后仍然有效）
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.userId = null
      this.reconnectAttempts = 0
    }
  }

  // 退出登录时调用：彻底清除连接和所有处理器
  reset() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.userId = null
    this.reconnectAttempts = 0
    this.clearMessageHandlers()
  }

  // 连接成功回调（可被外部覆盖）
  onConnected() {}

  // 连接断开回调（可被外部覆盖）
  onDisconnected() {}

  // 是否已连接
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 全局单例
export const wsManager = new WebSocketManager()
export default wsManager
