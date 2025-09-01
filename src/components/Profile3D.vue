<template>
  <div class="profile-3d-container" ref="profileContainer">
    <!-- 3D场景容器 -->
    <div 
      class="profile-scene"
      @mousemove="handleMouseMove"
      @mouseleave="resetRotation"
      v-gesture="gestureOptions"
    >
      <!-- 主卡片 -->
      <div 
        class="profile-card"
        :style="cardTransform"
        ref="profileCard"
      >
        <!-- 背景装饰 -->
        <div class="card-bg-decoration">
          <div class="bg-circle bg-circle-1"></div>
          <div class="bg-circle bg-circle-2"></div>
          <div class="bg-circle bg-circle-3"></div>
        </div>
        
        <!-- 用户头像区域 -->
        <div class="avatar-section">
          <div class="avatar-container" :style="avatarTransform">
            <van-image
              :src="profile.avatar"
              :alt="profile.name"
              fit="cover"
              round
              width="120"
              height="120"
              class="profile-avatar"
            >
              <template #loading>
                <van-loading type="spinner" size="20" />
              </template>
              <template #error>
                <div class="avatar-placeholder">🐰</div>
              </template>
            </van-image>
            
            <!-- 在线状态 -->
            <div v-if="profile.isOnline" class="online-status">
              <div class="status-dot"></div>
            </div>
            
            <!-- VIP徽章 -->
            <div v-if="profile.vipLevel" class="vip-badge">
              <van-icon name="diamond" />
              <span>VIP{{ profile.vipLevel }}</span>
            </div>
          </div>
          
          <!-- 用户基本信息 -->
          <div class="user-basic-info">
            <h2 class="user-name">
              {{ profile.name }}
              <van-icon v-if="profile.verified" name="success" color="#4CAF50" />
            </h2>
            <p class="user-subtitle">{{ profile.age }}岁 · {{ profile.location }}</p>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-number">{{ profile.followers }}</span>
                <span class="stat-label">关注者</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ profile.following }}</span>
                <span class="stat-label">关注中</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ profile.posts }}</span>
                <span class="stat-label">动态</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 个人简介 -->
        <div class="bio-section">
          <p class="bio-text">{{ profile.bio }}</p>
        </div>
        
        <!-- 兴趣标签 -->
        <div class="interests-section">
          <h4 class="section-title">兴趣爱好</h4>
          <div class="interests-grid">
            <van-tag
              v-for="interest in profile.interests"
              :key="interest"
              type="primary"
              size="medium"
              round
              class="interest-tag"
            >
              {{ getInterestEmoji(interest) }} {{ interest }}
            </van-tag>
          </div>
        </div>
        
        <!-- 照片墙 */
        <div class="photos-section">
          <h4 class="section-title">我的照片</h4>
          <div class="photos-grid">
            <div
              v-for="(photo, index) in profile.photos"
              :key="index"
              class="photo-item"
              :style="getPhotoTransform(index)"
              @click="previewPhoto(index)"
            >
              <van-image
                :src="photo"
                fit="cover"
                width="80"
                height="80"
                radius="12"
              />
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <van-button
            type="primary"
            size="large"
            round
            block
            class="action-btn primary-btn"
            @click="handleChat"
          >
            <van-icon name="chat-o" />
            开始聊天
          </van-button>
          
          <div class="secondary-actions">
            <van-button
              :type="isLiked ? 'danger' : 'default'"
              size="small"
              round
              class="action-btn secondary-btn"
              @click="handleLike"
            >
              <van-icon :name="isLiked ? 'like' : 'like-o'" />
              {{ isLiked ? '已喜欢' : '喜欢' }}
            </van-button>
            
            <van-button
              type="default"
              size="small"
              round
              class="action-btn secondary-btn"
              @click="handleGift"
            >
              <van-icon name="gift-o" />
              送礼物
            </van-button>
            
            <van-button
              type="default"
              size="small"
              round
              class="action-btn secondary-btn"
              @click="handleShare"
            >
              <van-icon name="share-o" />
              分享
            </van-button>
          </div>
        </div>
      </div>
      
      <!-- 浮动装饰元素 -->
      <div class="floating-decorations">
        <div 
          v-for="decoration in decorations"
          :key="decoration.id"
          class="floating-item"
          :style="decoration.style"
        >
          {{ decoration.emoji }}
        </div>
      </div>
    </div>
    
    <!-- 互动特效层 -->
    <div v-if="showEffects" class="effects-layer">
      <div 
        v-for="effect in activeEffects"
        :key="effect.id"
        class="effect-item"
        :class="effect.type"
        :style="effect.style"
      >
        {{ effect.content }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGesture } from '@vueuse/gesture'
import { showImagePreview, showToast } from 'vant'

const props = defineProps({
  profile: {
    type: Object,
    default: () => ({
      id: 1,
      name: '小甜心',
      age: 22,
      location: '北京',
      avatar: 'https://picsum.photos/240/240?random=1',
      bio: '喜欢阳光，喜欢笑，希望遇到那个对的人一起看世界 🌸',
      isOnline: true,
      verified: true,
      vipLevel: 2,
      followers: 1234,
      following: 567,
      posts: 89,
      interests: ['旅行', '美食', '摄影', '音乐', '读书'],
      photos: [
        'https://picsum.photos/160/160?random=2',
        'https://picsum.photos/160/160?random=3',
        'https://picsum.photos/160/160?random=4',
        'https://picsum.photos/160/160?random=5',
        'https://picsum.photos/160/160?random=6',
        'https://picsum.photos/160/160?random=7'
      ]
    })
  }
})

const emit = defineEmits(['chat', 'like', 'gift', 'share'])

const profileContainer = ref(null)
const profileCard = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)
const rotationX = ref(0)
const rotationY = ref(0)
const isLiked = ref(false)
const showEffects = ref(false)
const activeEffects = ref([])
const decorations = ref([])
const effectId = ref(0)

// 手势配置
const gestureOptions = useGesture({
  onPinch: ({ scale }) => {
    if (scale > 1.2) {
      handleLike()
    }
  },
  onSwipeUp: () => {
    // 上滑查看更多照片
    console.log('查看更多照片')
  },
  onSwipeDown: () => {
    // 下滑返回
    console.log('返回')
  }
})

// 卡片变换样式
const cardTransform = computed(() => ({
  transform: `
    perspective(1000px)
    rotateX(${rotationX.value}deg)
    rotateY(${rotationY.value}deg)
    translateZ(0)
  `,
  transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}))

// 头像变换样式
const avatarTransform = computed(() => ({
  transform: `
    translateZ(20px)
    rotateX(${-rotationX.value * 0.5}deg)
    rotateY(${-rotationY.value * 0.5}deg)
  `
}))

// 兴趣表情映射
const getInterestEmoji = (interest) => {
  const emojiMap = {
    '旅行': '✈️',
    '美食': '🍰',
    '摄影': '📸',
    '音乐': '🎵',
    '读书': '📚',
    '运动': '🏃‍♀️',
    '电影': '🎬',
    '游戏': '🎮',
    '绘画': '🎨',
    '舞蹈': '💃'
  }
  return emojiMap[interest] || '💫'
}

// 照片变换效果
const getPhotoTransform = (index) => {
  const angle = (index * 60) + (rotationY.value * 0.1)
  const translateZ = Math.sin(angle * Math.PI / 180) * 10
  
  return {
    transform: `translateZ(${translateZ}px) rotateY(${angle * 0.1}deg)`,
    transition: 'transform 0.3s ease'
  }
}

// 处理鼠标移动
const handleMouseMove = (event) => {
  if (!profileContainer.value) return
  
  const rect = profileContainer.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  mouseX.value = event.clientX - rect.left
  mouseY.value = event.clientY - rect.top
  
  // 计算旋转角度
  rotationY.value = ((mouseX.value - centerX) / centerX) * 15
  rotationX.value = ((centerY - mouseY.value) / centerY) * 15
}

// 重置旋转
const resetRotation = () => {
  rotationX.value = 0
  rotationY.value = 0
}

// 生成浮动装饰
const generateDecorations = () => {
  const emojis = ['🌸', '💖', '✨', '🦋', '🌙', '⭐', '💫', '🌺']
  
  for (let i = 0; i < 8; i++) {
    decorations.value.push({
      id: i,
      emoji: emojis[i],
      style: {
        position: 'absolute',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        fontSize: Math.random() * 10 + 15 + 'px',
        opacity: Math.random() * 0.3 + 0.2,
        animation: `floatAround ${Math.random() * 10 + 15}s linear infinite`,
        animationDelay: Math.random() * 5 + 's',
        pointerEvents: 'none'
      }
    })
  }
}

// 创建特效
const createEffect = (type, content, x = 0, y = 0) => {
  const effect = {
    id: effectId.value++,
    type,
    content,
    style: {
      position: 'absolute',
      left: x + 'px',
      top: y + 'px',
      pointerEvents: 'none',
      zIndex: 1000
    }
  }
  
  activeEffects.value.push(effect)
  
  setTimeout(() => {
    const index = activeEffects.value.findIndex(e => e.id === effect.id)
    if (index > -1) {
      activeEffects.value.splice(index, 1)
    }
  }, 2000)
}

// 处理聊天
const handleChat = () => {
  createEffect('chat', '💬', mouseX.value, mouseY.value)
  emit('chat', props.profile)
  showToast('开始聊天')
}

// 处理喜欢
const handleLike = () => {
  isLiked.value = !isLiked.value
  
  if (isLiked.value) {
    // 创建爱心雨效果
    showEffects.value = true
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        createEffect('heart', '💖', 
          Math.random() * 300 + 50, 
          Math.random() * 200 + 100
        )
      }, i * 100)
    }
    
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }
  
  emit('like', { profile: props.profile, liked: isLiked.value })
}

// 处理送礼
const handleGift = () => {
  createEffect('gift', '🎁', mouseX.value, mouseY.value)
  emit('gift', props.profile)
  showToast('礼物已送出')
}

// 处理分享
const handleShare = () => {
  createEffect('share', '📤', mouseX.value, mouseY.value)
  emit('share', props.profile)
  showToast('分享成功')
}

// 预览照片
const previewPhoto = (index) => {
  showImagePreview(props.profile.photos, { startPosition: index })
}

// 生命周期
onMounted(() => {
  generateDecorations()
})

onUnmounted(() => {
  // 清理定时器等
})
</script>

<style scoped>
.profile-3d-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(255, 182, 193, 0.1) 0%, 
    rgba(135, 206, 250, 0.1) 50%, 
    rgba(152, 251, 152, 0.1) 100%
  );
  overflow: hidden;
  position: relative;
}

.profile-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  position: relative;
}

.profile-card {
  width: 350px;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  transform-style: preserve-3d;
  position: relative;
  overflow-y: auto;
}

.card-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 24px;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.bg-circle-1 {
  width: 200px;
  height: 200px;
  background: var(--van-primary-color);
  top: -100px;
  right: -100px;
  animation: floatSlow 20s ease-in-out infinite;
}

.bg-circle-2 {
  width: 150px;
  height: 150px;
  background: var(--van-info-color);
  bottom: -75px;
  left: -75px;
  animation: floatSlow 25s ease-in-out infinite reverse;
}

.bg-circle-3 {
  width: 100px;
  height: 100px;
  background: var(--van-success-color);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: floatSlow 15s ease-in-out infinite;
}

.avatar-section {
  text-align: center;
  margin-bottom: 24px;
  transform-style: preserve-3d;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
  transform-style: preserve-3d;
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--van-gray-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.online-status {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-dot {
  width: 16px;
  height: 16px;
  background: var(--van-success-color);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.vip-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.user-basic-info {
  transform: translateZ(10px);
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--van-text-color);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.user-subtitle {
  font-size: 14px;
  color: var(--van-text-color-2);
  margin: 0 0 16px 0;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--van-primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--van-text-color-3);
}

.bio-section {
  margin-bottom: 24px;
  transform: translateZ(5px);
}

.bio-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--van-text-color-2);
  text-align: center;
  margin: 0;
}

.interests-section,
.photos-section {
  margin-bottom: 24px;
  transform: translateZ(5px);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
  margin: 0 0 12px 0;
}

.interests-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interest-tag {
  transition: all 0.3s ease;
}

.interest-tag:hover {
  transform: scale(1.05) translateZ(2px);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
}

.photo-item:hover {
  transform: scale(1.05) translateZ(10px);
}

.action-buttons {
  margin-top: 24px;
  transform: translateZ(10px);
}

.primary-btn {
  background: linear-gradient(135deg, var(--van-primary-color), #FF69B4);
  border: none;
  margin-bottom: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.4);
}

.secondary-actions {
  display: flex;
  gap: 8px;
}

.secondary-btn {
  flex: 1;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  transform: translateY(-1px);
}

.floating-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.floating-item {
  position: absolute;
}

.effects-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.effect-item {
  position: absolute;
  font-size: 24px;
}

.effect-item.heart {
  animation: heartFloat 2s ease-out forwards;
}

.effect-item.chat {
  animation: bounceUp 1s ease-out forwards;
}

.effect-item.gift {
  animation: giftSpin 1.5s ease-out forwards;
}

.effect-item.share {
  animation: shareExpand 1s ease-out forwards;
}

/* 动画定义 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes floatSlow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes floatAround {
  0% { transform: translateX(0) translateY(0) rotate(0deg); }
  25% { transform: translateX(20px) translateY(-20px) rotate(90deg); }
  50% { transform: translateX(0) translateY(-40px) rotate(180deg); }
  75% { transform: translateX(-20px) translateY(-20px) rotate(270deg); }
  100% { transform: translateX(0) translateY(0) rotate(360deg); }
}

@keyframes heartFloat {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
}

@keyframes bounceUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-30px) scale(1.2); opacity: 1; }
  100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
}

@keyframes giftSpin {
  0% { transform: rotate(0deg) scale(1); opacity: 1; }
  50% { transform: rotate(180deg) scale(1.3); opacity: 1; }
  100% { transform: rotate(360deg) scale(0.5); opacity: 0; }
}

@keyframes shareExpand {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-card {
    width: 90vw;
    max-width: 350px;
    margin: 20px;
  }
  
  .user-name {
    font-size: 20px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .secondary-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>