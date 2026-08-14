import { API_BASE } from '../config.js'
import { parseSseBuffer, extractSseData, parseSseEvent } from './sseParser.js'
import { toApiError, ApiError } from '../utils/apiError.js'
import { handleAuthExpired } from '../utils/authExpired.js'

export { parseSseBuffer, extractSseData, parseSseEvent }

/**
 * 发送 AI 消息并解析 SSE 流（fetch + ReadableStream）。
 * 错误统一为 ApiError（结构化 status/code/message/fieldErrors/traceId）。
 *
 * 事件回调：onStart / onDelta / onUsage / onDone / onError /
 *           onMessageStart / onMessageDelta / onMessageEnd（多气泡协议）
 *
 * @param {object} params
 * @param {string} params.url       完整请求 URL（含 API_BASE）
 * @param {object} params.body      JSON body
 * @param {string} params.token     Bearer token
 * @param {AbortSignal} [params.signal]
 * @param {Function} [params.onStart]
 * @param {Function} [params.onDelta]
 * @param {Function} [params.onUsage]
 * @param {Function} [params.onDone]
 * @param {Function} [params.onError]
 * @param {Function} [params.onMessageStart]
 * @param {Function} [params.onMessageDelta]
 * @param {Function} [params.onMessageEnd]
 * @returns {Promise<{messageId?:string, fullContent:string, aborted:boolean}>}
 */
export async function streamSse({
  url, body, token, signal,
  onStart, onDelta, onUsage, onDone, onError,
  onMessageStart, onMessageDelta, onMessageEnd
}) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body),
      signal
    })
  } catch (e) {
    // 主动取消
    if (e.name === 'AbortError') {
      throw new ApiError({ status: 0, code: 'ABORTED', message: '已停止', cause: e })
    }
    throw toApiError(e)
  }

  if (!response.ok) {
    const apiError = toApiError({ response, status: response.status })
    handleAuthIfNeeded(apiError)
    throw apiError
  }

  if (!response.body) {
    throw new ApiError({ status: 0, code: 'SSE_NO_STREAM', message: '浏览器不支持 ReadableStream' })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullContent = ''
  let messageId = null
  let aborted = false
  let gotDoneOrError = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 跨 chunk 的 UTF-8 半字符由 TextDecoder(stream:true) 处理
      const text = decoder.decode(value, { stream: true })
      const { frames, buffer: rest } = parseSseBuffer(buffer, text)
      buffer = rest

      for (const frame of frames) {
        const data = extractSseData(frame)
        if (data == null || data === '[DONE]') continue
        const payload = parseSseEvent(data)
        if (!payload) continue
        const type = payload.type || payload.event
        if (type === 'error') gotDoneOrError = true
        if (type === 'done') gotDoneOrError = true
        handleSseEvent(payload, {
          onStart, onDelta, onUsage, onDone, onError,
          onMessageStart, onMessageDelta, onMessageEnd,
          setMessageId: (id) => { messageId = id },
          appendContent: (c) => { fullContent += c }
        })
      }
    }

    // 处理流末尾遗留的未闭合帧
    if (buffer.trim()) {
      const data = extractSseData(buffer)
      if (data && data !== '[DONE]') {
        const payload = parseSseEvent(data)
        if (payload) {
          const type = payload.type || payload.event
          if (type === 'error' || type === 'done') gotDoneOrError = true
          handleSseEvent(payload, {
            onStart, onDelta, onUsage, onDone, onError,
            onMessageStart, onMessageDelta, onMessageEnd,
            setMessageId: (id) => { messageId = id },
            appendContent: (c) => { fullContent += c }
          })
        }
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      aborted = true
    } else {
      throw toApiError(e)
    }
  }

  // 流在没有 done/error 的情况下正常 EOF → 中断
  if (!aborted && !gotDoneOrError && !fullContent) {
    throw new ApiError({ status: 0, code: 'SSE_STREAM_INTERRUPTED', message: '连接中断，请重试', cause: null })
  }

  return { messageId, fullContent, aborted }
}

function handleAuthIfNeeded(apiError) {
  if (apiError.isAuthError()) {
    handleAuthExpired()
  }
}

function handleSseEvent(payload, { onStart, onDelta, onUsage, onDone, onError, onMessageStart, onMessageDelta, onMessageEnd, setMessageId, appendContent }) {
  const type = payload.type || payload.event
  const data = payload.data ?? payload
  switch (type) {
    case 'start':
      setMessageId(data?.messageId)
      onStart?.(data || {})
      break
    case 'delta':
      appendContent(data?.content ?? '')
      onDelta?.(data?.content ?? '')
      break
    case 'message_start':
      onMessageStart?.(data || {})
      break
    case 'message_delta':
      appendContent(data?.content ?? '')
      onMessageDelta?.(data || {})
      break
    case 'message_end':
      onMessageEnd?.(data || {})
      break
    case 'usage':
      onUsage?.(data || {})
      break
    case 'done':
      setMessageId(data?.messageId || null)
      onDone?.(data || {})
      break
    case 'error':
      // 业务 error 事件 → 结构化 ApiError
      const apiErr = new ApiError({
        status: 200,
        code: data?.code || 'AI_UPSTREAM_ERROR',
        message: data?.message || '生成失败',
        traceId: data?.traceId || null
      })
      onError?.(apiErr)
      break
    default:
      break
  }
}

/**
 * 生成 AI 请求 URL。
 */
export function aiUrl(path) {
  return `${API_BASE}${path}`
}
