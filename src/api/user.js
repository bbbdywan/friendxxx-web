import request from './request.js'
import { IS_NATIVE } from '../config.js'

/**
 * 用户登录
 * @param {object} params - 登录参数
 * @param {string} params.userAccount - 用户名
 * @param {string} params.userpassword - 密码
 * @returns {Promise} 登录响应
 */
export function login(params) {
  if (IS_NATIVE) {
    return request.post('/app/auth/login', {
      userAccount: params.userAccount,
      userPassword: params.userpassword
    })
  }
  return request.post('/user/login', params)
}

/**
 * 用户注册
 * @param {object} params - 注册参数
 * @param {string} params.userAccount - 用户名
 * @param {string} params.userpassword - 密码
 * @param {string} params.checkPassword - 确认密码
 * @returns {Promise} 注册响应
 */
export function register(params) {
  return request.post('/user/register', params)
}

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    console.log('API: 获取当前用户信息')
    const response = await request.get(IS_NATIVE ? '/app/auth/me' : '/user/current')
    console.log('API: 当前用户响应:', response)
    return response
  } catch (error) {
    console.error('API: 获取当前用户失败:', error)
    throw error
  }
}

// 获取用户资料 - 新增方法对应后端的 /user/profile
export const getUserProfile = async () => {
  try {
    console.log('API: 获取用户资料')
    const response = await request.get('/user/profile')
    console.log('API: 用户资料响应:', response)
    return response
  } catch (error) {
    console.error('API: 获取用户资料失败:', error)
    throw error
  }
}

// 更新用户信息
export const updateUser = async (userData) => {
  try {
    console.log('API: 更新用户信息:', userData)
    const response = await request.post('/user/update', userData)
    console.log('API: 更新用户响应:', response)
    return response
  } catch (error) {
    console.error('API: 更新用户失败:', error)
    throw error
  }
}

/**
 * 获取用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise} 用户详情响应
 */
export function getUserById(userId) {
  return request.get(`/user/${userId}`)
}

/**
 * 搜索用户
 * @param {object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 搜索结果响应
 */
export function searchUsers(params) {
  return request.get('/user/search', { params })
}

/**
 * 获取推荐用户列表（基于用户画像的多维度推荐）
 * @param {object} params - 推荐参数
 * @param {number} params.userId - 当前用户ID（必填）
 * @param {number} params.limit - 返回数量，默认10
 * @param {number} params.gender - 性别筛选 0-男 1-女（可选）
 * @param {number} params.ageMin - 年龄下限（可选）
 * @param {number} params.ageMax - 年龄上限（可选）
 * @param {string} params.hometown - 家乡筛选（可选）
 * @returns {Promise} 推荐用户响应，data 为 RecommendUserVO[]，含 matchScore
 */
export function getRecommendUsers(params) {
  return request.post('/user/recommend', params)
}

/**
 * 获取附近用户
 * @param {object} params - 位置参数
 * @param {number} params.latitude - 纬度
 * @param {number} params.longitude - 经度
 * @param {number} params.radius - 搜索半径(km)
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 附近用户响应
 */
export function getNearbyUsers(params) {
  return request.get('/user/nearby', { params })
}

/**
 * 更新用户位置
 * @param {object} params - 位置参数
 * @param {number} params.latitude - 纬度
 * @param {number} params.longitude - 经度
 * @param {string} params.address - 地址描述
 * @returns {Promise} 更新响应
 */
export function updateLocation(params) {
  return request.post('/user/location', params)
}

/**
 * 上传头像
 * @param {File} file - 头像文件
 * @param {string} type - 图片类型 (avatar/background)
 * @returns {Promise} 上传响应
 */
export function uploadAvatar(file, type = 'avatar') {
  const formData = new FormData()
  formData.append('file', file)

  return request.post(`/user/update/image?type=${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传背景图
 * @param {File} file - 背景图文件
 * @returns {Promise} 上传响应
 */
export function uploadBackground(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/user/update/image?type=background', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取用户访客记录
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 访客记录响应
 */
export function getVisitors(params) {
  return request.get('/user/visitors', { params })
}

/**
 * 获取用户点赞记录
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 点赞记录响应
 */
export function getLikes(params) {
  return request.get('/user/likes', { params })
}

/**
 * 注销登录
 * @returns {Promise} 注销响应
 */
export function logout() {
  return request.post(IS_NATIVE ? '/app/auth/logout' : '/user/logout')
}

/**
 * 获取用户标签列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 标签列表响应
 */
export function getUserTagsList(params = { pageNum: 1, pageSize: 10 }) {
  return request.get('/user/tagsList', { params })
}

/**
 * 删除账户
 * @param {object} params - 删除参数
 * @param {string} params.password - 确认密码
 * @returns {Promise} 删除响应
 */
export function deleteAccount(params) {
  return request.delete('/user/delete', { data: params })
}

/**
 * HR登录
 * @param {object} params HrLoginDTO
 * @param {string} params.username 用户名
 * @param {string} params.userPassword 密码
 * @param {string} params.userAccount 账号
 * @param {string} params.avatarUrl 头像
 * @param {string} params.tags 标签
 * @returns
 */
export function hrlogin(params) {
  return request.post('/user/hrlogin', params)
}

/**
 * 获取所有用户（管理员分页查询）
 * @param {object} params - 分页参数（PageDTO）
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.username - 用户昵称搜索（可选）
 * @param {string} params.createTimeBegin - 创建时间开始（可选，格式：YYYY-MM-DD HH:mm:ss，后端接收LocalDateTime类型）
 * @param {string} params.createTimeEnd - 创建时间结束（可选，格式：YYYY-MM-DD HH:mm:ss，后端接收LocalDateTime类型）
 * @returns {Promise} 用户列表响应 { code: 200, message: "操作成功", data: PageInfo<User> }
 * 
 * @example
 * selectAlluser({
 *   pageNum: 1,
 *   pageSize: 10,
 *   username: "白白白",
 *   createTimeBegin: "2024-01-01 00:00:00",
 *   createTimeEnd: "2024-12-31 23:59:59"
 * })
 */
export function selectAlluser(params) {
  // 后端接口：POST /user/getalluser
  // 参数通过 request body 传递（PageDTO）
  return request.post('/user/getalluser', params)
}

/**
 * 删除用户（管理员操作）
 * @param {number} adminId - 管理员ID
 * @param {number} userId - 被删除的用户ID
 * @returns {Promise} 删除响应
 */
export function deleteuser(adminId, userId) {
  // 后端接口：DELETE /user/{userId}?adminId={adminId}
  return request.delete(`/user/${userId}`, { params: { adminId } })
}

