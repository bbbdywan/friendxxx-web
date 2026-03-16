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
      <van-tab title="动态" name="post">
        <div class="search-results">
          <van-loading v-if="searchLoading" type="spinner" size="24">搜索中...</van-loading>

          <div v-else-if="searchResults.length === 0 && hasSearched" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>没有找到相关动态</p>
            <p class="empty-tip">试试其他关键词吧</p>
          </div>

          <div v-else class="moments-list">
            <div
              v-for="moment in searchResults"
              :key="moment.id"
              class="moment-card"
              @click="viewMoment(moment)"
            >
              <!-- 用户信息头部 -->
              <div class="moment-header">
                <van-image
                  :src="moment.avatarUrl"
                  width="44"
                  height="44"
                  round
                  fit="cover"
                  class="user-avatar"
                >
                  <template #error>
                    <div class="avatar-error">👤</div>
                  </template>
                </van-image>
                <div class="user-info">
                  <h4 class="username">{{ moment.nickname }}</h4>
                  <span class="time">{{ formatTime(moment.createTime) }}</span>
                </div>
                <div class="moment-actions">
                  <van-icon name="ellipsis" size="16" />
                </div>
              </div>

              <!-- 动态内容 -->
              <div class="moment-content">
                <p class="content-text">{{ moment.content }}</p>

                <!-- 图片展示 -->
                <div v-if="moment.imageList && Array.isArray(moment.imageList) && moment.imageList.length > 0" class="moment-images">
                  <div class="image-grid" :class="`grid-${Math.min(moment.imageList.length, 3)}`">
                    <van-image
                      v-for="(img, index) in moment.imageList.slice(0, 9)"
                      :key="index"
                      :src="img"
                      fit="cover"
                      class="moment-image"
                      @click.stop="previewImages(moment.imageList, index)"
                    >
                      <template #error>
                        <div class="image-error">🖼️</div>
                      </template>
                    </van-image>
                  </div>
                </div>
              </div>

              <!-- 互动统计 -->
              <div class="moment-stats">
                <div class="stat-item">
                  <van-icon name="good-job-o" size="14" />
                  <span>{{ moment.likeCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <van-icon name="chat-o" size="14" />
                  <span>{{ moment.commentCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <van-icon name="share-o" size="14" />
                  <span>分享</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab title="用户" name="user">
        <div class="search-results">
          <van-loading v-if="searchLoading" type="spinner" size="24">搜索中...</van-loading>

          <div v-else-if="searchResults.length === 0 && hasSearched" class="empty-state">
            <div class="empty-icon">👤</div>
            <p>没有找到相关用户</p>
            <p class="empty-tip">试试其他关键词吧</p>
          </div>

          <div v-else class="users-list">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-card"
              @click="viewUserProfile(user.id)"
            >
              <div class="user-avatar-section">
                <van-image
                  :src="user.avatarUrl || `https://picsum.photos/64/64?random=${user.id}`"
                  width="64"
                  height="64"
                  round
                  fit="cover"
                  class="user-avatar"
                >
                  <template #error>
                    <div class="avatar-error">👤</div>
                  </template>
                </van-image>
                <div class="user-status" v-if="user.isOnline">
                  <div class="online-dot"></div>
                </div>
              </div>

              <div class="user-info">
                <div class="user-basic">
                  <h4 class="username">{{ user.username || user.userAccount }}</h4>
                  <div class="user-meta">
                    <span class="age" v-if="user.age">{{ user.age }}岁</span>
                    <span class="gender">{{ getGenderText(user.gender) }}</span>
                    <span class="location" v-if="user.hometown">{{ user.hometown }}</span>
                  </div>
                </div>

                <p class="user-signature">{{ user.signature || '这个人很懒，什么都没写~' }}</p>

                <div class="user-tags" v-if="user.tags">
                  <van-tag
                    v-for="tag in parseTags(user.tags).slice(0, 3)"
                    :key="tag"
                    size="mini"
                    type="primary"
                    round
                  >
                    {{ tag }}
                  </van-tag>
                </div>

                <div class="user-details">
                  <span class="detail-item" v-if="user.profession">{{ user.profession }}</span>
                  <span class="detail-item" v-if="user.education">{{ user.education }}</span>
                  <span class="detail-item" v-if="user.zodiac">{{ user.zodiac }}</span>
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
          </div>
        </div>
      </van-tab>
    </van-tabs>


    <!-- 热门话题 -->
    <div class="trending-section" v-if="!hasSearched">
      <div class="trending-header">
        <div class="header-left">
          <span class="fire-icon">🔥</span>
          <h3>热门话题</h3>
        </div>
        <span class="trending-subtitle">实时热搜榜</span>
      </div>

      <van-loading v-if="trendingLoading" type="spinner" size="24" class="trending-loading">
        加载中...
      </van-loading>

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
            <van-image
              :src="topic.icon"
              width="20"
              height="20"
              fit="cover"
              round
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showImagePreview } from 'vant'
import { search, getnews } from '../api/search.js'

const router = useRouter()
const route = useRoute()

const searchKeyword = ref('')
const activeTab = ref('post')
const searchLoading = ref(false)
const searchResults = ref([])
const hasSearched = ref(false)



const trendingTopics = ref([])
const trendingLoading = ref(false)

// 解析标签
const parseTags = (tagsStr) => {
  try {
    return JSON.parse(tagsStr || '[]')
  } catch {
    return []
  }
}

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

  try {
    searchLoading.value = true
    hasSearched.value = true

    const response = await search(
      searchKeyword.value.trim(),
      activeTab.value,
      0,
      20
    )

    console.log('搜索API响应:', response)

    // 处理不同的响应格式
    let data = []
    if (response.code === 200 || response.code === 0) {
      data = response.data || []
    } else if (Array.isArray(response)) {
      // 直接返回数组的情况
      data = response
    } else {
      throw new Error(response.message || '搜索失败')
    }

    searchResults.value = Array.isArray(data) ? data : []
    console.log('搜索结果数量:', searchResults.value.length)
    console.log('当前标签页:', activeTab.value)
    console.log('搜索结果详情:', searchResults.value)

  } catch (error) {
    console.error('搜索失败:', error)
    showToast('搜索失败，请重试')
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 切换搜索类型
const handleTabChange = () => {
  searchResults.value = []
  if (hasSearched.value && searchKeyword.value.trim()) {
    handleSearch()
  }
}

// 预览图片
const previewImages = (images, startIndex = 0) => {
  showImagePreview({
    images,
    startPosition: startIndex,
    closeable: true
  })
}

// 查看动态详情
const viewMoment = (moment) => {
  console.log('查看动态:', moment.id)
  // 跳转到动态详情页
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

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 获取热点话题
const fetchTrendingTopics = async () => {
  try {
    trendingLoading.value = true
    const response = await getnews()

    console.log('热点话题API响应:', response)

    if (response.code === 200 && response.data) {
      // 解析嵌套的JSON字符串
      const parsedData = JSON.parse(response.data)
      if (parsedData.code === 200 && Array.isArray(parsedData.data)) {
        trendingTopics.value = parsedData.data
        console.log('热点话题数据:', trendingTopics.value)
      }
    }
  } catch (error) {
    console.error('获取热点话题失败:', error)
    // 静默失败，不显示错误提示
  } finally {
    trendingLoading.value = false
  }
}

// 点击热点话题
const handleTrendingClick = (topic) => {
  if (topic.scheme) {
    // 在新窗口打开链接
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
  console.log('当前路由路径:', route.path)
  console.log('搜索页面加载完成')

  // 获取热点话题
  fetchTrendingTopics()
})
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

/* 动态卡片样式 */
.moments-list {
  gap: 12px;
}

.moment-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.moment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.moment-header .user-info {
  margin-left: 12px;
  flex: 1;
}

.moment-header .username {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.moment-header .time {
  font-size: 12px;
  color: #999;
}

.moment-actions {
  color: #999;
}

.content-text {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: #333;
  font-size: 15px;
}

.moment-images {
  margin: 12px 0;
}

.image-grid {
  display: grid;
  gap: 6px;
  border-radius: 8px;
  overflow: hidden;
}

.grid-1 {
  grid-template-columns: 1fr;
  max-width: 200px;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.moment-image {
  width: 100%;
  height: 100px;
  border-radius: 6px;
  cursor: pointer;
}

.moment-stats {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.stat-item:hover {
  color: #ff6b9d;
}

/* 用户卡片样式 */
.users-list {
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.user-avatar-section {
  position: relative;
  margin-right: 12px;
}

.user-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
}

.online-dot {
  width: 12px;
  height: 12px;
  background: #07c160;
  border-radius: 50%;
  border: 2px solid white;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-basic {
  margin-bottom: 8px;
}

.user-basic .username {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.user-meta span {
  position: relative;
}

.user-meta span:not(:last-child)::after {
  content: '·';
  margin-left: 8px;
  color: #ccc;
}

.user-signature {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.user-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 8px 0;
}

.user-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.detail-item {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.user-actions {
  margin-left: 12px;
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







