/**
 * 统一 API 错误类型与解析工具。
 *
 * 全站所有请求错误（Axios、SSE/fetch）都应归一化为 ApiError，字段：
 *   status       HTTP 状态（0 = 无响应/网络错误）
 *   code         业务码或机器码（数字或字符串）
 *   message      面向用户的展示文案
 *   fieldErrors  表单字段错误 { field: message }
 *   traceId      服务端 traceId（未知 500 提供）
 *   details      安全详情（仅开发环境展示）
 *   cause        原始错误/响应对象（仅控制台调试）
 *
 * 认证语义约定：
 *   isAuthError() === true 仅当 status===401（HTTP）或 code 属于认证机器码。
 *   403/404/409/429/500/网络错误一律不是认证失效，绝不触发登出。
 */

const AUTH_CODES = ['AUTH_EXPIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED', 'UNAUTHORIZED']
const GUEST_EXPIRED_CODE = 'GUEST_ACCOUNT_EXPIRED'

export class ApiError extends Error {
  constructor({ status = 0, code = null, message = '请求失败', fieldErrors = null,
                traceId = null, details = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.message = message
    this.fieldErrors = fieldErrors
    this.traceId = traceId
    this.details = details
    this.cause = cause
  }

  /** 是否真正的认证失效（只有它才触发清登录 + 跳登录页） */
  isAuthError() {
    if (this.status === 401) return true
    const code = this.code
    if (typeof code === 'string') {
      return AUTH_CODES.includes(code.toUpperCase())
    }
    if (typeof code === 'number') {
      return code === 401
    }
    return false
  }

  /** 是否"体验账户到期"业务错误（仅该码显示体验到期文案） */
  isGuestExpired() {
    return String(this.code || '') === GUEST_EXPIRED_CODE
  }

  /** 是否主动取消 */
  isAborted() {
    return this.cause?.name === 'AbortError'
  }
}

const SUCCESS_CODES = [200, 0]

function isSuccessCode(code) {
  return typeof code === 'number' && SUCCESS_CODES.includes(code)
}

function safeMessage(raw, maxLen = 200) {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw.trim().slice(0, maxLen)
  return String(raw).trim().slice(0, maxLen)
}

/**
 * 从任意 axios 错误 / 业务响应 / 网络异常构造 ApiError。
 * @param {*} raw axios error 或 Result 对象
 * @param {object} [opts]
 * @param {number} [opts.httpStatus] 显式 HTTP 状态（SSE 场景使用）
 * @returns {ApiError}
 */
export function toApiError(raw, { httpStatus } = {}) {
  if (raw instanceof ApiError) return raw

  // Axios 错误：raw.response 存在
  if (raw && raw.response) {
    const status = raw.response.status || 0
    const data = raw.response.data
    const parsed = parseResponseBody(data)
    return new ApiError({
      status,
      code: parsed.code,
      message: parsed.message || statusMessage(status),
      fieldErrors: parsed.fieldErrors,
      traceId: parsed.traceId,
      details: parsed.details,
      cause: raw
    })
  }

  // 网络层无响应
  if (raw && !raw.response && raw.request) {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: /timeout|timeout/i.test(String(raw.message)) ? '请求超时，请稍后重试' : '网络异常，请检查网络后重试',
      cause: raw
    })
  }

  // 业务响应对象（HTTP 200 但 code 非成功，由拦截器调用）
  if (raw && typeof raw.code !== 'undefined') {
    const data = raw.data
    const fieldErrors = extractFieldErrors(data)
    return new ApiError({
      status: httpStatus || 200,
      code: raw.code,
      message: safeMessage(raw.message) || '操作失败',
      fieldErrors,
      traceId: raw.traceId || data?.traceId || null,
      details: data?.details || null,
      cause: raw
    })
  }

  // 主动取消
  if (raw && (raw.name === 'AbortError' || (raw.message && raw.message.includes('AbortError')))) {
    return new ApiError({ status: 0, code: 'ABORTED', message: '已取消', cause: raw })
  }

  // 普通 Error 或字符串
  if (raw && raw.message) {
    const msg = safeMessage(raw.message)
    if (/network|Failed to fetch/i.test(msg)) {
      return new ApiError({ status: 0, code: 'NETWORK_ERROR', message: '网络异常，请稍后重试', cause: raw })
    }
    return new ApiError({ status: 0, code: null, message: msg || fallback(), cause: raw })
  }
  if (raw && typeof raw === 'string') {
    return new ApiError({ status: 0, code: null, message: safeMessage(raw) || fallback(), cause: raw })
  }
  return new ApiError({ status: 0, code: null, message: fallback(), cause: raw })
}

function fallback() {
  return '请求失败'
}

/**
 * 解析响应体（兼容 JSON / 纯文本 / HTML 错误页）。
 */
export function parseResponseBody(body) {
  if (body == null) return {}
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (!trimmed) return {}
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseResponseBody(JSON.parse(trimmed))
      } catch {
        /* fallthrough */
      }
    }
    // HTML 或纯文本：不泄露给用户
    if (trimmed.startsWith('<')) {
      return { message: '服务暂不可用，请稍后重试' }
    }
    return { message: trimmed.slice(0, 200) }
  }
  if (typeof body === 'object') {
    const data = body.data
    return {
      code: body.code ?? data?.code ?? null,
      message: safeMessage(body.message ?? data?.message),
      fieldErrors: extractFieldErrors(data || body),
      traceId: body.traceId ?? data?.traceId ?? null,
      details: data?.details ?? null
    }
  }
  return {}
}

function extractFieldErrors(data) {
  if (!data || typeof data !== 'object') return null
  const fe = data.fieldErrors || data.fields
  if (fe && typeof fe === 'object' && !Array.isArray(fe)) {
    const out = {}
    for (const [k, v] of Object.entries(fe)) out[k] = safeMessage(v)
    return out
  }
  if (Array.isArray(fe)) {
    const out = {}
    for (const item of fe) {
      if (item && item.field) out[item.field] = safeMessage(item.message || item.defaultMessage)
    }
    return Object.keys(out).length ? out : null
  }
  return null
}

function statusMessage(status) {
  return {
    400: '请求参数错误',
    401: '登录已过期，请重新登录',
    403: '无权限访问',
    404: '资源不存在',
    409: '数据冲突，请刷新后重试',
    429: '请求过于频繁，请稍后再试',
    500: '系统错误，请稍后重试'
  }[status] || '请求失败'
}

/**
 * 从 ApiError 提取面向用户的展示文案。
 */
export function apiErrorMessage(err, fallback = '操作失败') {
  if (err == null) return fallback
  const e = toApiError(err)
  return e.message || fallback
}

/**
 * 判断给定响应对象是否业务成功。
 */
export function isBusinessSuccess(code) {
  return isSuccessCode(code)
}

export { GUEST_EXPIRED_CODE }
