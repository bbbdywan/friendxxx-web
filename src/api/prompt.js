import request from './request.js'

// 保存/更新提示词
export const savePrompt = (data) => {
  return request.post('/prompt/save', data)
}

// 获取提示词列表
export const getPromptList = () => {
  return request.get('/prompt/list')
}

// 获取当前激活的提示词
export const getActivePrompt = () => {
  return request.get('/prompt/active')
}

// 设置提示词为当前使用
export const setActivePrompt = (id) => {
  return request.post(`/prompt/setActive/${id}`)
}

// 删除提示词
export const deletePrompt = (id) => {
  return request.delete(`/prompt/delete/${id}`)
}
