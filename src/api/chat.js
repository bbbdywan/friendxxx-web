import request from './request.js'

/**
 * 获取用户聊天记录
 * @param {number} UserId1 - 用户1的ID
 * @param {number} UserId2 - 用户2的ID
 * @returns {Promise} 聊天记录响应
 */
export function getChatMessages(UserId1, UserId2) {
  return request.get(`/websocket/getmessage?UserId1=${UserId1}&UserId2=${UserId2}`)
}

/**
 * 获取在线用户列表
 * @returns {Promise} 在线用户列表响应
 */
export function getOnlineUsers() {
  return request.get('/websocket/online-users')
}

/**
 * 服务端主动发送消息（测试用）
 * @param {string} toUserId - 接收者用户ID
 * @param {string} message - 消息内容
 * @returns {Promise} 发送结果响应
 */
export function sendServerMessage(toUserId, message) {
  return request.post('/websocket/send-message', null, {
    params: {
      toUserId,
      message
    }
  })
}

/**
 * 获取聊天列表
 * @param {object} params - 分页参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 聊天列表响应
 */
export function getChatList(params) {
  return request.get('/chat/list', { params })
}

/**
 * 获取聊天记录
 * @param {object} params - 查询参数
 * @param {number} params.chatId - 聊天ID
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 聊天记录响应
 */
export function getChatHistory(params) {
  return request.get('/chat/history', { params })
}

/**
 * 发送消息
 * @param {object} params - 消息参数
 * @param {number} params.receiverId - 接收者ID
 * @param {string} params.content - 消息内容
 * @param {number} params.messageType - 消息类型 (0-文本 1-图片 2-语音 3-视频)
 * @returns {Promise} 发送响应
 */
export function sendMessage(params) {
  return request.post('/chat/send', params)
}

/**
 * 标记消息为已读
 * @param {object} params - 已读参数
 * @param {number} params.chatId - 聊天ID
 * @param {number} params.messageId - 消息ID (可选，不传则标记整个聊天为已读)
 * @returns {Promise} 已读响应
 */
export function markAsRead(params) {
  return request.post('/chat/read', params)
}

/**
 * 删除消息
 * @param {object} params - 删除参数
 * @param {number} params.messageId - 消息ID
 * @returns {Promise} 删除响应
 */
export function deleteMessage(params) {
  return request.delete('/chat/message', { data: params })
}

/**
 * 撤回消息
 * @param {object} params - 撤回参数
 * @param {number} params.messageId - 消息ID
 * @returns {Promise} 撤回响应
 */
export function recallMessage(params) {
  return request.post('/chat/recall', params)
}

/**
 * 清空聊天记录
 * @param {object} params - 清空参数
 * @param {number} params.chatId - 聊天ID
 * @returns {Promise} 清空响应
 */
export function clearChatHistory(params) {
  return request.post('/chat/clear', params)
}

/**
 * 删除聊天
 * @param {object} params - 删除参数
 * @param {number} params.chatId - 聊天ID
 * @returns {Promise} 删除响应
 */
export function deleteChat(params) {
  return request.delete('/chat/delete', { data: params })
}

/**
 * 上传聊天图片
 * @param {File} file - 图片文件
 * @returns {Promise} 上传响应
 */
export function uploadChatImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/chat/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传语音消息
 * @param {File} file - 语音文件
 * @returns {Promise} 上传响应
 */
export function uploadVoiceMessage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/chat/upload/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传视频消息
 * @param {File} file - 视频文件
 * @returns {Promise} 上传响应
 */
export function uploadVideoMessage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/chat/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取未读消息数量
 * @returns {Promise} 未读数量响应
 */
export function getUnreadCount() {
  return request.get('/chat/unread-count')
}

/**
 * 搜索聊天记录
 * @param {object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.chatId - 聊天ID (可选)
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} 搜索结果响应
 */
export function searchMessages(params) {
  return request.get('/chat/search', { params })
}

/**
 * 获取用户最近聊天记录对象
 * @param {number} UserId - 用户ID
 * @returns {Promise} 最近消息列表响应
 */
export function getMessageList(UserId) {
  return request.get(`/websocket/messagelist?UserId=${UserId}`)
}

/**
 * 清零某会话未读数
 * @param {number} userId - 当前用户ID
 * @param {number} chatUserId - 对方用户ID
 */
export function clearUnread(userId, chatUserId) {
  return request.put(`/websocket/clearUnread`, null, { params: { userId, chatUserId } })
}

/**
 * 删除聊天消息
 * @param {string} chatKey - 聊天标识，格式：private_{minId}_{maxId}
 * @returns {Promise} 删除响应
 */
export function deleteChatMessage(chatKey) {
  return request.get(`/websocket/deletemessage?conversationId=${chatKey}`)
}



