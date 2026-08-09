import axios from 'axios'
import { API_BASE } from '../config.js'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 检查用户过期情况
    if (response.data.code === 50000 && response.data.message === '系统内部错误') {
      // 用户已过期，清除本地数据并跳转登录
      handleUserExpired()
    }
    
    return response.data
  },
  (error) => {
    console.error('响应错误:', error.message)
    
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo')
      localStorage.removeItem('accessToken')
    }
    
    return Promise.reject(error)
  }
)

// 处理用户过期
const handleUserExpired = () => {
  // 清除本地存储
  localStorage.removeItem('userInfo')
  localStorage.removeItem('accessToken')
  
  // 显示过期提示
  import('vant').then(({ showDialog }) => {
    showDialog({
      title: '用户已过期',
      message: '体验账户已过期，请重新登录',
      confirmButtonText: '重新登录',
      showCancelButton: false,
      closeOnClickOverlay: false
    }).then(() => {
      // 跳转到登录页
      window.location.href = '/login'
    })
  })
}

export default request

