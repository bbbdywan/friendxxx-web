import request from './request'

/**
 * 上传图片到服务器
 * @param {File} file - 图片文件
 * @returns {Promise} 上传响应
 */
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/stausup/update/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
