// 开发环境走 Vite proxy，相对路径即可
// Capacitor 打包时设环境变量：
//   VITE_API_BASE=http://你的服务器IP:8080/api
//   VITE_WS_BASE=ws://你的服务器IP:8080/api/websocket
const DEV_API = '/api'
const DEV_WS = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/api/websocket`
})()

export const API_BASE = import.meta.env.VITE_API_BASE || DEV_API
export const WS_BASE = import.meta.env.VITE_WS_BASE || DEV_WS
export const CLAUDE_WS = import.meta.env.VITE_CLAUDE_WS || (
  window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws`
    : `ws://${window.location.host}/ws`
)
