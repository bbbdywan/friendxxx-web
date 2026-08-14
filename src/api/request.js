import axios from 'axios'
import { API_BASE } from '../config.js'
import { toApiError, isBusinessSuccess } from '../utils/apiError.js'
import { handleAuthExpired, clearLocalAuth } from '../utils/authExpired.js'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
// 职责：统一规范化错误为 ApiError。不自动弹 Toast（避免重复弹出），
// 不按 500/文案推断登录过期；仅 401/认证机器码触发统一认证失效。
request.interceptors.response.use(
  (response) => {
    const body = response.data
    // 纯文本 / 二进制响应原样返回
    if (body == null || typeof body !== 'object' || typeof body.code === 'undefined') {
      return body
    }
    // HTTP 2xx 但业务 code 非成功 → 规范化为 ApiError 并 reject
    if (!isBusinessSuccess(body.code)) {
      const err = toApiError(body, { httpStatus: response.status })
      handleAuthIfNeeded(err, response.config)
      return Promise.reject(err)
    }
    return body
  },
  (error) => {
    const apiError = toApiError(error)
    handleAuthIfNeeded(apiError, error.config)
    // 未登录场景（401 且请求本身非登录接口）：由统一流程处理，避免双重清理
    return Promise.reject(apiError)
  }
)

// 登录/体验登录接口的 401 属于业务失败（凭证错误），不触发全局登出
const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/guest']

/**
 * 只有真正的认证失效才走统一登出流程。
 */
function handleAuthIfNeeded(apiError, config) {
  const path = config?.url || ''
  if (AUTH_EXEMPT_PATHS.some(p => path.includes(p))) {
    return
  }
  if (apiError.isGuestExpired()) {
    clearLocalAuth()
    handleAuthExpired({ guestExpired: true })
    return
  }
  if (apiError.isAuthError()) {
    handleAuthExpired()
  }
}

export default request
