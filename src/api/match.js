import request from './request.js'

/**
 * 执行匹配操作
 * @param {object} params - 匹配参数
 * @param {number} params.targetUserId - 目标用户ID
 * @param {number} params.action - 操作类型 (0-拒绝 1-喜欢 2-超级喜欢)
 * @returns {Promise} 匹配响应
 */
export function performMatch(params) {
  return request.post('/match/action', params)
}

/**
 * 获取匹配列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 匹配列表响应
 */
export function getMatches(params) {
  return request.get('/match/list', { params })
}

/**
 * 获取互相喜欢的用户列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 互相喜欢列表响应
 */
export function getMutualLikes(params) {
  return request.get('/match/mutual', { params })
}

/**
 * 获取我喜欢的用户列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 我喜欢的列表响应
 */
export function getMyLikes(params) {
  return request.get('/match/my-likes', { params })
}

/**
 * 获取喜欢我的用户列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 喜欢我的列表响应
 */
export function getLikesMe(params) {
  return request.get('/match/likes-me', { params })
}

/**
 * 取消匹配
 * @param {object} params - 取消参数
 * @param {number} params.targetUserId - 目标用户ID
 * @returns {Promise} 取消响应
 */
export function cancelMatch(params) {
  return request.post('/match/cancel', params)
}

/**
 * 举报用户
 * @param {object} params - 举报参数
 * @param {number} params.targetUserId - 目标用户ID
 * @param {string} params.reason - 举报原因
 * @param {string} params.description - 详细描述
 * @returns {Promise} 举报响应
 */
export function reportUser(params) {
  return request.post('/match/report', params)
}

/**
 * 拉黑用户
 * @param {object} params - 拉黑参数
 * @param {number} params.targetUserId - 目标用户ID
 * @returns {Promise} 拉黑响应
 */
export function blockUser(params) {
  return request.post('/match/block', params)
}

/**
 * 获取黑名单列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 黑名单响应
 */
export function getBlockList(params) {
  return request.get('/match/block-list', { params })
}

/**
 * 取消拉黑
 * @param {object} params - 取消拉黑参数
 * @param {number} params.targetUserId - 目标用户ID
 * @returns {Promise} 取消拉黑响应
 */
export function unblockUser(params) {
  return request.post('/match/unblock', params)
}
