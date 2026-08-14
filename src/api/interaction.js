import request from './request.js'

/**
 * 点赞 / 取消点赞
 */
/**
 * 获取互动消息列表（分页）
 * @param {number} userId
 * @param {number} page
 * @param {number} size
 */
export function getInformList(userId, page = 1, size = 20) {
  return request.get('/inform/list', { params: { userId, page, size } })
}

/**
 * 获取未读消息数量
 * @param {number} userId
 */
export function getUnreadCount(userId) {
  return request.get('/inform/unread', { params: { userId } })
}

/**
 * 全部标记已读
 * @param {number} userId
 */
export function readAll(userId) {
  return request.put('/inform/readAll', null, { params: { userId } })
}

/**
 * 单条标记已读
 * @param {number} id
 * @param {number} userId
 */
export function readOne(id, userId) {
  return request.put('/inform/readOne', null, { params: { id, userId } })
}
