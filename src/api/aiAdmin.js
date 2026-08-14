import request from './request.js'
import { streamSse, aiUrl } from './sse.js'

/**
 * AI 人设管理 API（管理员专用 /admin/ai/characters）。
 */

/** 管理列表 */
export function adminListCharacters() {
  return request.get('/admin/ai/characters')
}

/** 新建角色（返回角色主记录） */
export function adminCreateCharacter(data) {
  return request.post('/admin/ai/characters', data)
}

/** 角色详情：线上版本 + 草稿 + 版本历史 */
export function adminCharacterDetail(id) {
  return request.get(`/admin/ai/characters/${id}`)
}

/** 保存草稿（乐观锁，expectedVersionNo） */
export function adminSaveDraft(id, data) {
  return request.put(`/admin/ai/characters/${id}/draft`, data)
}

/** 版本历史 */
export function adminListVersions(id) {
  return request.get(`/admin/ai/characters/${id}/versions`)
}

/** 发布草稿 */
export function adminPublish(id, data) {
  return request.post(`/admin/ai/characters/${id}/publish`, data)
}

/** 回滚到历史版本 */
export function adminRollback(id, versionId, changeNote) {
  return request.post(`/admin/ai/characters/${id}/rollback`, { versionId, changeNote })
}

/** 启用/停用 */
export function adminSetEnabled(id, enabled) {
  return request.patch(`/admin/ai/characters/${id}/enabled`, { enabled })
}

/**
 * 草稿隔离预览（SSE，不落库）。
 */
export function adminPreviewSse({ id, content, recentMessages = [], token, signal,
  onDelta, onDone, onError, onStart, onUsage,
  onMessageStart, onMessageDelta, onMessageEnd }) {
  return streamSse({
    url: aiUrl(`/admin/ai/characters/${id}/preview`),
    body: { content, recentMessages },
    token,
    signal,
    onStart, onDelta, onUsage, onDone, onError,
    onMessageStart, onMessageDelta, onMessageEnd
  })
}
