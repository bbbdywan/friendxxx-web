<template>
  <div id="app" class="mobile-mode">
      <!-- PC 访问时：手机外壳包裹 -->
      <div v-if="isDesktop" class="phone-shell-wrapper">
        <div class="phone-shell">
          <!-- 手机屏幕内容区（包含灵动岛） -->
          <div class="phone-screen">
            <!-- 灵动岛（悬浮在内容上方） -->
            <div class="dynamic-island">
              <div class="dynamic-island-camera"></div>
            </div>
            <!-- 页面内容（占满全屏） -->
            <div class="phone-content" :style="isLoginPage ? 'overflow: hidden' : ''">
              <router-view v-slot="{ Component }">
                <keep-alive :include="cachedPages">
                  <component :is="Component" />
                </keep-alive>
              </router-view>
            </div>
            <!-- 底部导航栏（固定在屏幕底部） -->
            <TabBar v-if="showTabBar" />
            <WebSocketStatus />
            <!-- 底部 Home 指示条 -->
            <div class="phone-home-indicator"></div>
          </div>
        </div>
      </div>

      <!-- 移动设备：正常渲染 -->
      <template v-else>
        <div class="mobile-page-container">
          <router-view v-slot="{ Component }">
            <keep-alive :include="cachedPages">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
        <TabBar v-if="showTabBar" />
        <WebSocketStatus />
      </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import WebSocketStatus from './components/WebSocketStatus.vue'

const route = useRoute()
const PC_BREAKPOINT = 768

// 是否为登录页（禁止手机内部滚动）
const isLoginPage = computed(() => route.path === '/login')

// 是否为桌面设备（用于显示手机外壳）
const isDesktop = ref(window.innerWidth > PC_BREAKPOINT)

// keep-alive 缓存列表
const cachedPages = ref(['DiscoverPage'])

// 监听路由变化，跳转到登录页时清空缓存（退出登录）
watch(() => route.path, (newPath) => {
  if (newPath === '/login') {
    cachedPages.value = []
    // 重置手机内容区滚动位置，防止从其他页面带入滚动偏移
    const phoneContent = document.querySelector('.phone-content')
    if (phoneContent) phoneContent.scrollTop = 0
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

// 监听窗口大小变化，更新 isDesktop
let resizeTimer = null
const handleResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    isDesktop.value = window.innerWidth > PC_BREAKPOINT
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

/* 手机端：#app 作为 flex 列，让页面内容撑满 */
#app.mobile-mode {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

html.native-app #app.mobile-mode {
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 手机端页面容器：撑满剩余空间，页面 height:100% 有效 */
.mobile-page-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
}

.mobile-page-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.mobile-page-container > * {
  min-height: 100%;
}

/* PC 访问时的背景 */
.phone-shell-wrapper {
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5e6f0 0%, #e8f4fd 50%, #f0faf0 100%);
}

/* 手机外壳 - iPhone 15 Pro 比例 */
.phone-shell {
  position: relative;
  width: 393px;
  height: 852px;
  background: #0d0d0d;
  border-radius: 50px;
  box-shadow:
    0 0 0 1px #3a3a3a,
    0 0 0 3px #111,
    0 0 0 4px #444,
    0 40px 100px rgba(0, 0, 0, 0.5),
    0 15px 40px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255,255,255,0.06);
  overflow: hidden;
}

/* 屏幕区域（全部） */
.phone-screen {
  position: absolute;
  inset: 0;
  background: var(--color-background);
  border-radius: 50px;
  overflow: hidden;
  /* 让 fixed 子元素（TabBar）相对于此容器定位 */
  transform: translateZ(0);
  will-change: transform;
}

/* 灵动岛（悬浮在屏幕内容上方） */
.dynamic-island {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 34px;
  background: #000;
  border-radius: 20px;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.06);
  pointer-events: none;
}

.dynamic-island-camera {
  width: 10px;
  height: 10px;
  background: #1a1a2e;
  border-radius: 50%;
  border: 1px solid #2a2a3e;
  box-shadow:
    inset 0 0 3px rgba(0,0,0,0.8),
    0 0 0 1px rgba(100,180,255,0.12);
}

/* 页面内容区（占满全屏） */
.phone-content {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 隐藏手机内容区的滚动条 */
.phone-content::-webkit-scrollbar {
  display: none;
}

/* 底部 Home 指示条（固定在屏幕底部） */
.phone-home-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 150;
}

.phone-home-indicator::after {
  content: '';
  width: 130px;
  height: 5px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* 手机侧边按钮 */
.phone-shell::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 130px;
  width: 3px;
  height: 32px;
  background: #333;
  border-radius: 2px 0 0 2px;
  box-shadow: 0 46px 0 #333, 0 92px 0 #333;
  z-index: 200;
}

.phone-shell::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 170px;
  width: 3px;
  height: 64px;
  background: #333;
  border-radius: 0 2px 2px 0;
  z-index: 200;
}
</style>




