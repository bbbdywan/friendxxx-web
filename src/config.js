import { Capacitor } from '@capacitor/core'

export const IS_NATIVE = Capacitor.isNativePlatform()
const NATIVE_API = 'http://111.228.10.5/api'
const NATIVE_WS = 'ws://111.228.10.5/api/websocket'
const DEV_API = '/api'
const DEV_WS = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/api/websocket`
})()

export const API_BASE = import.meta.env.VITE_API_BASE || (IS_NATIVE ? NATIVE_API : DEV_API)
export const WS_BASE = import.meta.env.VITE_WS_BASE || (IS_NATIVE ? NATIVE_WS : DEV_WS)
export const CLAUDE_WS = import.meta.env.VITE_CLAUDE_WS || (
  window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws`
    : `ws://${window.location.host}/ws`
)
