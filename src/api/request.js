import axios from 'axios'

const request = axios.create({
 //   baseURL: '/api', // 确保使用相对路径
 baseURL: 'http://localhost:8080/api', // 本地调试使用localhost:8080
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    console.log('请求发送:', config.method?.toUpperCase(), config.url)
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
    console.log('响应接收:', response.config.url, response.data)
    
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
    }
    
    return Promise.reject(error)
  }
)

// 处理用户过期
const handleUserExpired = () => {
  // 清除本地存储
  localStorage.removeItem('userInfo')
  
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

