import request from './request.js'

/** 
 * simpleChat
 * @param {string} query 
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function simpleChat(query, userId) {
  return request.get(`/helloworld/simple/chat?query=${encodeURIComponent(query)}&chat-id=${userId}`)
}

/** 
 * streamChat - 流式聊天
 * @param {string} query 
 * @param {string} userId - 用户ID
 * @param {Function} onChunk - 接收每个数据块的回调函数
 * @returns {Promise}
 */
export async function streamChat(query, userId, onChunk) {
  // 使用相对路径，nginx会代理到后端
 const url = `/api/helloworld/stream/chat?query=${encodeURIComponent(query)}&chat-id=${userId}`
  //const url = `http://localhost:8080/api/helloworld/stream/chat?query=${encodeURIComponent(query)}&chat-id=${userId}`
  try {
    console.log('开始流式请求:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        console.log('流式读取完成')
        break
      }
      
      const chunk = decoder.decode(value, { stream: true })
      console.log('收到数据块:', chunk, '长度:', chunk.length)
      
      if (chunk && onChunk) {
        onChunk(chunk)
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return { success: true }
  } catch (error) {
    console.error('流式请求失败:', error)
    throw error
  }
}

/** 
 * 获取AI聊天记录
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getAiMessageList(userId) {
  return request.get(`/helloworld/getmessagelist?conversationId=${userId}`)
}

/** 
 * 删除AI聊天记录
 * @param {string} conversationId - 对话ID（用户ID）
 * @returns {Promise}
 */
export function deleteAiMessages(conversationId) {
  return request.get(`/helloworld/deletemessage?conversationId=${conversationId}`)
}








