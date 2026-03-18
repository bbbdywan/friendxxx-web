<template>
  <div id="app" :class="{ 'mobile-mode': !isPcRoute }">
    <!-- PC 端路由：直接渲染，不显示移动端组件 -->
    <template v-if="isPcRoute">
      <router-view />
    </template>

    <!-- 移动端路由 -->
    <template v-else>
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedPages">
          <component :is="Component" />
        </keep-alive>
      </router-view>

      <!-- 底部导航栏 -->
      <TabBar v-if="showTabBar" />

      <!-- WebSocket状态指示器 -->
      <WebSocketStatus />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from './components/TabBar.vue'
import WebSocketStatus from './components/WebSocketStatus.vue'

const route = useRoute()
const router = useRouter()

const PC_BREAKPOINT = 768

// 判断是否为 PC 端路由
const isPcRoute = computed(() => route.path.startsWith('/pc'))

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
  if (isPcRoute.value) return false
  if (route.path === '/ai-chat' || route.path === '/search') {
    return false
  }
  return route.meta?.showTabBar !== false
})

// 监听窗口大小变化，自动切换 PC/移动端
let resizeTimer = null
const handleResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const isPcDevice = window.innerWidth > PC_BREAKPOINT
    const onPcRoute = route.path.startsWith('/pc')

    // PC 设备但在移动端路由 -> 重新导航触发路由守卫的重定向
    // 移动设备但在 PC 路由 -> 同理
    if ((isPcDevice && !onPcRoute) || (!isPcDevice && onPcRoute)) {
      router.replace({ path: route.path, query: route.query })
    }
  }, 300)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
})
</script>

<style>
#app {
  min-height: 100vh;
  background: var(--color-background);
}
</style>




