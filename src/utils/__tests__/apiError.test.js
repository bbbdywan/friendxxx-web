import { describe, it, expect } from 'vitest'
import { ApiError, toApiError, apiErrorMessage, isBusinessSuccess, parseResponseBody } from '../apiError.js'

describe('ApiError 认证语义', () => {
  it('HTTP 401 是认证失效', () => {
    const err = toApiError({ response: { status: 401, data: { code: 'TOKEN_EXPIRED', message: '登录已过期' } } })
    expect(err.status).toBe(401)
    expect(err.isAuthError()).toBe(true)
  })

  it('认证机器码也是认证失效', () => {
    const err = new ApiError({ status: 200, code: 'TOKEN_INVALID' })
    expect(err.isAuthError()).toBe(true)
  })

  it('HTTP 403/404/409/429/500 不是认证失效', () => {
    for (const s of [403, 404, 409, 429, 500]) {
      const err = toApiError({ response: { status: s, data: { message: 'x' } } })
      expect(err.isAuthError()).toBe(false)
      expect(err.status).toBe(s)
    }
  })

  it('业务 50000 系统内部错误不是认证失效', () => {
    const err = toApiError({ code: 50000, message: '系统内部错误' })
    expect(err.isAuthError()).toBe(false)
  })

  it('仅 GUEST_ACCOUNT_EXPIRED 判定体验到期', () => {
    const err = new ApiError({ status: 200, code: 'GUEST_ACCOUNT_EXPIRED' })
    expect(err.isGuestExpired()).toBe(true)
    const normal = new ApiError({ status: 401 })
    expect(normal.isGuestExpired()).toBe(false)
  })
})

describe('toApiError 解析', () => {
  it('HTTP 200 但业务失败 → 结构化 ApiError', () => {
    const err = toApiError({ code: 400, message: '参数校验失败', data: { fieldErrors: { name: '名称必填' } } })
    expect(err.code).toBe(400)
    expect(err.fieldErrors).toEqual({ name: '名称必填' })
  })

  it('解析 400 响应字段错误', () => {
    const err = toApiError({ response: { status: 400, data: { code: 400, message: '参数校验失败', data: { fieldErrors: { identityPrompt: '身份设定不能为空' } } } } })
    expect(err.fieldErrors).toEqual({ identityPrompt: '身份设定不能为空' })
  })

  it('网络错误（无响应）', () => {
    const err = toApiError({ request: {}, message: 'Network Error' })
    expect(err.code).toBe('NETWORK_ERROR')
    expect(err.status).toBe(0)
  })

  it('AbortError 是主动取消', () => {
    const ab = new Error('The user aborted a request.')
    ab.name = 'AbortError'
    const err = toApiError(ab)
    expect(err.code).toBe('ABORTED')
    expect(err.isAborted()).toBe(true)
  })

  it('纯文本响应被截断为安全文本', () => {
    const err = toApiError({ response: { status: 500, data: 'Internal Server Error <html>stack</html>' } })
    expect(err.message.length).toBeLessThanOrEqual(200)
  })

  it('HTML 错误页不泄露给用户', () => {
    const parsed = parseResponseBody('<html><body>502 Bad Gateway</body></html>')
    expect(parsed.message).not.toContain('502')
  })
})

describe('apiErrorMessage', () => {
  it('优先返回后端 message', () => {
    const err = toApiError({ response: { status: 409, data: { message: '版本冲突，请刷新' } } })
    expect(apiErrorMessage(err, '操作失败')).toBe('版本冲突，请刷新')
  })

  it('无错误信息时返回 fallback', () => {
    expect(apiErrorMessage(null, '加载失败')).toBe('加载失败')
  })
})

describe('isBusinessSuccess', () => {
  it('200/0 为成功', () => {
    expect(isBusinessSuccess(200)).toBe(true)
    expect(isBusinessSuccess(0)).toBe(true)
  })
  it('其余为失败', () => {
    expect(isBusinessSuccess(400)).toBe(false)
    expect(isBusinessSuccess(50000)).toBe(false)
  })
})
