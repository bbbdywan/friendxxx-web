import request from './request'

/**
 * 发布新动态
 * @param {Object} postData - 动态数据
 * @returns {Promise} 发布响应
 */
export function publishPost(postData) {
  return request.post('/stausup/newpost', postData)
}

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 动态列表响应
 */
export function getPostList(params) {
  return request.get('/stausup/list', { params })
}

/**
 * 获取最新动态
 * @returns {Promise} 动态列表响应
 */
export function getstup() {
  return request.get('/stausup/getstup')
}

/**
 * 获取当前用户动态
 * @param {number} userId 
 * @returns
 */
export function getuserup(userId) {
  return request.get(`/stausup/getuserup?userId=${userId}`)
}

/**
 * 删除动态
 * @param {number} id 
 * @returns
 */
export function deleteMoment(id) {
  return request.delete(`/stausup/delete?id=${id}`)
}

