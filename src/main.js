import './assets/main.css'
import 'vant/lib/index.css'
import './styles/vant-theme.css'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 应用启动后初始化用户状态
app.mount('#app')

// 初始化用户store并检查登录状态
const userStore = useUserStore()
userStore.initUserInfo()

// 如果有用户信息，检查登录状态并连接WebSocket
if (userStore.userInfo) {
  userStore.checkLoginStatus().then(() => {
    console.log('用户登录状态检查完成')
  }).catch(error => {
    console.error('用户登录状态检查失败:', error)
  })
}

