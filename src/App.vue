<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view />

    <!-- 底部导航栏 -->
    <TabBar v-if="showTabBar" />

    <!-- WebSocket状态指示器 -->
    <WebSocketStatus />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import WebSocketStatus from './components/WebSocketStatus.vue'

const route = useRoute()

const hiddenTabBarRoutes = ['/login', '/search']

// 根据路由元信息决定是否显示底部导航栏
const showTabBar = computed(() => {
  // AI聊天页面与搜索页不显示底部导航栏（纯界面调整，不改动业务逻辑）
  if (route.path === '/ai-chat' || route.path === '/search') {
    return false
  }
  return route.meta?.showTabBar !== false
})

const isTabBarVisible = computed(() => {
  const currentPath = route.path
  console.log('当前路径:', currentPath)
  console.log('是否隐藏导航栏:', hiddenTabBarRoutes.includes(currentPath))
  return !hiddenTabBarRoutes.includes(currentPath)
})
</script>

<style>
#app {
  min-height: 100vh;
  background: var(--color-background);
}
</style>




