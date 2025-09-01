<template>
  <div class="test-page">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明Vue应用正常运行</p>
    
    <div class="info-section">
      <h3>当前状态</h3>
      <p><strong>当前路由:</strong> {{ $route.path }}</p>
      <p><strong>Token:</strong> {{ token || '无' }}</p>
      <p><strong>用户信息:</strong> {{ userInfo ? '已加载' : '未加载' }}</p>
      <p><strong>登录状态:</strong> {{ isLoggedIn ? '已登录' : '未登录' }}</p>
    </div>
    
    <div class="actions">
      <van-button type="primary" @click="goToLogin">去登录</van-button>
      <van-button @click="goToHome">去首页</van-button>
      <van-button @click="goToProfile">去个人资料</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()

const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const goToLogin = () => {
  router.push('/login')
}

const goToHome = () => {
  router.push('/')
}

const goToProfile = () => {
  router.push('/profile')
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.test-page h1 {
  color: var(--primary-pink);
  text-align: center;
  margin-bottom: 20px;
}

.info-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-section h3 {
  color: var(--color-text);
  margin-bottom: 15px;
}

.info-section p {
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actions .van-button {
  flex: 1;
  min-width: 120px;
}
</style>
