<template>
  <div 
    class="cute-user-card"
    :class="{ 'card-liked': isLiked, 'card-online': user.isOnline }"
    v-gesture="gestureOptions"
  >
    <van-card
      :thumb="user.avatar"
      :title="user.name"
      :desc="`${user.age}岁 · ${user.distance}km`"
      :tag="user.isOnline ? '在线' : ''"
    >
      <template #thumb>
        <div class="avatar-container">
          <van-image
            :src="user.avatar"
            :alt="user.name"
            fit="cover"
            class="user-avatar"
            :class="{ 'avatar-pulse': user.isOnline }"
            @load="onImageLoad"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <div class="avatar-error">🐰</div>
            </template>
          </van-image>
          
          <div v-if="user.isOnline" class="online-indicator">
            <div class="online-dot"></div>
          </div>
          
          <div v-if="user.vipLevel" class="vip-badge">
            {{ '👑'.repeat(user.vipLevel) }}
          </div>
        </div>
      </template>
      
      <template #title>
        <div class="user-title">
          <span class="user-name">{{ user.name }}</span>
          <span v-if="user.matchScore > 0" class="match-tag">{{ user.matchScore }}%匹配</span>
          <span v-if="user.verified" class="verified-icon">✨</span>
        </div>
      </template>
      
      <template #desc>
        <div class="user-desc">
          <van-tag 
            v-for="tag in user.tags.slice(0, 3)" 
            :key="tag"
            :type="getTagType(tag)"
            size="mini"
            round
            class="user-tag cute-tag"
          >
            {{ getTagEmoji(tag) }} {{ tag }}
          </van-tag>
        </div>
      </template>
      
      <template #footer>
        <div class="card-actions">
          <van-button
            icon="chat-o"
            type="default"
            size="small"
            round
            class="action-btn chat-btn"
            @click="handleChat"
          >
            聊天
          </van-button>
          
          <van-button
            :icon="isLiked ? 'like' : 'like-o'"
            :type="isLiked ? 'danger' : 'default'"
            size="small"
            round
            class="action-btn like-btn"
            :class="{ 'btn-liked': isLiked }"
            @click="handleLike"
          >
            {{ isLiked ? '已喜欢' : '喜欢' }}
          </van-button>
          
          <van-button
            icon="gift-o"
            type="warning"
            size="small"
            round
            class="action-btn gift-btn"
            @click="handleGift"
          >
            送礼
          </van-button>
        </div>
      </template>
    </van-card>
    
    <!-- 互动特效层 -->
    <div v-if="showHearts" class="hearts-container">
      <div 
        v-for="heart in hearts" 
        :key="heart.id"
        class="floating-heart"
        :style="heart.style"
      >
        {{ heart.emoji }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGesture } from '@vueuse/gesture'

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      name: '小甜心',
      age: 22,
      avatar: 'https://picsum.photos/120/120?random=1',
      distance: 1.2,
      isOnline: true,
      verified: true,
      vipLevel: 2,
      tags: ['温柔', '爱笑', '喜欢猫咪', '旅行达人']
    })
  }
})

const emit = defineEmits(['like', 'chat', 'gift'])

const isLiked = ref(false)
const showHearts = ref(false)
const hearts = ref([])
const heartId = ref(0)

// 手势配置
const gestureOptions = useGesture({
  onPinch: ({ scale }) => {
    // 双指缩放效果
    if (scale > 1.2) {
      handleLike()
    }
  },
  onSwipeLeft: () => {
    // 左滑拒绝
    handleReject()
  },
  onSwipeRight: () => {
    // 右滑喜欢
    handleLike()
  },
  onLongPress: () => {
    // 长按查看详情
    handleViewProfile()
  }
})

// 标签类型映射
const getTagType = (tag) => {
  const typeMap = {
    '温柔': 'primary',
    '爱笑': 'success',
    '旅行': 'warning',
    '运动': 'danger',
    '音乐': 'primary',
    '美食': 'warning'
  }
  return typeMap[tag] || 'default'
}

// 标签表情映射
const getTagEmoji = (tag) => {
  const emojiMap = {
    '温柔': '🌸',
    '爱笑': '😊',
    '旅行': '✈️',
    '运动': '🏃‍♀️',
    '音乐': '🎵',
    '美食': '🍰',
    '读书': '📚',
    '电影': '🎬',
    '游戏': '🎮',
    '摄影': '📸'
  }
  return emojiMap[tag] || '💫'
}

// 创建爱心特效
const createHearts = () => {
  showHearts.value = true
  
  for (let i = 0; i < 6; i++) {
    const heart = {
      id: heartId.value++,
      emoji: ['💖', '💕', '💗', '💝', '💘'][Math.floor(Math.random() * 5)],
      style: {
        left: Math.random() * 80 + 10 + '%',
        animationDelay: i * 0.2 + 's',
        animationDuration: Math.random() * 2 + 2 + 's'
      }
    }
    hearts.value.push(heart)
  }
  
  setTimeout(() => {
    hearts.value = []
    showHearts.value = false
  }, 4000)
}

// 处理喜欢
const handleLike = () => {
  isLiked.value = !isLiked.value
  
  if (isLiked.value) {
    createHearts()
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }
  
  emit('like', { user: props.user, liked: isLiked.value })
}

// 处理聊天
const handleChat = () => {
  emit('chat', props.user)
}

// 处理送礼
const handleGift = () => {
  emit('gift', props.user)
}

// 处理拒绝
const handleReject = () => {
  // 添加拒绝动画
  console.log('拒绝用户:', props.user.name)
}

// 查看详情
const handleViewProfile = () => {
  console.log('查看用户详情:', props.user.name)
}

// 图片加载完成
const onImageLoad = () => {
  console.log('头像加载完成')
}
</script>

<style scoped>
.cute-user-card {
  margin: 16px;
  border-radius: var(--van-radius-lg);
  overflow: hidden;
  transition: all var(--van-duration-base) var(--van-ease-out);
  position: relative;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(135, 206, 250, 0.1));
}

.cute-user-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--van-shadow-3);
}

.cute-user-card.card-liked {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(255, 105, 180, 0.1));
  border: 2px solid var(--van-primary-color);
}

.avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--van-shadow-2);
}

.avatar-pulse {
  animation: cute-pulse 2s ease-in-out infinite;
}

.avatar-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
  background: var(--van-gray-2);
  border-radius: 50%;
}

.online-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-dot {
  width: 10px;
  height: 10px;
  background: var(--van-success-color);
  border-radius: 50%;
  animation: cute-pulse 1.5s ease-in-out infinite;
}

.vip-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 10px;
  box-shadow: var(--van-shadow-1);
}

.user-title {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  color: var(--van-text-color);
}

.match-tag {
  font-size: 10px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #f093fb);
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.verified-icon {
  font-size: 14px;
  animation: cute-wiggle 3s ease-in-out infinite;
}

.user-desc {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.cute-tag {
  transition: all var(--van-duration-fast) var(--van-ease-out);
}

.cute-tag:hover {
  transform: scale(1.1);
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  transition: all var(--van-duration-base) var(--van-ease-out);
}

.action-btn:active {
  transform: scale(0.95);
}

.like-btn.btn-liked {
  background: linear-gradient(45deg, #FF1493, #FF69B4);
  color: white;
  animation: cute-bounce 0.6s ease-out;
}

.chat-btn:hover {
  background: linear-gradient(45deg, var(--van-info-color), #87CEFA);
  color: white;
}

.gift-btn:hover {
  background: linear-gradient(45deg, var(--van-warning-color), #FFD700);
  color: white;
}

.hearts-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-heart {
  position: absolute;
  font-size: 20px;
  animation: floatUp linear;
  pointer-events: none;
}

@keyframes floatUp {
  0% {
    transform: translateY(100%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translateY(50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-20%) scale(0.5);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cute-user-card {
    margin: 8px;
  }
  
  .avatar-container {
    width: 60px;
    height: 60px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 6px;
  }
}
</style>