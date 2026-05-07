<template>
  <div class="pc-discover-page">
    <!-- Top tabs area -->
    <div class="discover-header">
      <h2 class="page-title">发现</h2>
      <div class="header-actions">
        <el-button :icon="Filter" circle @click="showFilter = true" />
      </div>
    </div>

    <el-tabs v-model="activeTab" class="discover-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="推荐" name="recommend" />
      <el-tab-pane label="附近" name="nearby" />
      <el-tab-pane label="在线" name="online" />
      <el-tab-pane label="动态" name="dynamic" />
      <el-tab-pane label="我的动态" name="moments" />
    </el-tabs>

    <!-- User grid for recommend / nearby / online -->
    <div v-if="activeTab !== 'moments' && activeTab !== 'dynamic'" class="user-grid-wrapper" ref="userGridWrapper" @scroll="handleUserScroll">
      <div v-if="isLoading && allUsers.length === 0" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <el-empty description="暂无用户数据" />
      </div>
      <div v-else class="user-grid">
        <PcUserCard
          v-for="user in filteredUsers"
          :key="user.id"
          :user="user"
          @like="handleLike"
          @follow="handleFollow"
          @view-profile="viewUserProfile"
        />
      </div>
      <div v-if="loadingMore" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-if="noMoreData && allUsers.length > 0" class="no-more">
        <span>没有更多了</span>
      </div>
    </div>

    <!-- Dynamic tab (all users' moments) -->
    <div v-else-if="activeTab === 'dynamic'" class="moments-wrapper">
      <div v-if="dynamicLoading" class="loading-container">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="dynamicList.length === 0" class="empty-state">
        <el-empty description="暂无动态" />
      </div>

      <div v-else class="moments-list">
        <div v-for="item in dynamicList" :key="item.id" class="moment-card">
          <div class="moment-header">
            <div class="moment-user-info" @click="viewUserProfile(item.userId)" style="cursor: pointer;">
              <el-avatar :src="item.avatarUrl" :size="44">{{ (item.nickname || '用')[0] }}</el-avatar>
              <div class="moment-user-detail">
                <span class="moment-nickname">{{ item.nickname || item.username || '用户' }}</span>
                <span class="moment-time">{{ formatTime(item.createTime) }}</span>
              </div>
            </div>
          </div>
          <div class="moment-body">
            <p class="moment-text">{{ item.content }}</p>
            <div v-if="item.imageList && item.imageList.length > 0" class="moment-images">
              <el-image
                v-for="(image, index) in item.imageList"
                :key="index"
                :src="image"
                fit="cover"
                class="moment-img"
                :preview-src-list="item.imageList"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- My moments tab -->
    <div v-else class="moments-wrapper">
      <div v-if="momentsLoading" class="loading-container">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="userMoments.length === 0" class="empty-state">
        <el-empty description="还没有发布动态">
          <el-button type="primary" round @click="router.push('/post')">发布第一条动态</el-button>
        </el-empty>
      </div>

      <div v-else class="moments-list">
        <div v-for="moment in userMoments" :key="moment.id" class="moment-card">
          <div class="moment-header">
            <div class="moment-user-info">
              <el-avatar :src="moment.avatarUrl" :size="44" />
              <div class="moment-user-detail">
                <span class="moment-nickname">{{ moment.nickname }}</span>
                <span class="moment-time">{{ formatTime(moment.createTime) }}</span>
              </div>
            </div>
            <div class="moment-ops">
              <el-button :icon="Edit" text type="primary" @click="editMoment(moment)">编辑</el-button>
              <el-button :icon="Delete" text type="danger" @click="handleDeleteMoment(moment.id)">删除</el-button>
            </div>
          </div>
          <div class="moment-body">
            <p class="moment-text">{{ moment.content }}</p>
            <div v-if="moment.imageList && moment.imageList.length > 0" class="moment-images">
              <el-image
                v-for="(image, index) in moment.imageList"
                :key="index"
                :src="image"
                fit="cover"
                class="moment-img"
                :preview-src-list="moment.imageList"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter drawer -->
    <el-drawer
      v-model="showFilter"
      title="筛选条件"
      direction="rtl"
      size="360px"
      :append-to-body="true"
    >
      <div class="filter-content">
        <div class="filter-section">
          <h4 class="filter-label">年龄范围 <span class="filter-value">{{ ageRange[0] }} - {{ ageRange[1] }}岁</span></h4>
          <el-slider v-model="ageRange" range :min="18" :max="50" :step="1" />
        </div>

        <div class="filter-section">
          <h4 class="filter-label">距离范围 <span class="filter-value">{{ distance }}km内</span></h4>
          <el-slider v-model="distance" :min="1" :max="100" :step="1" />
        </div>

        <div class="filter-section">
          <h4 class="filter-label">兴趣标签</h4>
          <div class="tag-checkbox-group">
            <el-checkbox
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :model-value="selectedTags.includes(tag)"
              @change="(val) => toggleTag(tag, val)"
            />
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-switch-row">
            <h4 class="filter-label">只看在线</h4>
            <el-switch v-model="onlineOnly" active-color="#ff6b9d" />
          </div>
        </div>

        <div class="filter-actions">
          <el-button round @click="resetFilter">重置</el-button>
          <el-button type="primary" round @click="applyFilter">应用筛选</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserTagsList, getRecommendUsers } from '@/api/user.js'
import { parseTags } from '@/api/types.js'
import { getuserup, deleteMoment as deleteMomentApi, getstup } from '@/api/post.js'
import { useUserStore } from '@/stores/user.js'
import { wsManager } from '@/utils/websocket.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter, Edit, Delete, Loading } from '@element-plus/icons-vue'
import PcUserCard from '../components/PcUserCard.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Reactive state
const activeTab = ref('recommend')
const showFilter = ref(false)
const isLoading = ref(false)
const momentsLoading = ref(false)

// Data
const allUsers = ref([])
const userMoments = ref([])

// Infinite scroll
const userGridWrapper = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const loadingMore = ref(false)
const noMoreData = ref(false)

// Dynamic (all users' moments)
const dynamicLoading = ref(false)
const dynamicList = ref([])

// Filter state
const ageRange = ref([18, 50])
const distance = ref(10)
const selectedTags = ref([])
const onlineOnly = ref(false)

const allTags = ref([
  '温柔', '阳光', '活泼', '文艺', '运动', '音乐', '电影', '旅行',
  '美食', '摄影', '读书', '游戏', '动漫', '宠物', '花艺', '舞蹈'
])

// Transform API user to card user (same logic as mobile)
const transformApiUserToCardUser = (apiUser) => {
  let tags = []
  try {
    const tagsStr = apiUser.tags || ''
    if (!tagsStr) {
      tags = []
    } else if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
      tags = JSON.parse(tagsStr)
    } else if (tagsStr.includes(',')) {
      tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag)
    } else {
      tags = [tagsStr.trim()]
    }
  } catch (e) {
    console.warn('解析标签失败:', e, apiUser.tags)
    tags = []
  }

  return {
    id: apiUser.id,
    name: apiUser.username || apiUser.userAccount || '用户',
    age: apiUser.age || 22,
    distance: (Math.random() * 5 + 0.5).toFixed(1),
    avatar: (apiUser.avatarUrl || `https://picsum.photos/300/400?random=${apiUser.id}`).trim(),
    tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
    isOnline: Math.random() > 0.5,
    bio: apiUser.signature || '这个人很神秘，什么都没有留下...'
  }
}

// Computed filtered users based on active tab
const filteredUsers = computed(() => {
  switch (activeTab.value) {
    case 'recommend':
      return allUsers.value
    case 'nearby':
      return allUsers.value.filter(user => parseFloat(user.distance) < 5)
    case 'online':
      return allUsers.value.filter(user => user.isOnline)
    default:
      return allUsers.value
  }
})

// Fetch users from API (supports pagination, uses recommend API for recommend tab)
const fetchUsersFromApi = async (page = 1) => {
  try {
    if (page === 1) {
      isLoading.value = true
    } else {
      loadingMore.value = true
    }

    if (activeTab.value === 'recommend') {
      // 推荐tab：使用推荐API
      const currentUserId = userStore.userInfo?.id
      if (!currentUserId) {
        isLoading.value = false
        loadingMore.value = false
        return
      }
      const response = await getRecommendUsers({
        userId: currentUserId,
        limit: pageSize.value,
        ageMin: ageRange.value[0],
        ageMax: ageRange.value[1]
      })

      if (response.code === 200 && response.data) {
        const list = Array.isArray(response.data) ? response.data : []
        const newUsers = list.map(u => ({
          id: u.id,
          name: u.userName || '用户',
          age: u.age || 22,
          distance: (Math.random() * 5 + 0.5).toFixed(1),
          avatar: (u.avatar || `https://picsum.photos/300/400?random=${u.id}`).trim(),
          tags: Array.isArray(u.tags) ? u.tags.slice(0, 3) : parseTags(u.tags || '[]').slice(0, 3),
          isOnline: Math.random() > 0.5,
          bio: u.signature || '这个人很神秘，什么都没有留下...',
          matchScore: u.matchScore || 0
        }))
        allUsers.value = newUsers
        noMoreData.value = true
      }
    } else {
      // 附近/在线tab：使用标签列表API
      const response = await getUserTagsList({ pageNum: page, pageSize: pageSize.value })

      if (response.code === 200 && response.data) {
        const { list } = response.data
        if (list && list.length > 0) {
          userStore.cacheUsers(list)
        }
        const newUsers = (list || []).map(transformApiUserToCardUser)

        if (page === 1) {
          allUsers.value = newUsers
        } else {
          allUsers.value.push(...newUsers)
        }

        if (!list || list.length < pageSize.value) {
          noMoreData.value = true
        }
        currentPage.value = page
      }
    }
  } catch (error) {
    console.error('获取用户数据失败:', error)
    if (page === 1) allUsers.value = []
  } finally {
    isLoading.value = false
    loadingMore.value = false
  }
}

// Infinite scroll handler
const handleUserScroll = (e) => {
  const el = e.target
  if (loadingMore.value || noMoreData.value) return
  // Trigger when scrolled near bottom (100px threshold)
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    fetchUsersFromApi(currentPage.value + 1)
  }
}

// Load all users' dynamic/moments
const loadDynamicList = async () => {
  try {
    dynamicLoading.value = true
    const response = await getstup()
    if (response.code === 200 || response.code === 0) {
      dynamicList.value = response.data || []
    }
  } catch (error) {
    console.error('获取动态失败:', error)
  } finally {
    dynamicLoading.value = false
  }
}

// Tab change handler
const handleTabChange = (tab) => {
  if (tab === 'moments') {
    loadUserMoments()
  } else if (tab === 'dynamic') {
    loadDynamicList()
  } else {
    // Reset pagination when switching user tabs
    currentPage.value = 1
    noMoreData.value = false
    fetchUsersFromApi(1)
  }
}

// Load user moments
const loadUserMoments = async () => {
  try {
    momentsLoading.value = true
    const userId = userStore.userInfo?.id

    if (!userId) {
      ElMessage.warning('用户信息错误')
      return
    }

    const response = await getuserup(Number(userId))

    if (response.code === 200 || response.code === 0) {
      userMoments.value = response.data || []
    } else {
      ElMessage.error(response.message || '获取动态失败')
    }
  } catch (error) {
    console.error('获取用户动态失败:', error)
    ElMessage.error('获取动态失败')
  } finally {
    momentsLoading.value = false
  }
}

// Delete moment with confirmation
const handleDeleteMoment = async (momentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？', '删除动态', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })

    const response = await deleteMomentApi(momentId)

    if (response.code === 200 || response.code === 0) {
      ElMessage.success('删除成功')
      userMoments.value = userMoments.value.filter(moment => moment.id !== momentId)
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// Edit moment
const editMoment = (moment) => {
  router.push({
    path: '/post',
    query: {
      mode: 'edit',
      momentId: moment.id
    }
  })
}

// Format time helper
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

// User actions
const handleLike = async (user) => {
  if (!wsManager.isConnected()) {
    if (userStore.userInfo?.id) {
      wsManager.connect(userStore.userInfo.id)
    }
  }
  const msg = {
    type: 'private',
    toUserId: String(user.id),
    message: 'ta刚刚在广场向你打了招呼,快来聊天吧'
  }
  const success = await wsManager.sendMessage(msg)
  if (success) {
    ElMessage.success(`已向 ${user.name} 打招呼`)
  } else {
    ElMessage.error('发送失败，请检查网络连接')
  }
}

const handleFollow = (user) => {
  ElMessage.success(`已关注 ${user.name}`)
}

const viewUserProfile = (userId) => {
  router.push(`/pc/profile/${userId}`)
}

// Filter actions
const toggleTag = (tag, checked) => {
  if (checked) {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  } else {
    selectedTags.value = selectedTags.value.filter(t => t !== tag)
  }
}

const resetFilter = () => {
  ageRange.value = [18, 50]
  distance.value = 10
  selectedTags.value = []
  onlineOnly.value = false
}

const applyFilter = () => {
  showFilter.value = false
  ElMessage.success('筛选条件已应用')
}

onMounted(async () => {
  if (route.query.tab === 'moments') {
    activeTab.value = 'moments'
    await loadUserMoments()
    return
  }

  await fetchUsersFromApi()
})
</script>

<style scoped>
.pc-discover-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px 32px;
}

/* Header */
.discover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* Tabs */
.discover-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #666;
  transition: color 0.3s;
}

.discover-tabs :deep(.el-tabs__item.is-active) {
  color: #ff6b9d;
  font-weight: 600;
}

.discover-tabs :deep(.el-tabs__active-bar) {
  background-color: #ff6b9d;
}

.discover-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #eee;
}

/* User grid */
.user-grid-wrapper {
  margin-top: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-bottom: 20px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

/* Loading & empty */
.loading-container {
  padding: 40px 0;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  color: #999;
  font-size: 14px;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  color: #ccc;
  font-size: 13px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.empty-state :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
}

/* Moments */
.moments-wrapper {
  margin-top: 20px;
}

.moments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 680px;
}

.moment-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;
}

.moment-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.moment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.moment-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.moment-user-detail {
  display: flex;
  flex-direction: column;
}

.moment-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.moment-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.moment-ops {
  display: flex;
  gap: 4px;
}

.moment-body {
  padding-left: 56px;
}

.moment-text {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #444;
}

.moment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.moment-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

/* Filter drawer */
.filter-content {
  padding: 8px 4px;
}

.filter-section {
  margin-bottom: 28px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-value {
  font-weight: 400;
  color: #ff6b9d;
  font-size: 13px;
}

.filter-section :deep(.el-slider__bar) {
  background: linear-gradient(90deg, #ff6b9d, #c084fc);
}

.filter-section :deep(.el-slider__button) {
  border-color: #ff6b9d;
}

.tag-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.tag-checkbox-group :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #ff6b9d;
  border-color: #ff6b9d;
}

.tag-checkbox-group :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #ff6b9d;
}

.filter-switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-switch-row .filter-label {
  margin: 0;
}

.filter-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.filter-actions .el-button--primary {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border: none;
  flex: 1;
}

.filter-actions .el-button:not(.el-button--primary) {
  flex: 1;
}
</style>
