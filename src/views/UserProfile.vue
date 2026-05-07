<template>
  <div class="user-profile">
    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" vertical class="loading-center">
      加载中...
    </van-loading>
    
    <template v-else>
      <!-- 背景图区域 -->
      <div class="profile-background" :style="{ backgroundImage: `url(${userInfo.background})` }">
        <div class="background-overlay"></div>
        <!-- 导航栏 -->
        <van-nav-bar 
          :title="userInfo.name" 
          left-arrow 
          @click-left="$router.back()"
          fixed
          :style="{ background: 'transparent', color: 'white' }"
        >
          <template #right>
            <van-icon name="ellipsis" @click="showMoreActions = true" />
          </template>
        </van-nav-bar>
      </div>

      <!-- 用户头像和基本信息 -->
      <div class="user-header">
        <div class="avatar-section">
          <van-image 
            :src="userInfo.avatar" 
            fit="cover" 
            round 
            width="100" 
            height="100"
            class="user-avatar"
            @click="previewAvatar"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <div class="avatar-error">👤</div>
            </template>
          </van-image>
          <div class="online-status" v-if="userInfo.isOnline">
            <div class="online-pulse"></div>
          </div>
        </div>
        
        <div class="user-basic-info">
          <h2>{{ userInfo.name }}</h2>
          <div class="user-meta">
            <span class="age-gender">{{ userInfo.age }}岁 · {{ userInfo.gender === 0 ? '女' : '男' }}</span>
            <span class="location">
              <van-icon name="location-o" size="12" />
              距离你 {{ userInfo.distance }}km
            </span>
          </div>
        </div>
      </div>

      <!-- 个人简介 -->
      <div class="profile-bio" v-if="userInfo.bio">
        <p>{{ userInfo.bio }}</p>
      </div>

      <!-- 用户标签 -->
      <div class="user-tags" v-if="userInfo.tags && userInfo.tags.length > 0">
        <van-tag 
          v-for="tag in userInfo.tags" 
          :key="tag" 
          type="primary" 
          round
          class="tag"
        >
          {{ tag }}
        </van-tag>
      </div>

      <!-- 详细信息 -->
      <div class="detail-card">
        <div class="detail-section">
          <div class="detail-item" v-if="userInfo.height">
            <span class="detail-label">身高</span>
            <span class="detail-value">{{ userInfo.height }}cm</span>
          </div>
          <div class="detail-item" v-if="userInfo.occupation">
            <span class="detail-label">职业</span>
            <span class="detail-value">{{ userInfo.occupation }}</span>
          </div>
          <div class="detail-item" v-if="userInfo.education">
            <span class="detail-label">学历</span>
            <span class="detail-value">{{ userInfo.education }}</span>
          </div>
          <div class="detail-item" v-if="userInfo.constellation">
            <span class="detail-label">星座</span>
            <span class="detail-value">{{ userInfo.constellation }}</span>
          </div>
          <div class="detail-item" v-if="userInfo.hometown">
            <span class="detail-label">家乡</span>
            <span class="detail-value">{{ userInfo.hometown }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">感情状态</span>
            <span class="detail-value">{{ getRelationshipStatus(userInfo.relationshipStatus) }}</span>
          </div>
        </div>
      </div>

      <!-- 兴趣爱好卡片 -->
      <div class="interest-card">
        <h3 class="interest-title">兴趣爱好</h3>
        <div class="interest-grid">
          <div 
            v-for="interest in userInterests" 
            :key="interest.name"
            class="interest-item"
          >
            <div class="interest-icon">{{ interest.icon }}</div>
            <span class="interest-name">{{ interest.name }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="action-buttons">
        <van-button 
          type="danger" 
          size="large" 
          round 
          @click="handleReject"
          class="reject-btn"
        >
          <van-icon name="cross" />
          不感兴趣
        </van-button>
        
        <van-button 
          type="primary" 
          size="large" 
          round 
          @click="handleLike"
          class="like-btn"
        >
          <van-icon name="like-o" />
          喜欢
        </van-button>
        
        <van-button 
          type="success" 
          size="large" 
          round 
          @click="handleChat"
          class="chat-btn"
        >
          <van-icon name="chat-o" />
          聊天
        </van-button>
      </div>
    </template>
    
    <!-- 更多操作弹窗 -->
    <van-action-sheet
      v-model:show="showMoreActions"
      :actions="moreActions"
      @select="onActionSelect"
      cancel-text="取消"
    />

    <!-- 头像预览 -->
    <image-preview-modal
      v-model:show="showAvatarPreview"
      :images="userInfo.avatar ? [userInfo.avatar] : []"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getUserById } from '@/api/user'
import ImagePreviewModal from '@/components/ImagePreviewModal.vue'

const route = useRoute()
const router = useRouter()
const userInfo = ref({})
const loading = ref(true)
const showMoreActions = ref(false)

// 用户兴趣爱好数据
const userInterests = ref([
  { name: '咖啡', icon: '☕' },
  { name: '读书', icon: '📚' },
  { name: '旅行', icon: '✈️' },
  { name: '音乐', icon: '🎵' },
  { name: '电影', icon: '🎬' },
  { name: '运动', icon: '🏃' }
])

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    loading.value = true
    const userId = route.params.id
    const response = await getUserById(userId)
    
    if (response.code === 200 || response.code === 0) {
      const userData = response.data
      
      // 解析tags字段
      let parsedTags = {}
      try {
        if (userData.tags) {
          parsedTags = JSON.parse(userData.tags)
        }
      } catch (e) {
        console.warn('解析tags失败:', e)
      }
      
      // 更新用户信息
      userInfo.value = {
        id: userData.id,
        name: userData.userName || userData.userAccount || '用户',
        age: userData.age || 0,
        avatar: userData.avatar || `https://picsum.photos/120/120?random=${userData.id}`,
        background: userData.background || 'https://picsum.photos/400/200?random=bg',
        distance: (Math.random() * 5 + 0.5).toFixed(1),
        isOnline: Math.random() > 0.5,
        bio: userData.signature || '这个人很神秘，什么都没有留下...',
        height: userData.height || parsedTags.height || '',
        occupation: userData.profession || parsedTags.profession || '',
        education: userData.education || parsedTags.education || '',
        constellation: userData.zodiac || '',
        gender: userData.gender,
        hometown: userData.hometown || parsedTags.hometown || '',
        relationshipStatus: userData.relationshipStatus || 0,
        tags: parseUserTags(userData, parsedTags)
      }
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    showToast('获取用户资料失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 页面加载时滚动到顶部
  window.scrollTo(0, 0)
  fetchUserProfile()
})

// 方法
const shareProfile = () => {
  console.log('分享用户资料')
}

const rejectUser = () => {
  console.log('不感兴趣')
  router.back()
}

const likeUser = () => {
  console.log('喜欢用户')
  // 这里可以添加喜欢的逻辑，比如显示匹配成功弹窗
}

const startChat = () => {
  showMatchModal.value = false
  const userId = route.params.id || userInfo.value.id
  if (userId) {
    router.push(`/chat/${userId}`)
  } else {
    showToast('用户信息错误')
  }
}

const handleMoreAction = (action) => {
  console.log('更多操作:', action.name)
  showMoreActions.value = false
  
  switch (action.name) {
    case '分享资料':
      shareProfile()
      break
    case '举报用户':
      showReportModal.value = true
      break
    case '拉黑用户':
      console.log('拉黑用户')
      break
  }
}

const submitReport = () => {
  if (!reportReason.value) {
    console.log('请选择举报原因')
    return
  }
  
  console.log('提交举报:', reportReason.value)
  showReportModal.value = false
  reportReason.value = ''
}

// 获取感情状态文本
const getRelationshipStatus = (status) => {
  const statusMap = {
    0: '单身',
    1: '恋爱中',
    2: '已婚',
    3: '离异',
    4: '保密'
  }
  return statusMap[status] || '未知'
}

// 处理用户标签
const parseUserTags = (userData, parsedTags) => {
  const tags = []
  
  // 从profession, education, hometown等字段生成标签
  if (userData.profession) tags.push(userData.profession)
  if (userData.education) tags.push(userData.education)
  if (userData.hometown) tags.push(userData.hometown)
  if (userData.zodiac) tags.push(userData.zodiac)
  
  // 根据年龄生成标签
  if (userData.age) {
    if (userData.age < 25) tags.push('年轻')
    else if (userData.age < 30) tags.push('成熟')
    else tags.push('稳重')
  }
  
  // 添加解析后的tags
  if (parsedTags && typeof parsedTags === 'object') {
    Object.keys(parsedTags).forEach(key => {
      if (Array.isArray(parsedTags[key])) {
        tags.push(...parsedTags[key])
      }
    })
  }
  
  return [...new Set(tags.slice(0, 6))] // 最多显示6个标签，去重
}

// 更多操作选项
const moreActions = ref([
  { name: '分享资料', icon: 'share-o' },
  { name: '举报用户', icon: 'warning-o', color: '#ff4757' },
  { name: '拉黑用户', icon: 'delete-o', color: '#ff4757' }
])

// 处理更多操作选择
const onActionSelect = (action) => {
  switch (action.name) {
    case '分享资料':
      handleShare()
      break
    case '举报用户':
      handleReport()
      break
    case '拉黑用户':
      handleBlock()
      break
  }
  showMoreActions.value = false
}

// 分享资料
const handleShare = () => {
  showToast('分享功能开发中')
}

// 举报用户
const handleReport = () => {
  showDialog({
    title: '举报用户',
    message: '确定要举报这个用户吗？',
    confirmButtonText: '确定举报',
    confirmButtonColor: '#ff4757'
  }).then(() => {
    showToast('举报成功，我们会尽快处理')
  })
}

// 拉黑用户
const handleBlock = () => {
  showDialog({
    title: '拉黑用户',
    message: '拉黑后将不会再看到此用户，确定继续吗？',
    confirmButtonText: '确定拉黑',
    confirmButtonColor: '#ff4757'
  }).then(() => {
    showToast('已拉黑该用户')
    router.back()
  })
}

// 预览头像
const showAvatarPreview = ref(false)
const previewAvatar = () => {
  if (userInfo.value.avatar) showAvatarPreview.value = true
}

// 格式化距离显示
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance}km`
}

// 添加触觉反馈
const addHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const handleChat = () => {
  console.log('开始聊天，用户ID:', userInfo.value.id)
  router.push(`/chat/${userInfo.value.id}`)
}

// 导出所有方法和响应式数据

</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.profile-background {
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1));
}

.user-header {
  position: relative;
  padding: 20px;
  margin-top: -50px;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  align-items: flex-end;
  gap: 15px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.online-status {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-pulse {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

.user-basic-info {
  flex: 1;
  min-width: 0;
}

.user-basic-info h2 {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.age-gender {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.location {
  font-size: 14px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-swiper {
  height: 400px;
}

.photo-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  display: flex;
  align-items: flex-end;
  padding: var(--spacing-lg);
}

.photo-info {
  color: white;
}

.photo-index {
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.user-info-card {
  background: white;
  padding: var(--spacing-xl);
  margin: var(--spacing-lg);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.user-basic {
  margin-bottom: var(--spacing-lg);
}

.user-name-age {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.user-name-age h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.age {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.online-status {
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
}

.user-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.user-bio {
  margin-bottom: var(--spacing-lg);
}

.user-bio p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  margin: 0;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 182, 193, 0.2);
  color: var(--primary-pink);
  border-radius: 12px;
  font-size: 12px;
}

.user-details {
  margin: var(--spacing-lg);
}

.interests-section {
  margin: var(--spacing-lg);
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.interests-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-lg) 0;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.interest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  transition: all 0.3s ease;
}

.interest-item:hover {
  border-color: var(--primary-pink);
  background: rgba(255, 182, 193, 0.05);
}

.interest-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.interest-item span {
  font-size: 12px;
  color: var(--color-text);
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  z-index: 100;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.reject-btn {
  flex: 1;
  background: #ff4757 !important;
  border: none;
  color: white;
}

.like-btn {
  flex: 1;
  background: var(--primary-pink) !important;
  border: none;
  color: white;
}

.chat-btn {
  flex: 1;
  background: var(--secondary-mint) !important;
  border: none;
  color: white;
}

.action-buttons .van-button {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

/* 为底部按钮留出空间 */
.user-profile {
  padding-bottom: 100px;
}

.report-modal {
  text-align: center;
  min-width: 280px;
}

.report-modal h3 {
  margin-bottom: var(--spacing-lg);
}

.report-actions {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 个人简介 */
.profile-bio {
  padding: 0 20px 15px;
  background: white;
}

.profile-bio p {
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

/* 用户标签 */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 20px;
  background: white;
}

.tag {
  background: var(--primary-pink-light);
  color: var(--primary-pink);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

/* 详细信息卡片 */
.detail-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.detail-section {
  padding: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 15px;
  color: var(--color-text);
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* 兴趣爱好卡片 */
.interest-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.interest-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.interest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.interest-item:hover {
  background: var(--primary-pink-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

.interest-icon {
  font-size: 32px;
  margin-bottom: 8px;
  filter: grayscale(0.2);
  transition: filter 0.3s ease;
}

.interest-item:hover .interest-icon {
  filter: grayscale(0);
}

.interest-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  text-align: center;
}

.interest-item:hover .interest-name {
  color: var(--primary-pink);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .interest-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .interest-item {
    padding: 12px 6px;
  }
  
  .interest-icon {
    font-size: 28px;
  }
  
  .interest-name {
    font-size: 13px;
  }
}

@media (min-width: 768px) {
  .interest-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 底部操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  z-index: 100;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.reject-btn {
  flex: 1;
  background: #ff4757 !important;
  border: none;
  color: white;
}

.like-btn {
  flex: 1;
  background: var(--primary-pink) !important;
  border: none;
  color: white;
}

.chat-btn {
  flex: 1;
  background: var(--secondary-mint) !important;
  border: none;
  color: white;
}

.action-buttons .van-button {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

/* 头像错误状态 */
.avatar-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: var(--color-background);
  color: var(--color-text-secondary);
}

/* 导航栏样式 */
.van-nav-bar {
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent) !important;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  
  .user-basic-info {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .user-profile {
    max-width: 414px;
    margin: 0 auto;
  }
  
  .action-buttons {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 动画效果 */
.user-profile {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-avatar {
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 加载状态 */
.loading-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* 个人简介 */
.profile-bio {
  padding: 0 20px 15px;
  background: white;
}

.profile-bio p {
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

/* 用户标签 */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 20px;
  background: white;
}

.tag {
  background: var(--primary-pink-light);
  color: var(--primary-pink);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

/* 详细信息卡片 */
.detail-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.detail-section {
  padding: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 15px;
  color: var(--color-text);
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* 兴趣爱好卡片 */
.interest-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.interest-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.interest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.interest-item:hover {
  background: var(--primary-pink-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

.interest-icon {
  font-size: 32px;
  margin-bottom: 8px;
  filter: grayscale(0.2);
  transition: filter 0.3s ease;
}

.interest-item:hover .interest-icon {
  filter: grayscale(0);
}

.interest-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  text-align: center;
}

.interest-item:hover .interest-name {
  color: var(--primary-pink);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .interest-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .interest-item {
    padding: 12px 6px;
  }
  
  .interest-icon {
    font-size: 28px;
  }
  
  .interest-name {
    font-size: 13px;
  }
}

@media (min-width: 768px) {
  .interest-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 底部操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  z-index: 100;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.reject-btn {
  flex: 1;
  background: #ff4757 !important;
  border: none;
  color: white;
}

.like-btn {
  flex: 1;
  background: var(--primary-pink) !important;
  border: none;
  color: white;
}

.chat-btn {
  flex: 1;
  background: var(--secondary-mint) !important;
  border: none;
  color: white;
}

.action-buttons .van-button {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

/* 头像错误状态 */
.avatar-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: var(--color-background);
  color: var(--color-text-secondary);
}

/* 导航栏样式 */
.van-nav-bar {
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent) !important;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  
  .user-basic-info {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .user-profile {
    max-width: 414px;
    margin: 0 auto;
  }
  
  .action-buttons {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 动画效果 */
.user-profile {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-avatar {
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 加载状态 */
.loading-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* 个人简介 */
.profile-bio {
  padding: 0 20px 15px;
  background: white;
}

.profile-bio p {
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

/* 用户标签 */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 20px;
  background: white;
}

.tag {
  background: var(--primary-pink-light);
  color: var(--primary-pink);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

/* 详细信息卡片 */
.detail-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.detail-section {
  padding: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 15px;
  color: var(--color-text);
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* 兴趣爱好卡片 */
.interest-card {
  background: white;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.interest-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.interest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.interest-item:hover {
  background: var(--primary-pink-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

.interest-icon {
  font-size: 32px;
  margin-bottom: 8px;
  filter: grayscale(0.2);
  transition: filter 0.3s ease;
}

.interest-item:hover .interest-icon {
  filter: grayscale(0);
}

.interest-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  text-align: center;
}

.interest-item:hover .interest-name {
  color: var(--primary-pink);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .interest-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .interest-item {
    padding: 12px 6px;
  }
  
  .interest-icon {
    font-size: 28px;
  }
  
  .interest-name {
    font-size: 13px;
  }
}

@media (min-width: 768px) {
  .interest-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 底部操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  z-index: 100;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.reject-btn {
  flex: 1;
  background: #ff4757 !important;
  border: none;
  color: white;
}

.like-btn {
  flex: 1;
  background: var(--primary-pink) !important;
  border: none;
  color: white;
}

.chat-btn {
  flex: 1;
  background: var(--secondary-mint) !important;
  border: none;
  color: white;
}

.action-buttons .van-button {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

/* 头像错误状态 */
.avatar-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: var(--color-background);
  color: var(--color-text-secondary);
}

/* 导航栏样式 */
.van-nav-bar {
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent) !important;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  
  .user-basic-info {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .user-profile {
    max-width: 414px;
    margin: 0 auto;
  }
  
  .action-buttons {
    max-width: 414px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>


