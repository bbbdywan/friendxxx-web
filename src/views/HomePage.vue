<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="nav-left">
        <div class="logo">💕</div>
        <h1 class="app-name">心事小屋</h1>
      </div>
      <div class="nav-right">
        <van-icon name="plus" size="20" @click="$router.push('/post')" class="post-btn" />
        <van-icon name="chat-o" size="20" @click="$router.push('/ai-assistant')" class="ai-assistant-btn" title="AI智能助手" />
        <van-icon name="apps-o" size="20" @click="$router.push('/ai-chat-example')" class="example-btn" title="AI组件示例" />
        <van-icon name="search" size="20" @click="$router.push('/search')" />
        <van-icon name="bell-o" size="20" class="ml-4" />
      </div>
    </div>

    <!-- 轮播图 -->
    <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="(banner, index) in banners" :key="index">
        <div class="banner-item" :style="{ backgroundImage: `url(${banner.image})` }">
          <div class="banner-content">
            <h3>{{ banner.title }}</h3>
            <p>{{ banner.subtitle }}</p>
          </div>
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 功能入口 -->
    <div class="feature-grid">
      <div class="feature-item" @click="handleSmartMatch">
        <div class="feature-icon">🎯</div>
        <span>智能匹配</span>
      </div>
      <div class="feature-item" @click="startEmojiRain">
        <div class="feature-icon">🌧️</div>
        <span>表情雨</span>
      </div>
      <div class="feature-item" @click="handleAIAssistant">
        <div class="feature-icon">🤖</div>
        <span>AI助手</span>
      </div>
      <div class="feature-item" @click="handleChat">
        <div class="feature-icon">💬</div>
        <span>聊天</span>
      </div>
    </div>

    <!-- 推荐用户 -->
    <div class="section">
      <div class="section-header">
        <h2>推荐用户</h2>
        <div class="header-actions">
          <span @click="fetchRecommendUsers" class="refresh-btn">🔄</span>
          <span @click="$router.push('/chat-test')" class="test-btn">💬</span>
          <span @click="$router.push('/message-send-test')" class="test-btn">📤</span>
          <span @click="$router.push('/discover')">更多 ></span>
        </div>
      </div>
      <div class="user-grid">
        <div
          v-for="user in recommendUsers"
          :key="user.id"
          class="user-card"
          @click="viewUserProfile(user.id)"
        >
          <div class="user-avatar">
            <van-image :src="user.avatar" fit="cover" round />
            <div v-if="user.isOnline" class="online-dot"></div>
          </div>
          <div class="user-info">
            <h4>{{ user.name }}</h4>
            <p>{{ user.age }}岁</p>
            <div class="user-tags">
              <span v-for="tag in user.tags.slice(0, 2)" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 动态 -->
    <div class="section">
      <div class="section-header">
        <h2>最新动态</h2>
        <div class="header-actions">
          <span @click="refreshMoments" class="refresh-btn">🔄</span>
          <span @click="$router.push('/post')" class="post-btn">✏️</span>
          <span @click="$router.push('/discover?tab=moments')">更多 ></span>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="momentsLoading" class="loading-container">
        <van-loading type="spinner" size="24" text-size="14">加载中...</van-loading>
      </div>
      
      <!-- 动态列表 -->
      <div v-else-if="moments.length > 0" class="moments-list">
        <div v-for="moment in moments" :key="moment.id" class="moment-item card-hover">
          <!-- 用户信息 -->
          <div style="display: flex !important; align-items: center !important; gap: 0px !important; margin-bottom: 8px !important;">
            <van-image 
              :src="moment.user.avatar" 
              fit="cover" 
              round 
              width="36" 
              height="36"
              style="flex-shrink: 0 !important; width: 36px !important; height: 36px !important;"
            >
              <template #error>
                <div class="avatar-error">👤</div>
              </template>
            </van-image>
            
            <div style="flex: 1 !important; min-width: 0 !important; margin: 0 0 0 10px !important; padding: 0 !important;">
              <div style="font-size: 14px !important; font-weight: 600 !important; color: #333 !important; margin: 0 !important; padding: 0 !important; line-height: 1.2 !important;">{{ moment.user.name }}</div>
              <div style="font-size: 11px !important; color: #999 !important; margin: 2px 0 0 0 !important; padding: 0 !important; line-height: 1.1 !important;">{{ formatTime(moment.createdAt) }}</div>
            </div>
          </div>
          
          <!-- 动态内容 -->
          <div class="moment-content">
            <p v-if="moment.content" class="moment-text">{{ moment.content }}</p>
            
            <!-- 心情标签 -->
            <div v-if="moment.mood && moment.mood.length > 0" class="mood-tags">
              <van-tag
                v-for="moodItem in moment.mood"
                :key="moodItem.label"
                type="primary"
                size="mini"
                round
              >
                {{ moodItem.emoji }} {{ moodItem.label }}
              </van-tag>
            </div>
            
            <!-- 图片网格 -->
            <div v-if="moment.images && moment.images.length > 0" class="moment-images">
              <div 
                class="image-grid"
                :class="`grid-${Math.min(moment.images.length, 9)}`"
              >
                <div
                  v-for="(img, index) in moment.images.slice(0, 9)"
                  :key="index"
                  class="image-item"
                >
                  <van-image 
                    :src="img" 
                    fit="cover" 
                    width="100%" 
                    height="100%"
                    radius="8"
                    class="moment-image"
                  >
                    <template #loading>
                      <van-loading type="spinner" size="20" />
                    </template>
                    <template #error>
                      <div class="image-error">🖼️</div>
                    </template>
                  </van-image>
                  
                  <!-- 如果超过9张图片，显示更多提示 -->
                  <div v-if="index === 8 && moment.images.length > 9" class="more-images">
                    +{{ moment.images.length - 9 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 互动按钮 -->
          <!-- 
          <div class="moment-actions">
            <div 
              class="action-btn like-btn"
              :class="{ liked: moment.liked }"
              @click="likeMoment(moment)"
            >
              <van-icon :name="moment.liked ? 'like' : 'like-o'" />
              <span>{{ moment.likes }}</span>
            </div>
            
            <div class="action-btn comment-btn">
              <van-icon name="chat-o" />
              <span>{{ moment.comments }}</span>
            </div>
            
            <div class="action-btn share-btn">
              <van-icon name="share-o" />
              <span>分享</span>
            </div>
          </div>
          -->
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-moments">
        <div class="empty-icon">📝</div>
        <p class="empty-text">还没有动态哦</p>
        <van-button 
          type="primary" 
          size="small" 
          round
          @click="$router.push('/post')"
        >
          发布第一条动态
        </van-button>
      </div>
    </div>

    <!-- 表情雨组件 -->
    <EmojiRain 
      ref="emojiRain" 
      :show-controls="false" 
      :auto-start="false"
      trigger="manual"
      style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999;"
    />

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }">
      <div class="search-page">
        <div class="search-header">
          <van-search 
            v-model="searchKeyword" 
            placeholder="搜索用户、动态..." 
            @search="handleSearch"
            @cancel="showSearch = false"
            show-action
          />
        </div>
        <div class="search-content">
          <div class="search-hot">
            <h3>热门搜索</h3>
            <div class="hot-tags">
              <span v-for="tag in hotTags" :key="tag" class="hot-tag" @click="searchKeyword = tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 礼物弹窗 -->
    <van-popup v-model:show="showGiftModal" position="bottom" :style="{ height: '60%' }">
      <div class="gift-modal">
        <div class="modal-header">
          <h3>选择礼物</h3>
          <van-icon name="cross" @click="showGiftModal = false" />
        </div>
        <div class="gift-grid">
          <div v-for="gift in gifts" :key="gift.id" class="gift-item" @click="sendGift(gift)">
            <div class="gift-icon">{{ gift.icon }}</div>
            <span class="gift-name">{{ gift.name }}</span>
            <span class="gift-price">{{ gift.price }}💎</span>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { getUserTagsList, getUserById } from '../api/user.js'
import { getstup } from '../api/post.js'
import { parseTags } from '../api/types.js'
import { showToast, showImagePreview } from 'vant'
import EmojiRain from '../components/EmojiRain.vue'

const userStore = useUserStore()
const $router = useRouter()

const showSearch = ref(false)
const showGiftModal = ref(false)
const searchKeyword = ref('')
const emojiRain = ref(null)
const loading = ref(false)
const momentsLoading = ref(false)

// 轮播图数据 - 使用本地图片提高加载速度
const banners = ref([
  {
    image: '/homepage/轮播图01.jpg',
    title: '找到你的专属甜心',
    subtitle: '开启甜蜜的恋爱故事'
  },
  {
    image: '/homepage/轮播图02.jpg',
    title: '真实认证用户',
    subtitle: '安全可靠的交友环境'
  },
  {
    image: '/homepage/轮播图03.jpg',
    title: '智能匹配算法',
    subtitle: '为你推荐最合适的人'
  }
])

// 推荐用户
const recommendUsers = ref([])

// 动态数据 - 改为从API获取
const moments = ref([])

// 热门标签
const hotTags = ref(['温柔', '阳光', '运动', '旅行', '音乐', '美食', '摄影', '读书'])

// 礼物数据
const gifts = ref([
  { id: 1, name: '玫瑰', icon: '🌹', price: 10 },
  { id: 2, name: '巧克力', icon: '🍫', price: 20 },
  { id: 3, name: '泰迪熊', icon: '🧸', price: 50 },
  { id: 4, name: '钻戒', icon: '💍', price: 100 }
])

// 方法
const startEmojiRain = () => {
  console.log('点击表情雨')
  if (emojiRain.value) {
    console.log('启动表情雨')
    emojiRain.value.start()
  } else {
    console.log('表情雨组件未找到')
  }
}

const handleSearch = () => {
  console.log('搜索:', searchKeyword.value)
  // 这里可以添加搜索逻辑
}

// 删除点赞方法
// const likeMoment = (moment) => {
//   moment.liked = !moment.liked
//   moment.likes += moment.liked ? 1 : -1
//   
//   // 这里可以添加调用点赞API的逻辑
//   showToast(moment.liked ? '点赞成功' : '取消点赞')
// }

const sendGift = (gift) => {
  console.log('发送礼物:', gift.name)
  showGiftModal.value = false
  // 这里可以添加发送礼物的逻辑
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

// 获取推荐用户 - 只取前2个
const fetchRecommendUsers = async () => {
  try {
    loading.value = true
    recommendUsers.value = []
    console.log('获取首页推荐用户...')

    const response = await getUserTagsList({ pageNum: 1, pageSize: 50 })
    console.log('首页用户API响应:', response)
    
    if (response.code === 200 && response.data?.list) {
      // 缓存第一页数据到store
      userStore.cacheUsers(response.data.list)
      
      // 只取前2个用户显示在首页
      const users = response.data.list.slice(0, 2)
      
      recommendUsers.value = users.map(user => {
        const tags = parseTags(user.tags || '[]')
        return {
          id: user.id,
          name: user.username || '用户',
          age: user.age || 0,
          distance: Math.random() * 5 + 0.5,
          avatar: user.avatarUrl || `https://picsum.photos/200/200?random=${user.id}`,
          isOnline: Math.random() > 0.5,
          tags: Array.isArray(tags) ? tags.slice(0, 2) : [],
          gender: user.gender,
          signature: user.signature || ''
        }
      })
      
      console.log('首页推荐用户:', recommendUsers.value)
    }
  } catch (error) {
    console.error('获取推荐用户失败:', error)
    recommendUsers.value = []
  } finally {
    loading.value = false
  }
}

// 查看用户详情
const viewUserProfile = async (userId) => {
  try {
    console.log('查看用户详情，用户ID:', userId)

    // 调用API获取用户详情
    const response = await getUserById(userId)
    console.log('用户详情API响应:', response)

    if (response.code === 200 || response.code === 0) {
      // 跳转到用户详情页面，并传递用户数据
      const userDetail = response.data
      console.log('用户详情数据:', userDetail)

      // 跳转到用户详情页面
      await $router.push({
        path: `/user/${userId}`,
        query: {
          // 可以传递一些基本信息，避免重复请求
          name: userDetail.userName || userDetail.userAccount,
          avatar: userDetail.avatar || userDetail.avatarUrl
        }
      })
      
      // 确保页面滚动到顶部
      window.scrollTo(0, 0)
    } else {
      console.error('获取用户详情失败:', response.message)
      showToast({
        type: 'fail',
        message: '获取用户信息失败'
      })
    }
  } catch (error) {
    console.error('获取用户详情异常:', error)
    showToast({
      type: 'fail',
      message: '网络错误，请重试'
    })
  }
}

// 获取最新动态
const fetchMoments = async () => {
  try {
    momentsLoading.value = true
    console.log('开始获取最新动态...')

    const response = await getstup()
    console.log('动态列表API响应:', response)

    if (response.code === 200 || response.code === 0) {
      const momentsList = Array.isArray(response.data) ? response.data : []
      console.log('原始动态数据:', momentsList)

      if (momentsList.length === 0) {
        console.warn('API返回的动态数据为空')
        moments.value = []
        return
      }

      // 处理动态数据
      const processedMoments = momentsList.map(moment => {
        console.log('处理动态数据:', moment)

        return {
          id: moment.id,
          user: {
            id: moment.userId,
            name: moment.nickname || '用户',
            avatar: moment.avatarUrl || `https://picsum.photos/200/200?random=${moment.userId}`
          },
          content: moment.content || '',
          images: Array.isArray(moment.imageList) ? moment.imageList : [],
          likes: moment.likeCount || 0,
          comments: 0, // API中没有评论数，暂时设为0
          liked: false, // 默认未点赞
          createdAt: new Date(moment.createTime),
          mood: Array.isArray(moment.mood) ? moment.mood : []
        }
      })

      // 按时间倒序排列，最新的在最上面
      moments.value = processedMoments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      console.log('处理后的动态数据:', moments.value)

    } else {
      console.error('获取动态失败:', response.message)
      throw new Error(response.message || '获取动态失败')
    }

  } catch (error) {
    console.error('获取最新动态失败:', error)
    
    // 网络错误时使用模拟数据
    if (error.message.includes('网络') || error.message.includes('Network')) {
      console.log('使用模拟动态数据作为后备')
      moments.value = [
        {
          id: 1,
          user: { name: '小甜心', avatar: 'https://picsum.photos/200/200?random=1' },
          content: '今天天气真好，和朋友们一起去公园野餐了 🌸',
          images: ['https://picsum.photos/300/300?random=5', 'https://picsum.photos/300/300?random=6'],
          likes: 12,
          comments: 3,
          liked: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          mood: [{ emoji: '😊', label: '开心' }]
        }
      ]
    } else {
      showToast('获取动态失败，请重试')
      moments.value = []
    }
  } finally {
    momentsLoading.value = false
  }
}

// 预览图片
// const previewImages = (images, startIndex = 0) => {
//   if (images && images.length > 0) {
//     showImagePreview({
//       images: images,
//       startPosition: startIndex,
//       closeable: true
//     })
//   }
// } // 删除或注释掉这个方法

// 刷新动态
const refreshMoments = async () => {
  await fetchMoments()
  showToast('刷新成功')
}

onMounted(async () => {
  console.log('首页加载完成')
  await Promise.all([
    fetchRecommendUsers(),
    fetchMoments()
  ])
})

// 智能匹配
const handleSmartMatch = () => {
  console.log('智能匹配')
  $router.push('/discover')
}

// AI助手
const handleAIAssistant = () => {
  console.log('AI助手')
  $router.push('/ai-chat')
}

// 聊天
const handleChat = () => {
  console.log('聊天')
  $router.push('/chat')
}
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding-bottom: 80px;
  margin: 0;
  padding-left: 0;
  padding-right: 0;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logo {
  font-size: 28px;
  animation: bounce 2s infinite;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ml-4 {
  margin-left: 16px;
}

.banner-swipe {
  height: 180px;
  margin: var(--spacing-lg);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.banner-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.banner-content {
  text-align: center;
  color: white;
  z-index: 1;
}

.banner-content h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.banner-content p {
  font-size: 14px;
  opacity: 0.9;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 182, 193, 0.2);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.feature-item span {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.section {
  margin-bottom: var(--spacing-xl);
  padding: 0 var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.section-header span {
  font-size: 14px;
  color: var(--primary-pink);
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.refresh-btn {
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
  transition: transform 0.2s;
}

.refresh-btn:hover {
  transform: rotate(180deg);
}

.test-btn {
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
  transition: transform 0.2s;
}

.test-btn:hover {
  transform: scale(1.2);
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  width: 100%;
  box-sizing: border-box;
}

.user-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 182, 193, 0.2);
}

.user-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto var(--spacing-md);
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
}

.user-info {
  text-align: center;
}

.user-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.user-info p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
}

.user-tags {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(255, 182, 193, 0.2);
  color: var(--primary-pink);
  border-radius: 10px;
  font-size: 10px;
}

/* 动态相关样式 - 修复头像和昵称间距问题 */
.moments-list .moment-item {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.moments-list .moment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.moments-list .user-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.moments-list .user-info {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.moments-list .username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding: 0;
  line-height: 1.2;
}

.moments-list .time {
  font-size: 11px;
  color: #999;
  margin: 2px 0 0 0;
  padding: 0;
  line-height: 1.1;
}

.moments-list .moment-content {
  margin-left: 0; /* 移除强制左边距 */
  margin-bottom: 8px;
}

.moments-list .moment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  margin-left: 0; /* 移除强制左边距 */
}

.moment-text {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  margin: 8px 0;
}

.moment-images {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
}

.moment-images.single {
  grid-template-columns: 1fr;
  max-width: 200px;
}

.moment-images.double {
  grid-template-columns: 1fr 1fr;
  max-width: 200px;
}

.moment-images.multiple {
  grid-template-columns: repeat(3, 1fr);
  max-width: 180px;
}

.mood-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.moment-footer {
  margin-left: 46px;
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
}

.action-buttons {
  display: flex;
  gap: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #ff6b9d;
}

.action-btn.liked {
  color: #ff6b9d;
}

.avatar-error {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

/* 图片网格样式 */
.moment-images {
  margin-top: var(--spacing-sm);
}

.image-grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.grid-1 {
  grid-template-columns: 1fr;
  max-width: 200px;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
  max-width: 200px;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 200px;
}

.grid-4 {
  grid-template-columns: 1fr 1fr;
  max-width: 200px;
}

.grid-5, .grid-6, .grid-7, .grid-8, .grid-9 {
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 200px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
}

.moment-image {
  transition: transform 0.3s ease;
}

.image-item:hover .moment-image {
  transform: scale(1.05);
}

.more-images {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--background-light);
  color: var(--text-secondary);
  font-size: 20px;
}

/* 互动按钮样式 */
.moment-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  color: var(--text-secondary);
}

.action-btn:hover {
  background: var(--background-light);
}

.like-btn.liked {
  color: var(--primary-color);
}

.like-btn.liked .van-icon {
  color: var(--primary-color);
}

/* 空状态样式 */
.empty-moments {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  margin-bottom: var(--spacing-lg);
  font-size: 14px;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

/* 头部操作按钮样式 */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 12px;
}

.refresh-btn, .post-btn {
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.refresh-btn:hover, .post-btn:hover {
  background: var(--background-light);
  transform: scale(1.1);
}

.avatar-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--background-light);
  color: var(--text-secondary);
  font-size: 16px;
}

.search-page {
  height: 100%;
  background: white;
}

.search-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.search-content {
  padding: var(--spacing-lg);
}

.search-hot h3 {
  font-size: 16px;
  margin-bottom: var(--spacing-md);
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.hot-tag {
  padding: 6px 12px;
  background: rgba(255, 182, 193, 0.1);
  color: var(--primary-pink);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
}

.gift-modal {
  padding: var(--spacing-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.gift-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.gift-item:hover {
  border-color: var(--primary-pink);
  background: rgba(255, 182, 193, 0.05);
}

.gift-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.gift-name {
  font-size: 12px;
  margin-bottom: 4px;
}

.gift-price {
  font-size: 10px;
  color: var(--primary-pink);
  font-weight: 600;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .gift-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.post-btn {
  margin-right: 12px;
  padding: 6px;
  border-radius: 50%;
  background: var(--van-primary-color);
  color: white;
  transition: all 0.3s ease;
}

.post-btn:hover {
  transform: scale(1.1);
  background: var(--van-primary-color-dark);
}

.ai-assistant-btn {
  margin-right: 12px;
  padding: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transition: all 0.3s ease;
  position: relative;
}

.ai-assistant-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-assistant-btn::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ai-assistant-btn:hover::after {
  opacity: 0.3;
}

.example-btn {
  margin-right: 12px;
  padding: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c44569);
  color: white;
  transition: all 0.3s ease;
  position: relative;
}

.example-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
}

.example-btn::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #ff6b9d, #c44569);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.example-btn:hover::after {
  opacity: 0.3;
}
</style>

/* 使用更高优先级的选择器 */
.home-page .moments-list .moment-item .moment-header {
  display: flex !important;
  align-items: center !important;
  gap: 0px !important; /* 改为4px */
  margin-bottom: 8px !important;
}

.home-page .moments-list .moment-item .user-info {
  flex: 1 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.home-page .moments-list .moment-item .username {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #333 !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.3 !important;
}

.home-page .moments-list .moment-item .time {
  font-size: 12px !important;
  color: #999 !important;
  margin: 2px 0 0 0 !important;
  padding: 0 !important;
  line-height: 1.2 !important;
}

.home-page .moments-list .moment-item .moment-content {
  margin-left: 0 !important; /* 改为0 */
  margin-bottom: 8px !important;
}

/* 使用更高优先级的选择器覆盖动态按钮样式 */
.home-page .moments-list .moment-item .moment-actions {
  display: flex !important;
  align-items: center !important;
  gap: 32px !important;
  padding: 16px 0 !important;
  border-top: 1px solid #f0f0f0 !important;
  margin-top: 12px !important;
}

.home-page .moments-list .moment-item .action-btn {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 16px !important;
  border-radius: 20px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  font-size: 16px !important;
  color: #666 !important;
  background: none !important;
  border: none !important;
}

.home-page .moments-list .moment-item .action-btn .van-icon {
  font-size: 24px !important;
}

.home-page .moments-list .moment-item .action-btn:hover {
  background: #f5f5f5 !important;
}

.home-page .moments-list .moment-item .like-btn.liked {
  color: #ff4757 !important;
}

.home-page .moments-list .moment-item .like-btn.liked .van-icon {
  color: #ff4757 !important;
}

/* 简化的样式 */
.moments-list {
  padding: 0 16px;
}

.moment-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.time {
  font-size: 12px;
  color: #999;
}

.moment-content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.mood-tags {
  margin-bottom: 12px;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.moment-actions {
  display: flex;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
}

.action-btn .van-icon {
  font-size: 20px;
}

.action-btn.liked {
  color: #ff4757;
}

.moment-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0 8px 0;
  border-top: 1px solid #f5f5f5;
  margin-top: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 16px;
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
  justify-content: center;
}

.action-btn:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.action-btn.liked {
  color: #ff4757;
}

.action-btn.liked .van-icon {
  animation: likeScale 0.3s ease;
}

@keyframes likeScale {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}







