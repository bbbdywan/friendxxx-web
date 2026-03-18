<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedPages">
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 底部导航栏 -->
    <TabBar v-if="showTabBar" />

    <!-- WebSocket状态指示器 -->
    <WebSocketStatus />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import WebSocketStatus from './components/WebSocketStatus.vue'

const route = useRoute()

// keep-alive 缓存列表
const cachedPages = ref(['DiscoverPage'])

// 监听路由变化，跳转到登录页时清空缓存（退出登录）
watch(() => route.path, (newPath) => {
  if (newPath === '/login') {
    cachedPages.value = []
  } else if (!cachedPages.value.includes('DiscoverPage')) {
    cachedPages.value = ['DiscoverPage']
  }
})

// 根据路由元信息决定是否显示底部导航栏
const showTabBar = computed(() => {
  if (route.path === '/ai-chat' || route.path === '/search') {
    return false
  }
  return route.meta?.showTabBar !== false
})
</script>

<style>
#app {
  min-height: 100vh;
  background: var(--color-background);
}
</style>




