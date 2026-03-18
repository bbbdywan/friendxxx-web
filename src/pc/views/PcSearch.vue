<template>
  <div class="pc-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户..."
          size="large"
          prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <el-button type="primary" size="large" @click="handleSearch" class="search-btn">
          搜索
        </el-button>
      </div>
    </div>

    <!-- 搜索类型切换 -->
    <div v-if="hasSearched" class="search-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="search-tabs">
        <el-tab-pane label="用户" name="user">
          <div class="search-results">
            <!-- 加载状态 -->
            <div v-if="userSearchLoading && userSearchResults.length === 0" class="skeleton-list">
              <el-skeleton v-for="i in 3" :key="i" :rows="2" animated class="skeleton-item" />
            </div>

            <!-- 空状态 -->
            <div v-else-if="userSearchResults.length === 0 && hasSearched" class="empty-state">
              <el-empty description="没有找到相关用户">
                <template #description>
                  <p class="empty-text">没有找到相关用户</p>
                  <p class="empty-tip">试试其他关键词吧</p>
                </template>
              </el-empty>
            </div>

            <!-- 用户列表 -->
            <div v-else class="users-list">
              <div
                v-for="user in userSearchResults"
                :key="user.id"
                class="user-card"
                @click="viewUserProfile(user.id)"
              >
                <el-avatar
                  :src="user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`"
                  :size="56"
                  class="user-avatar"
                >
                  <span>{{ (user.username || user.userName || '?').charAt(0) }}</span>
                </el-avatar>

                <div class="user-info">
                  <h4 class="username">{{ user.username || user.userName || user.userAccount }}</h4>
                  <div class="user-meta">
                    <span v-if="user.age" class="meta-item">{{ user.age }}岁</span>
                    <span v-if="user.gender" class="meta-item">{{ getGenderText(user.gender) }}</span>
                    <span v-if="user.hometown" class="meta-item">{{ user.hometown }}</span>
                  </div>
                </div>

                <div class="user-actions">
                  <el-button
                    type="primary"
                    round
                    @click.stop="startChat(user)"
                  >
                    聊天
                  </el-button>
                </div>
              </div>

              <!-- 加载更多 -->
              <div v-if="userHasMore" class="load-more">
                <el-button
                  :loading="userSearchLoading"
                  @click="loadMoreUsers"
                  round
                >
                  {{ userSearchLoading ? '加载中...' : '加载更多' }}
                </el-button>
              </div>
              <div v-else-if="userSearchResults.length > 0" class="no-more">
                没有更多了
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="动态" name="post">
          <div class="search-results">
            <div class="developing-state">
              <div class="developing-icon">🚧</div>
              <p class="developing-title">功能开发中</p>
              <p class="developing-tip">动态搜索功能正在开发中，敬请期待</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 热门话题（未搜索时显示） -->
    <div v-if="!hasSearched" class="trending-section">
      <div class="trending-header">
        <div class="header-left">
          <span class="fire-icon">🔥</span>
          <h3>热门话题</h3>
        </div>
        <span class="trending-subtitle">实时热搜榜</span>
      </div>

      <div v-if="trendingLoading" class="trending-loading">
        <el-skeleton v-for="i in 5" :key="i" :rows="1" animated class="trending-skeleton-item" />
      </div>

      <div v-else-if="trendingTopics.length > 0" class="trending-list">
        <div
          v-for="(topic, index) in trendingTopics.slice(0, 10)"
          :key="index"
          class="trending-item"
          @click="handleTrendingClick(topic)"
        >
          <div class="trending-rank" :class="{ 'top-three': index < 3 }">
            {{ index + 1 }}
          </div>
          <div class="trending-content">
            <h4 class="trending-title">{{ topic.title }}</h4>
            <div class="trending-meta" v-if="topic.desc_extr">
              <span class="heat-value">{{ formatHeatValue(topic.desc_extr) }}</span>
            </div>
          </div>
          <div class="trending-badge" v-if="topic.icon">
            <el-avatar :src="topic.icon" :size="24" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'PcSearch' })
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getnews } from '@/api/search.js'
import { selectAlluser } from '@/api/user.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const searchKeyword = ref('')
const activeTab = ref('user')
const hasSearched = ref(false)

// 用户搜索状态
const userSearchResults = ref([])
const userSearchLoading = ref(false)
const userCurrentPage = ref(1)
const userTotalPages = ref(0)
const userHasMore = ref(false)

// 热门话题状态
const trendingTopics = ref([])
const trendingLoading = ref(false)

// 获取性别文本
const getGenderText = (gender) => {
  switch (gender) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  hasSearched.value = true

  if (activeTab.value === 'user') {
    await searchUsersByApi()
  }
}

// 用户搜索 - 复用管理员接口
const searchUsersByApi = async (loadMore = false) => {
  try {
    userSearchLoading.value = true

    if (!loadMore) {
      userCurrentPage.value = 1
      userSearchResults.value = []
    }

    const params = {
      pageNum: userCurrentPage.value,
      pageSize: 10,
      username: searchKeyword.value.trim()
    }

    const response = await selectAlluser(params)

    if (response.code === 200 && response.data) {
      const pageInfo = response.data
      const list = pageInfo.list || []

      if (loadMore) {
        userSearchResults.value = [...userSearchResults.value, ...list]
      } else {
        userSearchResults.value = list
      }

      userTotalPages.value = pageInfo.pages || 0
      userHasMore.value = userCurrentPage.value < userTotalPages.value
    } else {
      if (!loadMore) userSearchResults.value = []
      ElMessage.error(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('用户搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
    if (!loadMore) userSearchResults.value = []
  } finally {
    userSearchLoading.value = false
  }
}

// 加载更多用户
const loadMoreUsers = () => {
  if (userHasMore.value && !userSearchLoading.value) {
    userCurrentPage.value++
    searchUsersByApi(true)
  }
}

// 切换搜索类型
const handleTabChange = () => {
  if (hasSearched.value && searchKeyword.value.trim()) {
    handleSearch()
  }
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push('/pc/user/' + userId)
}

// 开始聊天
const startChat = (user) => {
  console.log('开始聊天:', user.id)
}

// 获取热点话题
const fetchTrendingTopics = async () => {
  try {
    trendingLoading.value = true
    const response = await getnews()

    if (response.code === 200 && response.data) {
      const parsedData = JSON.parse(response.data)
      if (parsedData.code === 200 && Array.isArray(parsedData.data)) {
        trendingTopics.value = parsedData.data
      }
    }
  } catch (error) {
    console.error('获取热点话题失败:', error)
  } finally {
    trendingLoading.value = false
  }
}

// 点击热点话题
const handleTrendingClick = (topic) => {
  if (topic.scheme) {
    window.open(topic.scheme, '_blank')
  }
}

// 格式化热度值
const formatHeatValue = (value) => {
  if (!value) return '0热度'

  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万热度'
  }
  return value.toString() + '热度'
}

onMounted(() => {
  // 从路由参数预填搜索关键词
  if (route.query.q) {
    searchKeyword.value = route.query.q
    handleSearch()
  }

  // 获取热点话题
  fetchTrendingTopics()
})
</script>

<style scoped>
.pc-search-page {
  min-height: 100vh;
  background: #f5f6fa;
  padding: 32px 0;
}

/* 搜索头部 */
.search-header {
  max-width: 600px;
  margin: 0 auto 32px;
  padding: 0 24px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 4px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.search-input :deep(.el-input__wrapper:focus-within) {
  border-color: #ff6b9d;
}

.search-input :deep(.el-input__prefix .el-icon) {
  color: #ff6b9d;
  font-size: 18px;
}

.search-btn {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
  border-radius: 24px;
  padding: 0 28px;
  font-weight: 600;
  font-size: 15px;
  height: 42px;
}

.search-btn:hover {
  opacity: 0.9;
}

/* 搜索内容 */
.search-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.search-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.search-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #999;
}

.search-tabs :deep(.el-tabs__item.is-active) {
  color: #ff6b9d;
}

.search-tabs :deep(.el-tabs__active-bar) {
  background-color: #ff6b9d;
}

.search-results {
  padding: 16px 0;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
  margin: 0;
}

/* 开发中状态 */
.developing-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.developing-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.developing-title {
  font-size: 18px;
  font-weight: 600;
  color: #666;
  margin: 0 0 8px 0;
}

.developing-tip {
  font-size: 14px;
  color: #ccc;
  margin: 0;
}

/* 用户卡片 */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.12);
}

.user-avatar {
  flex-shrink: 0;
  margin-right: 16px;
  border: 2px solid #ffe5f0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info .username {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #999;
}

.meta-item:not(:last-child)::after {
  content: '\00b7';
  margin-left: 6px;
  color: #ddd;
}

.user-actions {
  flex-shrink: 0;
  margin-left: 16px;
}

.user-actions .el-button--primary {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
  font-weight: 500;
}

.user-actions .el-button--primary:hover {
  opacity: 0.9;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 20px 0;
}

.load-more .el-button {
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.load-more .el-button:hover {
  background: #fff5f8;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: #ccc;
}

/* 热门话题 */
.trending-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.trending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fire-icon {
  font-size: 22px;
}

.trending-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.trending-subtitle {
  font-size: 13px;
  color: #999;
}

.trending-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-skeleton-item {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
}

.trending-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}

.trending-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.trending-item:last-child {
  border-bottom: none;
}

.trending-item:hover {
  background: #fef7f9;
}

.trending-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  margin-right: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #999;
  border-radius: 8px;
}

.trending-rank.top-three {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffa07a 100%);
  color: white;
  font-weight: 700;
}

.trending-content {
  flex: 1;
  min-width: 0;
}

.trending-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trending-meta {
  display: flex;
  align-items: center;
}

.heat-value {
  font-size: 12px;
  color: #ff6b9d;
}

.trending-badge {
  margin-left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
