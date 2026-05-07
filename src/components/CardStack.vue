<template>
  <div class="card-stack-container" ref="container">
    <div 
      v-for="(card, index) in visibleCards" 
      :key="card.id"
      class="stack-card"
      :class="{ 
        'card-active': index === 0,
        'card-swiping': swipeState.isSwiping && index === 0
      }"
      :style="getCardStyle(index)"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <div class="card-content">
        <div class="card-image">
          <img :src="card.avatar" :alt="card.name" @error="handleImageError" />
          <div class="card-gradient"></div>
        </div>
        
        <div class="card-info">
          <h3 class="card-name">{{ card.name }}</h3>
          <p class="card-age">{{ card.age }}岁</p>
          <div class="card-tags">
            <span 
              v-for="tag in card.tags" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div class="card-actions">
          <button class="action-btn reject" @click="rejectCard">
            ❌
          </button>
          <button class="action-btn like" @click="likeCard">
            💖
          </button>
        </div>
      </div>
    </div>
    
    <!-- 滑动提示 -->
    <div class="swipe-hint" :class="swipeHintClass" v-if="swipeState.isSwiping">
      {{ swipeHintText }}
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && visibleCards.length === 0" class="empty-state">
      <div class="empty-icon">💔</div>
      <h3>暂无更多用户</h3>
      <p>试试调整筛选条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  cards: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['like', 'reject', 'empty'])

const container = ref(null)
const currentIndex = ref(0)
const gyroscopeData = reactive({ x: 0, y: 0, z: 0 })
const cardDimensions = ref({ width: 350, height: 580 })

const swipeState = reactive({
  isSwiping: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  deltaX: 0,
  deltaY: 0
})

// 计算卡片尺寸
const calculateCardSize = () => {
  if (!container.value) return
  
  const containerRect = container.value.getBoundingClientRect()
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height
  
  // 计算最佳卡片尺寸，保持16:9的宽高比
  const maxWidth = Math.min(containerWidth * 0.9, 400) // 最大340px
  const maxHeight = Math.min(containerHeight * 0.8, 600) // 最大580px
  
  // 根据宽高比调整
  const aspectRatio = 9 / 16 // 卡片宽高比
  let cardWidth = maxWidth
  let cardHeight = cardWidth / aspectRatio
  
  // 如果高度超出限制，按高度重新计算宽度
  if (cardHeight > maxHeight) {
    cardHeight = maxHeight
    cardWidth = cardHeight * aspectRatio
  }
  
  cardDimensions.value = {
    width: Math.floor(cardWidth),
    height: Math.floor(cardHeight)
  }
  
  console.log('计算卡片尺寸:', cardDimensions.value)
}

// 可见卡片（最多显示3张）
const visibleCards = computed(() => {
  console.log('计算可见卡片:', props.cards.length, currentIndex.value)
  const cards = props.cards.slice(currentIndex.value, currentIndex.value + 3)
  console.log('可见卡片:', cards)
  return cards
})

// 滑动提示
const swipeHintClass = computed(() => {
  if (Math.abs(swipeState.deltaX) < 50) return ''
  return swipeState.deltaX > 0 ? 'hint-like' : 'hint-reject'
})

const swipeHintText = computed(() => {
  if (Math.abs(swipeState.deltaX) < 50) return ''
  return swipeState.deltaX > 0 ? '💖 喜欢' : '❌ 不喜欢'
})

// 获取卡片样式
const getCardStyle = (index) => {
  const baseZ = 10 - index
  const scale = 1 - index * 0.05
  const translateY = index * 8 - 40 // 向上偏移40px
  const rotate = index * 2
  
  let style = {
    zIndex: baseZ,
    width: cardDimensions.value.width + 'px',
    height: cardDimensions.value.height + 'px',
    marginLeft: -(cardDimensions.value.width / 2) + 'px',
    marginTop: -(cardDimensions.value.height / 2) + 'px',
    transform: `
      translateY(${translateY}px) 
      scale(${scale}) 
      rotateZ(${rotate}deg)
      rotateX(${gyroscopeData.x * 0.5}deg)
      rotateY(${gyroscopeData.y * 0.5}deg)
    `
  }
  
  // 如果是正在滑动的卡片
  if (index === 0 && swipeState.isSwiping) {
    const rotation = swipeState.deltaX * 0.1
    const opacity = Math.max(0.3, 1 - Math.abs(swipeState.deltaX) / 300)
    
    style.transform += ` translateX(${swipeState.deltaX}px) rotateZ(${rotation}deg)`
    style.opacity = opacity
  }
  
  return style
}

// 触摸事件处理
const handleTouchStart = (event) => {
  if (visibleCards.value.length === 0) return
  
  const touch = event.touches[0]
  swipeState.isSwiping = true
  swipeState.startX = touch.clientX
  swipeState.startY = touch.clientY
  swipeState.currentX = touch.clientX
  swipeState.currentY = touch.clientY
  swipeState.deltaX = 0
  swipeState.deltaY = 0
}

const handleTouchMove = (event) => {
  if (!swipeState.isSwiping) return
  
  event.preventDefault()
  const touch = event.touches[0]
  swipeState.currentX = touch.clientX
  swipeState.currentY = touch.clientY
  swipeState.deltaX = swipeState.currentX - swipeState.startX
  swipeState.deltaY = swipeState.currentY - swipeState.startY
}

const handleTouchEnd = () => {
  if (!swipeState.isSwiping) return
  
  const threshold = cardDimensions.value.width * 0.3 // 动态阈值
  
  if (Math.abs(swipeState.deltaX) > threshold) {
    if (swipeState.deltaX > 0) {
      likeCard()
    } else {
      rejectCard()
    }
  }
  
  resetSwipeState()
}

// 鼠标事件处理
const handleMouseDown = (event) => {
  if (visibleCards.value.length === 0) return
  
  swipeState.isSwiping = true
  swipeState.startX = event.clientX
  swipeState.startY = event.clientY
  swipeState.currentX = event.clientX
  swipeState.currentY = event.clientY
  swipeState.deltaX = 0
  swipeState.deltaY = 0
}

const handleMouseMove = (event) => {
  if (!swipeState.isSwiping) return
  
  swipeState.currentX = event.clientX
  swipeState.currentY = event.clientY
  swipeState.deltaX = swipeState.currentX - swipeState.startX
  swipeState.deltaY = swipeState.currentY - swipeState.startY
}

const handleMouseUp = () => {
  if (!swipeState.isSwiping) return
  
  const threshold = cardDimensions.value.width * 0.3 // 动态阈值
  
  if (Math.abs(swipeState.deltaX) > threshold) {
    if (swipeState.deltaX > 0) {
      likeCard()
    } else {
      rejectCard()
    }
  }
  
  resetSwipeState()
}

// 重置滑动状态
const resetSwipeState = () => {
  swipeState.isSwiping = false
  swipeState.startX = 0
  swipeState.startY = 0
  swipeState.currentX = 0
  swipeState.currentY = 0
  swipeState.deltaX = 0
  swipeState.deltaY = 0
}

// 喜欢卡片
const likeCard = () => {
  if (visibleCards.value.length === 0) return
  
  const card = visibleCards.value[0]
  console.log('喜欢卡片:', card)
  emit('like', card)
  nextCard()
}

// 拒绝卡片
const rejectCard = () => {
  if (visibleCards.value.length === 0) return
  
  const card = visibleCards.value[0]
  console.log('拒绝卡片:', card)
  emit('reject', card)
  nextCard()
}

// 下一张卡片
const nextCard = () => {
  currentIndex.value++
  
  // 当翻到倒数第3张卡片时，提前加载更多数据
  if (currentIndex.value >= props.cards.length - 3) {
    console.log('即将翻完卡片，触发加载更多')
    emit('empty')
  }
  
  resetSwipeState()
}

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('图片加载失败:', event.target.src)
  event.target.src = `https://picsum.photos/300/400?random=${Date.now()}`
}

// 暴露方法给父组件
const rejectCurrent = () => {
  rejectCard()
}

const likeCurrent = () => {
  likeCard()
}

const superLike = () => {
  // 超级喜欢逻辑
  likeCard()
}

defineExpose({
  rejectCurrent,
  likeCurrent,
  superLike
})

// 陀螺仪支持
const handleDeviceOrientation = (event) => {
  if (event.beta !== null && event.gamma !== null) {
    gyroscopeData.x = Math.max(-15, Math.min(15, event.beta * 0.3))
    gyroscopeData.y = Math.max(-15, Math.min(15, event.gamma * 0.3))
  }
}

// 窗口大小变化处理
const handleResize = () => {
  calculateCardSize()
}

onMounted(() => {
  console.log('CardStack 组件挂载，接收到的卡片数据:', props.cards)
  
  // 计算初始卡片尺寸
  calculateCardSize()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 请求陀螺仪权限（iOS 13+）
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation)
        }
      })
  } else if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleDeviceOrientation)
  }
})

onUnmounted(() => {
  window.removeEventListener('deviceorientation', handleDeviceOrientation)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.card-stack-container {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stack-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center bottom;
  border-radius: 20px;
  overflow: hidden;
  cursor: grab;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  /* 尺寸由JavaScript动态设置 */
}

.stack-card.card-swiping {
  transition: none;
  cursor: grabbing;
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.card-image {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.card-info {
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  color: white;
  z-index: 2;
}

.card-name {
  font-size: clamp(20px, 4vw, 24px); /* 响应式字体 */
  font-weight: 700;
  margin: 0 0 5px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.card-age {
  font-size: clamp(14px, 3vw, 16px); /* 响应式字体 */
  opacity: 0.9;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: clamp(11px, 2.5vw, 13px); /* 响应式字体 */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-actions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 3;
}

.action-btn {
  width: clamp(45px, 10vw, 55px); /* 响应式按钮大小 */
  height: clamp(45px, 10vw, 55px);
  border-radius: 50%;
  border: none;
  font-size: clamp(18px, 4vw, 22px); /* 响应式图标大小 */
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn.reject {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
}

.action-btn.like {
  background: linear-gradient(135deg, #2ed573, #17c0eb);
  color: white;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

/* 滑动提示 */
.swipe-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  border-radius: 20px;
  font-size: clamp(16px, 4vw, 18px); /* 响应式字体 */
  font-weight: 600;
  z-index: 100;
  pointer-events: none;
}

.swipe-hint.hint-like {
  background: rgba(46, 213, 115, 0.9);
  color: white;
}

.swipe-hint.hint-reject {
  background: rgba(255, 71, 87, 0.9);
  color: white;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: clamp(40px, 8vw, 48px); /* 响应式图标 */
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: clamp(16px, 4vw, 18px);
  margin: 0 0 8px 0;
  color: #333;
}

.empty-state p {
  font-size: clamp(12px, 3vw, 14px);
  margin: 0;
  color: #999;
}

/* 移除固定的响应式断点，使用更灵活的适配 */
@media (max-width: 480px) {
  .card-info {
    bottom: 70px;
    left: 15px;
    right: 15px;
  }
  
  .card-actions {
    bottom: 15px;
    gap: 15px;
  }
  
  .tag {
    padding: 3px 6px;
    gap: 4px;
  }
}

@media (max-width: 320px) {
  .card-info {
    bottom: 60px;
    left: 12px;
    right: 12px;
  }
  
  .card-actions {
    bottom: 12px;
    gap: 12px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .card-stack-container {
    min-height: unset;
  }
}
</style>








