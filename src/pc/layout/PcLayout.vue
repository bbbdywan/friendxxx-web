<template>
  <div class="pc-layout">
    <PcSidebar />
    <div class="pc-main">
      <div class="pc-header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户、动态..."
            prefix-icon="Search"
            class="header-search"
            @keyup.enter="handleSearch"
            clearable
          />
        </div>
        <div class="header-right">
          <el-badge :value="userStore.totalUnreadCount || 0" :hidden="!userStore.totalUnreadCount" class="msg-badge">
            <el-icon size="20" class="header-icon" @click="$router.push('/pc/chat')"><ChatDotRound /></el-icon>
          </el-badge>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar-wrap">
              <el-avatar :size="36" :src="userStore.userInfo?.avatar || userStore.userInfo?.avatarUrl" />
              <span class="user-name">{{ userStore.userInfo?.userName || userStore.userInfo?.username || '用户' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="admin">管理中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="pc-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user.js'
import { ElMessageBox, ElMessage } from 'element-plus'
import PcSidebar from '../components/PcSidebar.vue'

const router = useRouter()
const userStore = useUserStore()
const searchKeyword = ref('')

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/pc/search', query: { q: searchKeyword.value } })
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/pc/profile')
      break
    case 'admin':
      router.push('/pc/admin')
      break
    case 'logout':
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
      break
  }
}
</script>

<style scoped>
.pc-layout {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.pc-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pc-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  flex: 1;
  max-width: 400px;
}

.header-search {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.header-icon:hover {
  color: #ff6b9d;
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.3s;
}

.user-avatar-wrap:hover {
  background: #f5f5f5;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.pc-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.msg-badge {
  line-height: 1;
}
</style>
