<template>
  <div class="tabbar">
    <div
      v-for="(item, index) in tabs"
      :key="index"
      class="tab-item"
      :class="{ active: activeTab === index }"
      @click="navigateTo(item.path, index)"
    >
      <div class="tab-icon">
        <van-icon :name="item.icon" size="20" />
        <div v-if="item.badge && item.badge > 0" class="tab-badge">
          {{ item.badge > 99 ? '99+' : item.badge }}
        </div>
      </div>
      <span class="tab-label">{{ item.label }}</span>
      <div v-if="activeTab === index" class="bubble-bg"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 动态计算tabs，确保数据安全
const tabs = computed(() => {
  const unreadCount = userStore.totalUnreadCount || 0
  console.log('TabBar 当前未读消息数:', unreadCount)
  
  return [
    { icon: 'home-o', label: '首页', path: '/', badge: 0 },
    { icon: 'fire-o', label: '发现', path: '/discover', badge: 0 },
    { icon: 'chat-o', label: '聊天', path: '/chat', badge: unreadCount },
    { icon: 'user-o', label: '我的', path: '/profile', badge: 0 }
  ]
})

// 安全的路由计算
const activeTab = computed(() => {
  const currentPath = route.path
  if (!currentPath) return 0
  
  const index = tabs.value.findIndex(tab => tab.path === currentPath)
  return index >= 0 ? index : 0
})

const navigateTo = (path, index) => {
  if (route.path !== path) {
    router.push(path).catch(err => {
      console.error('路由跳转失败:', err)
    })
  }
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-border);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
}

.tab-item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-icon {
  position: relative;
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--color-text-secondary);
}

.tab-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--primary-pink);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.tab-item.active .tab-icon {
  color: var(--accent-rose);
  animation: bounce-icon 0.6s ease;
}

@keyframes bounce-icon {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

.tab-label {
  font-size: 10px;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.tab-item.active .tab-label {
  color: var(--accent-rose);
  font-weight: 600;
}

.bubble-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: rgba(255, 105, 180, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: bubble-appear 0.4s ease;
  z-index: -1;
}

@keyframes bubble-appear {
  0% { 
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>


