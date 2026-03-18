<template>
  <div class="pc-sidebar">
    <div class="sidebar-logo" @click="$router.push('/pc')">
      <img src="/log.png" alt="Logo" class="logo-img" />
      <span class="logo-text">心事小屋</span>
    </div>

    <nav class="sidebar-nav">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigateTo(item.path)"
      >
        <el-icon size="20"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
        <el-badge
          v-if="item.badge && item.badge > 0"
          :value="item.badge > 99 ? '99+' : item.badge"
          class="nav-badge"
        />
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="nav-item" @click="handleLogout">
        <el-icon size="20"><SwitchButton /></el-icon>
        <span class="nav-label">退出登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  HomeFilled,
  Compass,
  ChatDotRound,
  MagicStick,
  User,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const menuItems = computed(() => [
  { path: '/pc', label: '首页', icon: HomeFilled, badge: 0 },
  { path: '/pc/discover', label: '发现', icon: Compass, badge: 0 },
  { path: '/pc/chat', label: '聊天', icon: ChatDotRound, badge: userStore.totalUnreadCount || 0 },
  { path: '/pc/ai-chat', label: 'AI助手', icon: MagicStick, badge: 0 },
  { path: '/pc/profile', label: '我的', icon: User, badge: 0 }
])

const isActive = (path) => {
  if (path === '/pc') return route.path === '/pc'
  return route.path.startsWith(path)
}

const navigateTo = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/pc/login')
  } catch {}
}
</script>

<style scoped>
.pc-sidebar {
  width: 220px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.logo-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #333;
}

.nav-item.active {
  background: linear-gradient(135deg, #fff0f5, #fce4ec);
  color: #ff6b9d;
  font-weight: 600;
}

.nav-item.active .el-icon {
  color: #ff6b9d;
}

.nav-label {
  font-size: 15px;
}

.nav-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.sidebar-footer .nav-item {
  color: #999;
}

.sidebar-footer .nav-item:hover {
  color: #ff4757;
  background: #fff5f5;
}
</style>
