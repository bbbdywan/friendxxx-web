/**
 * 通用AI聊天API工具函数
 * 支持多种后端接口和流式输出
 */

/**
 * 创建流式聊天API配置
 * @param {Object} config - API配置
 * @param {string} config.baseUrl - API基础URL
 * @param {string} config.streamEndpoint - 流式聊天端点
 * @param {string} config.simpleEndpoint - 简单聊天端点（可选，用于预热）
 * @param {string} config.historyEndpoint - 历史记录端点（可选）
 * @param {string} config.clearEndpoint - 清空记录端点（可选）
 * @param {Object} config.headers - 请求头（可选）
 * @param {Function} config.transformRequest - 请求参数转换函数（可选）
 * @param {Function} config.transformResponse - 响应数据转换函数（可选）
 * @returns {Object} API配置对象
 */
export function createAiChatApi(config) {
  const {
    baseUrl = '',
    streamEndpoint,
    simpleEndpoint,
    historyEndpoint,
    clearEndpoint,
    headers = {},
    transformRequest,
    transformResponse,
    credentials = 'include'
  } = config

  // 默认请求头
  const defaultHeaders = {
    'Accept': 'text/plain',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    ...headers
  }

  /**
   * 流式聊天
   * @param {string} query - 用户输入
   * @param {string|number} userId - 用户ID
   * @param {Function} onChunk - 接收数据块的回调函数
   * @param {number} chatId - 聊天ID（可选）
   * @returns {Promise}
   */
  async function streamChat(query, userId, onChunk, chatId = userId) {
    if (!streamEndpoint) {
      throw new Error('streamEndpoint is required')
    }

    // 构建请求参数
    let requestParams = { query, userId, chatId }
    if (transformRequest) {
      requestParams = transformRequest(requestParams)
    }

    // 构建URL
    const url = buildUrl(baseUrl + streamEndpoint, requestParams)
    
    try {
      console.log('开始流式请求:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        credentials,
        headers: defaultHeaders
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
        
        let chunk = decoder.decode(value, { stream: true })
        
        // 如果有响应转换函数，使用它处理数据块
        if (transformResponse) {
          chunk = transformResponse(chunk)
        }
        
        console.log('收到数据块:', chunk, '长度:', chunk.length)

        if (chunk && onChunk) {
          onChunk(chunk)
        }

        // 保持与原版本一致的延迟
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      return { success: true }
    } catch (error) {
      console.error('流式请求失败:', error)
      throw error
    }
  }

  /**
   * 简单聊天（用于预热）
   * @param {string|number} userId - 用户ID
   * @param {string} query - 查询内容（可选）
   * @returns {Promise}
   */
  async function preheat(userId, query = '你好') {
    if (!simpleEndpoint) {
      console.warn('simpleEndpoint not configured, skipping preheat')
      return
    }

    let requestParams = { query, userId }
    if (transformRequest) {
      requestParams = transformRequest(requestParams)
    }

    const url = buildUrl(baseUrl + simpleEndpoint, requestParams)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials,
        headers: defaultHeaders
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('预热请求失败:', error)
      throw error
    }
  }

  /**
   * 获取聊天历史
   * @param {string|number} userId - 用户ID
   * @returns {Promise<Array>}
   */
  async function getHistory(userId) {
    if (!historyEndpoint) {
      console.warn('historyEndpoint not configured')
      return []
    }

    let requestParams = { userId }
    if (transformRequest) {
      requestParams = transformRequest(requestParams)
    }

    const url = buildUrl(baseUrl + historyEndpoint, requestParams)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials,
        headers: defaultHeaders
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 转换历史记录格式
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.type === 'USER',
          timestamp: new Date(msg.timestamp)
        }))
      }
      
      return []
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  /**
   * 清空聊天记录
   * @param {string|number} userId - 用户ID
   * @returns {Promise}
   */
  async function clearMessages(userId) {
    if (!clearEndpoint) {
      console.warn('clearEndpoint not configured')
      return
    }

    let requestParams = { userId }
    if (transformRequest) {
      requestParams = transformRequest(requestParams)
    }

    const url = buildUrl(baseUrl + clearEndpoint, requestParams)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials,
        headers: defaultHeaders
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.code !== 200) {
        throw new Error(data.message || '清空失败')
      }
      
      return data
    } catch (error) {
      console.error('清空聊天记录失败:', error)
      throw error
    }
  }

  return {
    streamChat,
    preheat,
    getHistory,
    clearMessages
  }
}

/**
 * 构建URL和查询参数
 * @param {string} baseUrl - 基础URL
 * @param {Object} params - 参数对象
 * @returns {string} 完整URL
 */
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl, window.location.origin)
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key])
    }
  })
  
  return url.toString()
}

/**
 * 预设配置示例
 */
export const presetConfigs = {
  // 基于当前项目的配置
  currentProject: {
    baseUrl: 'http://localhost:8080/api',
    streamEndpoint: '/helloworld/stream/chat',
    // 注意：后端只有流式接口，所以预热、历史记录、清空功能暂时不可用
    // simpleEndpoint: '/helloworld/simple/chat',  // 后端没有此接口
    // historyEndpoint: '/helloworld/getmessagelist',  // 后端没有此接口
    // clearEndpoint: '/helloworld/deletemessage',  // 后端没有此接口
    transformRequest: (params) => ({
      query: encodeURIComponent(params.query),
      'chat-id': params.userId
    })
  },
  
  // OpenAI风格的配置
  openaiStyle: {
    baseUrl: '/api/v1',
    streamEndpoint: '/chat/completions',
    transformRequest: (params) => ({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: params.query }],
      stream: true,
      user: params.userId
    }),
    transformResponse: (chunk) => {
      // 处理SSE格式的数据
      if (chunk.startsWith('data: ')) {
        const data = chunk.slice(6)
        if (data === '[DONE]') return ''
        try {
          const parsed = JSON.parse(data)
          return parsed.choices?.[0]?.delta?.content || ''
        } catch (e) {
          return ''
        }
      }
      return chunk
    }
  },
  
  // 自定义REST API配置
  customRest: {
    baseUrl: '/api',
    streamEndpoint: '/ai/stream',
    simpleEndpoint: '/ai/chat',
    historyEndpoint: '/ai/history',
    clearEndpoint: '/ai/clear',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
}

/**
 * 创建基于当前项目的API配置
 * @returns {Object} API配置
 */
export function createCurrentProjectApi() {
  return createAiChatApi(presetConfigs.currentProject)
}

/**
 * 创建与原版完全一致的流式API
 * 直接复制原有的工作实现
 */
export function createOriginalStreamApi() {
  return {
    async streamChat(query, userId, onChunk) {
      const url = `http://localhost:8080/api/helloworld/stream/chat?query=${encodeURIComponent(query)}&chat-id=${userId}`

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
    },

    // 预热功能（空实现，因为后端没有对应接口）
    async preheat() {
      console.log('后端没有预热接口，跳过预热')
      return Promise.resolve()
    },

    // 获取历史记录（空实现，因为后端没有对应接口）
    async getHistory() {
      console.log('后端没有历史记录接口，返回空数组')
      return []
    },

    // 清空消息（空实现，因为后端没有对应接口）
    async clearMessages() {
      console.log('后端没有清空接口，只清空前端显示')
      return Promise.resolve()
    }
  }
}
