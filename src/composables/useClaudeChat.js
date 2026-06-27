import { ref, onMounted, onUnmounted } from 'vue'
import { CLAUDE_WS } from '@/config.js'

const STORAGE_KEY = 'claude-chat-messages'

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

function saveMessages(messages) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
}

// ============ 模块级单例：连接不随组件销毁 ============
let ws = null
let reconnectTimer = null
let pingTimer = null
const status = ref('disconnected')
const messages = ref(loadMessages())
const currentStreamIdx = ref(-1)
const listeners = new Set()

function notifyListeners() {
  listeners.forEach(fn => fn(messages.value))
}

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }

  status.value = 'connecting'
  ws = new WebSocket(CLAUDE_WS)

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', role: 'phone' }))
  }

  ws.onmessage = (e) => {
    let msg
    try { msg = JSON.parse(e.data) } catch { return }

    switch (msg.type) {
      case 'auth_ok':
        status.value = 'connected'
        break
      case 'chunk':
        if (currentStreamIdx.value === -1) {
          currentStreamIdx.value = messages.value.length
          messages.value.push({ role: 'claude', text: '', streaming: true })
        }
        messages.value[currentStreamIdx.value].text += msg.text
        break
      case 'done':
        if (currentStreamIdx.value !== -1) {
          messages.value[currentStreamIdx.value].streaming = false
          currentStreamIdx.value = -1
        }
        break
      case 'error':
        messages.value.push({ role: 'error', text: msg.text })
        if (currentStreamIdx.value !== -1) {
          messages.value[currentStreamIdx.value].streaming = false
          currentStreamIdx.value = -1
        }
        break
      case 'pong':
        break
    }
    notifyListeners()
  }

  ws.onclose = () => {
    status.value = 'disconnected'
    scheduleReconnect()
  }

  ws.onerror = () => {
    if (ws) ws.close()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 3000)
}

function disconnect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
  if (ws) { ws.close(); ws = null }
  status.value = 'disconnected'
}

// 心跳
pingTimer = setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }))
  }
}, 25000)

// 页面重新可见时立即重连（解决 Edge 后台节流问题）
function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      connect()
    }
  }
}
document.addEventListener('visibilitychange', onVisibilityChange)

function send(text) {
  if (!text.trim()) return
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    // 连接未就绪，触发重连
    connect()
    return
  }
  messages.value.push({ role: 'user', text, timestamp: Date.now() })
  ws.send(JSON.stringify({ type: 'message', text }))
  notifyListeners()
}

function clearMessages() {
  messages.value = []
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
  notifyListeners()
}

// ============ Composable ============
export function useClaudeChat() {
  const onUpdate = () => {}

  onMounted(() => {
    listeners.add(onUpdate)
    // 确保连接活跃
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      connect()
    }
  })

  onUnmounted(() => {
    listeners.delete(onUpdate)
    // 不再 disconnect，连接保持
  })

  return { status, messages, send, disconnect, connect, clearMessages }
}
