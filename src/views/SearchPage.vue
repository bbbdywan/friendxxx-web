<template>
  <div class="search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索动态、用户..."
        @search="handleSearch"
        show-action
        autofocus
      >
        <template #action>
          <div @click="$router.back()" class="cancel-btn">取消</div>
        </template>
      </van-search>
    </div>

    <!-- 搜索类型切换 -->
    <van-tabs v-if="hasSearched" v-model:active="activeTab" @change="handleTabChange" sticky>
      <van-tab title="用户" name="user">
        <div class="search-results">
          <van-loading v-if="userSearchLoading && userSearchResults.length === 0" type="spinner" size="24">搜索中...</van-loading>

          <div v-else-if="userSearchResults.length === 0 && hasSearched" class="empty-state">
            <div class="empty-icon">👤</div>
            <p>没有找到相关用户</p>
            <p class="empty-tip">试试其他关键词吧</p>
          </div>

          <div v-else class="users-list">
            <div
              v-for="user in userSearchResults"
              :key="user.id"
              class="user-card"
              @click="viewUserProfile(user.id)"
            >
              <van-image
                :src="user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`"
                width="48"
                height="48"
                round
                fit="cover"
                class="user-avatar"
              >
                <template #error>
                  <div class="avatar-error">👤</div>
                </template>
              </van-image>

              <div class="user-info">
                <h4 class="username">{{ user.username || user.userName || user.userAccount }}</h4>
                <div class="user-meta">
                  <span v-if="user.age">{{ user.age }}岁</span>
                  <span v-if="user.gender">{{ getGenderText(user.gender) }}</span>
                  <span v-if="user.hometown">{{ user.hometown }}</span>
                </div>
              </div>

              <div class="user-actions">
                <van-button
                  type="primary"
                  size="small"
                  round
                  @click.stop="startChat(user)"
                >
                  聊天
                </van-button>
              </div>
            </div>

            <!-- 加载更多 -->
            <div v-if="userHasMore" class="load-more" @click="loadMoreUsers">
              <van-loading v-if="userSearchLoading" type="spinner" size="16" />
              <span v-else>加载更多</span>
            </div>
            <div v-else-if="userSearchResults.length > 0" class="no-more">
              没有更多了
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab title="动态" name="post">
        <div class="search-results">
          <div class="developing-state">
            <div class="developing-icon">🚧</div>
            <p class="developing-title">功能开发中</p>
            <p class="developing-tip">动态搜索功能正在开发中，敬请期待</p>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <div class="trending-section" v-if="!hasSearched">
      <div class="trending-header">
        <div class="header-left">
          <span class="fire-icon">🔥</span>
          <h3>热门话题</h3>
        </div>
        <span class="trending-subtitle">实时热搜榜</span>
      </div>

      <van-loading v-if="trendingLoading" type="spinner" size="24" class="trending-loading">加载中...</van-loading>

      <div v-else class="trending-list">
        <div v-for="(topic, index) in trendingTopics.slice(0, 10)" :key="index" class="trending-item" @click="handleTrendingClick(topic)">
          <div class="trending-rank" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</div>
          <div class="trending-content">
            <h4 class="trending-title">{{ topic.title }}</h4>
            <div class="trending-meta" v-if="topic.desc_extr">
              <span class="heat-value">{{ formatHeatValue(topic.desc_extr) }}</span>
            </div>
          </div>
          <van-image v-if="topic.icon" :src="topic.icon" width="20" height="20" fit="cover" round />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
defineOptions({ name: 'SearchPage' })
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { selectAlluser } from '../api/user.js'
import { getnews } from '../api/search.js'
import { getApiErrorMessage } from '../utils/error.js'

const router = useRouter()

const searchKeyword = ref('')
const activeTab = ref('user')
const hasSearched = ref(false)

// 用户搜索独立状态
const userSearchResults = ref([])
const userSearchLoading = ref(false)
const userCurrentPage = ref(1)
const userTotalPages = ref(0)
const userHasMore = ref(false)
const trendingTopics = ref([])
const trendingLoading = ref(false)





// 获取性别文本
const getGenderText = (gender) => {
  switch(gender) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    showToast('请输入搜索关键词')
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
      showToast(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('用户搜索失败:', error)
    showToast(getApiErrorMessage(error, '搜索失败，请重试'))
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
  router.push(`/user/${userId}`)
}

// 开始聊天
const startChat = (user) => {
  console.log('开始聊天:', user.id)
  // 跳转到聊天页面
}

const fetchTrendingTopics = async () => {
  try {
    trendingLoading.value = true
    const response = await getnews()
    const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    trendingTopics.value = Array.isArray(parsed?.data) ? parsed.data : []
  } catch (error) {
    console.error('获取热点话题失败:', error)
  } finally {
    trendingLoading.value = false
  }
}

const handleTrendingClick = (topic) => {
  if (topic.scheme) window.open(topic.scheme, '_blank')
}

const formatHeatValue = value => {
  if (!value) return ''
  return value >= 10000 ? `${(value / 10000).toFixed(1)}万热度` : `${value}热度`
}

onMounted(fetchTrendingTopics)


</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-header {
  background: white;
  padding: 8px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.cancel-btn {
  color: #333;
  font-size: 15px;
  padding: 0 16px;
  cursor: pointer;
}

.search-results {
  padding: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
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
  font-size: 17px;
  font-weight: 600;
  color: #666;
  margin: 0 0 8px 0;
}

.developing-tip {
  font-size: 14px;
  color: #ccc;
  margin: 0;
}

/* 用户卡片样式 */
.users-list {
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
}

.user-card:active {
  background: #fafafa;
}

.user-card .user-avatar {
  flex-shrink: 0;
  margin-right: 12px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info .username {
  margin: 0 0 4px 0;
  font-size: 16px;
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

.user-meta span:not(:last-child)::after {
  content: '·';
  margin-left: 6px;
  color: #ddd;
}

.user-actions {
  flex-shrink: 0;
  margin-left: 12px;
}

.load-more {
  text-align: center;
  padding: 16px 0;
  font-size: 14px;
  color: #999;
  cursor: pointer;
}

.load-more:active {
  color: #666;
}

.no-more {
  text-align: center;
  padding: 16px 0;
  font-size: 13px;
  color: #ccc;
}

/* 热门话题 */
.trending-section {
  padding: 16px;
}

.trending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fire-icon {
  font-size: 20px;
}

.trending-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.trending-subtitle {
  font-size: 12px;
  color: #999;
}

.trending-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.trending-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.trending-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.trending-item:last-child {
  border-bottom: none;
}

.trending-item:active {
  background: #f8f8f8;
}

.trending-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.trending-rank.top-three {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffa07a 100%);
  color: white;
  border-radius: 6px;
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
  line-height: 1.4;
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
  width: 24px;
  height: 24px;
  background: #ffe5f0;
  border-radius: 50%;
}





.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.hot-tag:hover {
  background: #ff6b9d;
  color: white;
  transform: translateY(-1px);
}

.avatar-error, .image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #ccc;
  font-size: 16px;
}
</style>







