<template>
  <div class="pc-home">
    <!-- Banner / Carousel -->
    <el-carousel height="280px" class="banner-carousel" :interval="4000" arrow="hover">
      <el-carousel-item v-for="(banner, index) in banners" :key="index">
        <div class="banner-slide" :style="{ background: banner.gradient }">
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <h2 class="banner-title">{{ banner.title }}</h2>
            <p class="banner-subtitle">{{ banner.subtitle }}</p>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- Feature Grid -->
    <div class="section feature-section">
      <div class="section-title-bar">
        <h3 class="section-title">特色功能</h3>
      </div>
      <div class="feature-grid">
        <el-card
          v-for="item in features"
          :key="item.key"
          class="feature-card"
          shadow="hover"
          @click="handleFeatureClick(item.key)"
        >
          <div class="feature-icon">{{ item.icon }}</div>
          <div class="feature-label">{{ item.label }}</div>
          <div class="feature-desc">{{ item.desc }}</div>
        </el-card>
      </div>
    </div>

    <!-- Recommended Users -->
    <div class="section user-section">
      <div class="section-title-bar">
        <h3 class="section-title">推荐用户</h3>
        <el-button text type="primary" @click="fetchUsers" :loading="loading">
          <el-icon v-if="!loading"><Refresh /></el-icon>
          换一批
        </el-button>
      </div>
      <div v-if="loading" class="loading-wrap">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="userList.length" class="user-grid">
        <PcUserCard
          v-for="user in userList"
          :key="user.id"
          :user="user"
          @like="handleLike"
          @follow="handleFollow"
          @viewProfile="handleViewProfile"
        />
      </div>
      <el-empty v-else description="暂无推荐用户" />
    </div>

    <!-- 最新动态 -->
    <div class="section dynamic-section">
      <div class="section-title-bar">
        <h3 class="section-title">最新动态</h3>
        <el-button text type="primary" @click="fetchDynamics" :loading="dynamicLoading">
          <el-icon v-if="!dynamicLoading"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div v-if="dynamicLoading" class="loading-wrap">
        <el-skeleton :rows="4" animated />
      </div>
      <div v-else-if="dynamicList.length" class="dynamic-list">
        <div v-for="item in dynamicList" :key="item.id" class="dynamic-card">
          <div class="dynamic-header">
            <div class="dynamic-user" @click="handleViewProfile(item.userId)">
              <el-avatar :src="item.avatarUrl" :size="44">{{ (item.nickname || '用')[0] }}</el-avatar>
              <div class="dynamic-user-detail">
                <span class="dynamic-nickname">{{ item.nickname || item.username || '用户' }}</span>
                <span class="dynamic-time">{{ formatDynamicTime(item.createTime) }}</span>
              </div>
            </div>
          </div>
          <div class="dynamic-body">
            <p class="dynamic-text">{{ item.content }}</p>
            <div v-if="item.imageList && item.imageList.length > 0" class="dynamic-images">
              <el-image
                v-for="(image, index) in item.imageList"
                :key="index"
                :src="image"
                fit="cover"
                class="dynamic-img"
                :preview-src-list="item.imageList"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无动态" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserTagsList } from '@/api/user.js'
import { getstup } from '@/api/post.js'
import { useUserStore } from '@/stores/user.js'
import { wsManager } from '@/utils/websocket.js'
import PcUserCard from '../components/PcUserCard.vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const userList = ref([])
const loading = ref(false)
const dynamicList = ref([])
const dynamicLoading = ref(false)

// Banner data
const banners = [
  {
    title: '遇见有趣的灵魂',
    subtitle: '在心事小屋，找到与你灵魂共鸣的那个人',
    gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c084fc 100%)'
  },
  {
    title: 'AI智能匹配',
    subtitle: '基于兴趣与性格的智能推荐，让缘分更精准',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #f093fb 100%)'
  },
  {
    title: '实时聊天',
    subtitle: '随时随地畅聊，拉近彼此的距离',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #ff6b9d 100%)'
  }
]

// Feature items
const features = [
  { key: 'smartMatch', icon: '🎯', label: '智能匹配', desc: '基于兴趣的精准推荐' },
  { key: 'emojiRain', icon: '🌧️', label: '表情雨', desc: '趣味互动表达心意' },
  { key: 'ai', icon: '🤖', label: 'AI助手', desc: '智能聊天贴心陪伴' },
  { key: 'chat', icon: '💬', label: '聊天', desc: '实时畅聊不错过' }
]

// Feature click handler
function handleFeatureClick(key) {
  switch (key) {
    case 'smartMatch':
      router.push('/pc/discover')
      break
    case 'emojiRain':
      // Emoji rain is a fun in-page interaction, no route needed
      break
    case 'ai':
      router.push('/pc/ai-chat')
      break
    case 'chat':
      router.push('/pc/chat')
      break
  }
}

// Fetch recommended users
async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUserTagsList({ pageNum: 1, pageSize: 20 })
    const records = res?.data?.records || res?.data || res?.records || []
    userList.value = records.map((u) => {
      let tags = []
      if (u.tags) {
        try {
          tags = typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags
        } catch {
          tags = []
        }
      }
      return {
        id: u.id,
        name: u.username || u.userAccount || '未知用户',
        age: u.age || null,
        avatar: u.avatarUrl || '',
        distance: (Math.random() * 10 + 0.5).toFixed(1),
        tags: Array.isArray(tags) ? tags : [],
        isOnline: Math.random() > 0.5
      }
    })
  } catch (err) {
    console.error('获取推荐用户失败:', err)
  } finally {
    loading.value = false
  }
}

// Event handlers
async function handleLike(user) {
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

function handleFollow(user) {
  ElMessage.success(`已关注 ${user.name}`)
}

function handleViewProfile(userId) {
  router.push(`/pc/user/${userId}`)
}

// Fetch dynamics
async function fetchDynamics() {
  dynamicLoading.value = true
  try {
    const res = await getstup()
    if (res.code === 200 || res.code === 0) {
      dynamicList.value = res.data || []
    }
  } catch (err) {
    console.error('获取动态失败:', err)
  } finally {
    dynamicLoading.value = false
  }
}

function formatDynamicTime(time) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

onMounted(() => {
  fetchUsers()
  fetchDynamics()
})
</script>

<style scoped>
.pc-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ===== Banner Carousel ===== */
.banner-carousel {
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 32px;
}

.banner-carousel :deep(.el-carousel__indicators) {
  bottom: 16px;
}

.banner-carousel :deep(.el-carousel__indicator .el-carousel__button) {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.5);
}

.banner-carousel :deep(.el-carousel__indicator.is-active .el-carousel__button) {
  background: #fff;
  width: 32px;
}

.banner-slide {
  width: 100%;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
}

.banner-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.banner-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* ===== Section Shared ===== */
.section {
  margin-bottom: 36px;
}

.section-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
  padding-left: 12px;
  border-left: 4px solid #ff6b9d;
}

/* ===== Feature Grid ===== */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  cursor: pointer;
  border-radius: 16px;
  text-align: center;
  transition: all 0.3s ease;
  border: none;
}

.feature-card :deep(.el-card__body) {
  padding: 28px 16px;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(255, 107, 157, 0.2);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 12px;
  line-height: 1;
}

.feature-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 13px;
  color: #999;
}

/* ===== User Grid ===== */
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.loading-wrap {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===== Dynamic List ===== */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dynamic-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;
}

.dynamic-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dynamic-header {
  margin-bottom: 12px;
}

.dynamic-user {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.dynamic-user-detail {
  display: flex;
  flex-direction: column;
}

.dynamic-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.dynamic-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.dynamic-body {
  padding-left: 56px;
}

.dynamic-text {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #444;
}

.dynamic-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dynamic-img {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
</style>
