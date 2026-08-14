/**
 * 统一认证失效处理（401 专用，带去重锁）。
 *
 * 仅当请求被判定为真正的认证失效（HTTP 401 / 认证机器码）时调用；
 * 403/404/409/429/500/网络错误绝不进入这里。多个并发 401 只触发一次。
 */
import { showDialog } from 'vant'

let handling = false

/**
 * 清空本地认证状态（与 store.logout 共用的纯函数）。
 */
export function clearLocalAuth() {
  localStorage.removeItem('userInfo')
  localStorage.removeItem('accessToken')
}

/**
 * 触发统一认证失效流程：弹一次提示 → 清状态 → 跳登录页。
 * @param {boolean} [guestExpired] 是否体验账户到期（走专属文案）
 */
export function handleAuthExpired({ guestExpired = false } = {}) {
  if (handling) return
  handling = true

  clearLocalAuth()

  const message = guestExpired ? '体验账户已到期，请重新登录'
    : '登录已过期，请重新登录'

  showDialog({
    title: '提示',
    message,
    confirmButtonText: '重新登录',
    showCancelButton: false,
    closeOnClickOverlay: false
  }).then(() => {
    handling = false
    window.location.href = '/login'
  }).catch(() => {
    handling = false
  })

  // 兜底：即使弹窗被阻断也确保最终回到登录
  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, 2000)
}
