import request from './request.js'

export const getChatMessages = (userId, peerId) =>
  request.get('/websocket/getmessage', { params: { UserId1: userId, UserId2: peerId } })

export const getMessageList = userId =>
  request.get('/websocket/messagelist', { params: { UserId: userId } })

export const clearUnread = (userId, chatUserId) =>
  request.put('/websocket/clearUnread', null, { params: { userId, chatUserId } })

export const deleteChatMessage = conversationId =>
  request.get('/websocket/deletemessage', { params: { conversationId } })
