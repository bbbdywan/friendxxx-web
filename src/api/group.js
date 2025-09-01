import request from './request.js'

/**
 * 创建群聊
 * @param {object} params - 群聊参数
 * @param {string} params.group_name - 群名称
 * @param {string} params.introduction - 群简介
 * @param {string} params.avatar_url - 群头像
 * @param {number} params.creator_id - 创建者ID
 * @returns {Promise} 创建群聊响应
 */
export function createGroup(params) {
  return request.post('/group/create', params)
}

/**
 * 展示群聊列表
 * @returns {Promise} 群聊列表响应
 */
export function getGroupList() {
  return request.get('/group/grouplist')
}

/**
 * 加入群聊
 * @param {object} params - 加入参数
 * @param {number} params.groupId - 群聊ID
 * @param {number} params.userId - 用户ID
 * @returns {Promise} 加入群聊响应
 */
export function joinGroup(params) {
  return request.post('/group/join', params)
}
