import request from './request.js'
import { streamSse, aiUrl } from './sse.js'

/**
 * 统一 AI 聊天 API 层（新接口 /ai/*）。
 * 替换旧的 /helloworld/* 调用。
 */

/** 获取可用角色列表 */
export function listCharacters() {
  return request.get('/ai/characters')
}

/** 创建会话 */
export function createConversation(characterId) {
  return request.post('/ai/conversations', { characterId })
}

/** 会话列表 */
export function listConversations(page = 1, size = 20) {
  return request.get(`/ai/conversations?page=${page}&size=${size}`)
}

/** 会话详情（含角色名称/头像） */
export function getConversation(conversationId) {
  return request.get(`/ai/conversations/${conversationId}`)
}

/** 游标分页查询历史消息（服务端返回 {items,nextCursor,hasMore}） */
export function listMessages(conversationId, cursor = '', limit = 30) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=${limit}` : `?limit=${limit}`
  return request.get(`/ai/conversations/${conversationId}/messages${q}`)
}

/**
 * SSE 流式发送消息。
 * @param {object} params
 * @param {string} params.conversationId
 * @param {string} params.content
 * @param {string} params.clientMessageId
 * @param {string} params.token
 * @param {AbortSignal} [params.signal]
 * @param {Function} [params.onStart]
 * @param {Function} [params.onDelta]
 * @param {Function} [params.onUsage]
 * @param {Function} [params.onDone]
 * @param {Function} [params.onError]
 * @param {Function} [params.onMessageStart]
 * @param {Function} [params.onMessageDelta]
 * @param {Function} [params.onMessageEnd]
 */
export function sendMessageSse(params) {
  const { conversationId, content, clientMessageId, token, signal,
    onStart, onDelta, onUsage, onDone, onError,
    onMessageStart, onMessageDelta, onMessageEnd } = params
  return streamSse({
    url: aiUrl(`/ai/conversations/${conversationId}/messages`),
    body: { content, clientMessageId },
    token,
    signal,
    onStart, onDelta, onUsage, onDone, onError,
    onMessageStart, onMessageDelta, onMessageEnd
  })
}

/** 查看某角色记忆 */
export function listMemories(characterId) {
  return request.get(`/ai/characters/${characterId}/memories`)
}

/** 删除单条记忆 */
export function deleteMemory(memoryId) {
  return request.delete(`/ai/memories/${memoryId}`)
}

/** 更正记忆 */
export function updateMemory(memoryId, content) {
  return request.patch(`/ai/memories/${memoryId}`, { content })
}
