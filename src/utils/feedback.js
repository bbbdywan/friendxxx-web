import { showToast, showSuccessToast, showFailToast, showDialog } from 'vant'
import { getApiErrorMessage } from './error.js'

/**
 * 全站统一反馈服务。
 * - 成功/轻量提示：Toast。
 * - 错误：非阻塞 Toast（除非调用方指定持久展示）。
 * - 关键操作失败：持久 Dialog/Panel 展示 message + traceId + 重试。
 * - 表单字段错误：由页面结合 getApiFieldErrors 定位。
 */
export const feedback = {
  /** 轻量成功提示 */
  success(message) {
    showSuccessToast(message || '操作成功')
  },

  /** 轻量错误提示（非阻塞，不中断当前操作） */
  error(error, fallback = '操作失败') {
    const msg = getApiErrorMessage(error, fallback)
    if (!msg) return
    showToast(msg)
  },

  /** 关键操作失败：持久 Dialog，展示错误 + traceId + 可选重试 */
  showOperationError({ title = '操作失败', error, retry }) {
    const msg = getApiErrorMessage(error, '操作失败')
    const e = error?.code != null ? error : (error?.response?.data || null)
    const traceId = e?.traceId || null
    const text = traceId ? `${msg}\n错误编号：${traceId}` : msg
    const actions = []
    if (retry) {
      actions.push({
        name: '重试',
        color: '#007AFF',
        action: () => { retry() }
      })
    }
    return showDialog({
      title,
      message: text,
      confirmButtonText: '知道了',
      closeOnClickOverlay: false
    })
  },

  /** 破坏性操作确认（删除/退出/覆盖） */
  confirmDestructive({ title = '确认', message, confirmText = '删除', danger = true, cancelText = '取消' }) {
    return showDialog({
      title,
      message,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      showCancelButton: true,
      closeOnClickOverlay: false
    })
  }
}

export default feedback
