// 获取消息列表
const fetchMessages = async () => {
  try {
    loading.value = true
    console.log('开始获取消息列表...')
    
    // 这里需要根据实际的消息列表API来调用
    // const response = await getMessageList()
    // console.log('消息列表API响应:', response)
    
    // 修复响应数据解析
    // const apiResponse = response.data
    // if (apiResponse.code === 200 || apiResponse.code === 0) {
    //   const messageData = apiResponse.data
    //   messages.value = messageData.map(message => ({
    //     id: message.id,
    //     type: message.type,
    //     title: message.title,
    //     content: message.content,
    //     time: new Date(message.createTime),
    //     read: message.read || false,
    //     sender: message.sender
    //   }))
    // } else {
    //   throw new Error(apiResponse.message || '获取消息列表失败')
    // }
    
    // 暂时使用模拟数据
    console.log('使用模拟消息数据')
    
  } catch (error) {
    console.error('获取消息列表失败:', error)
    showToast('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

// 标记消息为已读
const markAsRead = async (messageId) => {
  try {
    // const response = await markMessageRead(messageId)
    // console.log('标记已读API响应:', response)
    
    // 修复响应数据解析
    // const apiResponse = response.data
    // if (apiResponse.code === 200 || apiResponse.code === 0) {
    //   // 更新本地状态
    //   const message = messages.value.find(m => m.id === messageId)
    //   if (message) {
    //     message.read = true
    //   }
    // } else {
    //   throw new Error(apiResponse.message || '标记已读失败')
    // }
    
    // 暂时只更新本地状态
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.read = true
    }
    
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}