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

/**
 * 修改当前用户动态
 * @param {object} params UpSociaPost
 * @param {number} params.id 
 * @param {string} params.content 
 * @returns
 */
export function updatesocia(params) {
  return request.post(`/stausup/upcurrentstatus`, params)
}

/**
 * 点赞/取消点赞
 * @param {number} postid
 * @param {number} userId
 * @param {number} likesId - 1点赞 0取消
 */
export function likesPost(postid, userId, likesId) {
  return request.post('/stausup/likes', { postid, userId, likesId })
}

/**
 * 发表评论
 * @param {number} postId
 * @param {number} userId
 * @param {string} nickname
 * @param {string} content
 * @param {string} avatarUrl
 */
export function commentPost(postId, userId, nickname, content, avatarUrl) {
  return request.post('/stausup/comment', { postId, userId, nickname, content, avatarUrl })
}

/**
 * 获取评论列表
 * @param {number} postId
 */
export function getComments(postId) {
  return request.get(`/stausup/comments/${postId}`)
}

/**
 * 获取单个动态详情
 * @param {number} id - 动态ID
 * @returns {Promise} 动态详情响应
 */
export function getonlyup(id) {
  return request.get(`/stausup/getcurrentup?id=${id}`)
}

