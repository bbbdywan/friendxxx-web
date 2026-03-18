<template>
  <div class="pc-user-profile" v-loading="loading" element-loading-text="加载中...">
    <div class="profile-container" v-if="userData">
      <!-- Profile Card -->
      <div class="profile-card">
        <!-- Background Image Area -->
        <div
          class="profile-background"
          :style="{ backgroundImage: userData.background ? `url(${userData.background})` : '' }"
        >
          <div class="background-gradient"></div>
        </div>

        <!-- Avatar Section -->
        <div class="avatar-wrapper">
          <div class="avatar-box">
            <el-image :src="userData.avatar" fit="cover" class="avatar-img">
              <template #error>
                <div class="avatar-fallback">{{ (userData.userName || '用')[0] }}</div>
              </template>
            </el-image>
            <span class="online-dot" v-if="userData.isOnline"></span>
          </div>
        </div>

        <!-- User Basic Info -->
        <div class="user-info-section">
          <h1 class="user-name">{{ userData.userName || '用户' }}</h1>
          <div class="user-meta">
            <span v-if="userData.age" class="meta-item">{{ userData.age }}岁</span>
            <span v-if="userData.gender !== null && userData.gender !== undefined" class="meta-item">{{ getGenderText(userData.gender) }}</span>
            <span v-if="userData.distance" class="meta-item">{{ userData.distance }}km</span>
          </div>
        </div>

        <!-- Bio / Signature -->
        <div class="user-bio">
          <p>{{ userData.signature || '这个人很懒，什么都没有留下...' }}</p>
        </div>

        <!-- Tags -->
        <div class="user-tags" v-if="parsedTags.length > 0">
          <el-tag
            v-for="tag in parsedTags"
            :key="tag"
            round
            size="default"
            class="profile-tag"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- Detail Info Grid -->
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">身高</span>
            <span class="detail-value">{{ userData.height || '未填写' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">职业</span>
            <span class="detail-value">{{ userData.profession || '未填写' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">学历</span>
            <span class="detail-value">{{ userData.education || '未填写' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">星座</span>
            <span class="detail-value">{{ userData.zodiac || '未填写' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">家乡</span>
            <span class="detail-value">{{ userData.hometown || '未填写' }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <el-button type="primary" size="large" class="like-btn" @click="handleLike">
            喜欢
          </el-button>
          <el-button size="large" class="chat-btn" @click="handleChat">
            聊天
          </el-button>
        </div>
        <div class="report-section">
          <el-button type="danger" text size="small" @click="handleReport">
            举报
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-if="!loading && !userData">
      <p>未找到该用户信息</p>
      <el-button type="primary" @click="router.back()">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserById } from '@/api/user.js'
import { useUserStore } from '@/stores/user.js'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const userData = ref(null)
const parsedTags = ref([])

// Get gender display text
const getGenderText = (gender) => {
  if (gender === 0) return '女'
  if (gender === 1) return '男'
  return '未知'
}

// Fetch user data on mount
const fetchUserData = async () => {
  const userId = route.params.id
  if (!userId) {
    ElMessage.error('用户ID不存在')
    return
  }

  loading.value = true
  try {
    const response = await getUserById(userId)
    if (response.code === 200 || response.code === 0) {
      const data = response.data
      userData.value = {
        id: data.id,
        userAccount: data.userAccount || '',
        userName: data.userName || data.username || '用户',
        age: data.age || null,
        gender: data.gender !== null && data.gender !== undefined ? Number(data.gender) : null,
        avatar: (data.avatar || data.avatarUrl || `https://picsum.photos/200/200?random=${data.id}`).trim(),
        background: data.background || '',
        signature: data.signature || '',
        tags: data.tags || '[]',
        height: data.height || '',
        profession: data.profession || '',
        education: data.education || '',
        zodiac: data.zodiac || '',
        hometown: data.hometown || '',
        distance: data.distance || '',
        isOnline: data.isOnline || false
      }

      // Parse tags
      try {
        const tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags
        parsedTags.value = Array.isArray(tags) ? tags : []
      } catch {
        parsedTags.value = []
      }
    } else {
      ElMessage.error(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请重试')
  } finally {
    loading.value = false
  }
}

// Action handlers
const handleLike = () => {
  console.log('喜欢用户:', userData.value?.id)
  ElMessage.success('已喜欢该用户')
}

const handleChat = () => {
  router.push('/pc/chat')
}

const handleReport = () => {
  ElMessage.info('举报功能开发中')
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.pc-user-profile {
  min-height: 100%;
  padding: 32px 16px;
  background: #f5f5f5;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

/* Profile Card */
.profile-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* Background */
.profile-background {
  position: relative;
  height: 250px;
  background-size: cover;
  background-position: center;
  background-color: linear-gradient(135deg, #ff6b9d, #c084fc);
  background-image: linear-gradient(135deg, #ff6b9d, #c084fc);
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.4) 100%
  );
}

/* Avatar */
.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-top: -60px;
  position: relative;
  z-index: 2;
}

.avatar-box {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.avatar-img :deep(img) {
  border-radius: 50%;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  color: #fff;
  font-size: 42px;
  font-weight: 600;
  border-radius: 50%;
}

.online-dot {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  background: #4caf50;
  border-radius: 50%;
  border: 3px solid #fff;
}

/* User Info */
.user-info-section {
  text-align: center;
  padding: 16px 24px 0;
}

.user-name {
  font-size: 26px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.user-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 15px;
  color: #888;
}

.meta-item {
  position: relative;
}

.meta-item + .meta-item::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 3px;
  background: #ccc;
  border-radius: 50%;
}

/* Bio */
.user-bio {
  padding: 16px 32px;
  text-align: center;
}

.user-bio p {
  font-size: 15px;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

/* Tags */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 0 32px 20px;
}

.profile-tag {
  background: rgba(255, 107, 157, 0.1);
  color: #ff6b9d;
  border-color: rgba(255, 107, 157, 0.2);
  font-size: 13px;
  padding: 4px 14px;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px 32px;
  margin: 0 24px;
  background: #fafafa;
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 13px;
  color: #999;
  font-weight: 400;
}

.detail-value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

/* Action Buttons */
.action-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 28px 32px 12px;
}

.like-btn {
  min-width: 160px;
  background: linear-gradient(135deg, #ff6b9d, #f093fb) !important;
  border: none !important;
  border-radius: 24px !important;
  font-size: 16px;
  font-weight: 600;
  color: #fff !important;
  letter-spacing: 2px;
}

.like-btn:hover {
  opacity: 0.9;
}

.chat-btn {
  min-width: 160px;
  border-radius: 24px !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border-color: #ff6b9d !important;
  color: #ff6b9d !important;
}

.chat-btn:hover {
  background: rgba(255, 107, 157, 0.06) !important;
}

/* Report */
.report-section {
  display: flex;
  justify-content: center;
  padding: 4px 0 24px;
}

.report-section .el-button {
  font-size: 13px;
  color: #c0c4cc !important;
}

.report-section .el-button:hover {
  color: #f56c6c !important;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #999;
  font-size: 15px;
  gap: 16px;
}
</style>
