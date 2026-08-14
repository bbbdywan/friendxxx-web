import request from './request.js'

export const login = ({ userAccount, userpassword }) =>
  request.post('/auth/login', { userAccount, userPassword: userpassword })

export const appGuestLogin = nickname =>
  request.post('/auth/guest', { username: nickname })

export const logout = () => request.post('/auth/logout')

export const getCurrentUser = () => request.get('/auth/me')

export const getUserProfile = () => request.get('/user/profile')

export const getUserById = userId => request.get(`/user/${userId}`)

export const updateUser = user => request.post('/user/update', user)

export const getRecommendUsers = params => request.post('/user/recommend', params)

export function uploadAvatar(file, type = 'avatar') {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/user/update/image', formData, {
    params: { type },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getUserTagsList = (params = { pageNum: 1, pageSize: 10 }) =>
  request.get('/user/tagsList', { params })

export const selectAlluser = params => request.post('/user/getalluser', params)

export const deleteuser = (_adminId, userId) =>
  request.delete('/user/deleteuser', { params: { deletedid: userId } })
