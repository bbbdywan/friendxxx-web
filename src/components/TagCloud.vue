<template>
  <div class="tag-cloud-container" ref="cloudContainer">
    <div class="cloud-header">
      <h3 class="cloud-title">{{ title }}</h3>
      <van-button 
        type="primary" 
        size="mini" 
        round
        @click="refreshCloud"
        :loading="isRefreshing"
      >
        刷新
      </van-button>
    </div>
    
    <div 
      class="tag-cloud"
      :style="{ height: cloudHeight + 'px' }"
      @click="handleCloudClick"
    >
      <div
        v-for="tag in processedTags"
        :key="tag.id"
        class="cloud-tag"
        :class="{ 
          'tag-selected': selectedTags.includes(tag.name),
          'tag-hot': tag.isHot,
          'tag-new': tag.isNew
        }"
        :style="tag.style"
        @click.stop="handleTagClick(tag)"
        @mouseenter="handleTagHover(tag)"
        @mouseleave="handleTagLeave(tag)"
      >
        <span class="tag-emoji">{{ tag.emoji }}</span>
        <span class="tag-name">{{ tag.name }}</span>
        <span v-if="tag.count" class="tag-count">{{ tag.count }}</span>
        
        <!-- 热门标签火焰效果 -->
        <div v-if="tag.isHot" class="hot-flame">
          <div class="flame flame-1">🔥</div>
          <div class="flame flame-2">🔥</div>
        </div>
        
        <!-- 新标签闪烁效果 -->
        <div v-if="tag.isNew" class="new-sparkle">✨</div>
      </div>
      
      <!-- 3D粒子背景 -->
      <div class="particle-bg">
        <div 
          v-for="particle in particles"
          :key="particle.id"
          class="particle"
          :style="particle.style"
        ></div>
      </div>
    </div>
    
    <!-- 选中标签展示 -->
    <div v-if="selectedTags.length" class="selected-tags">
      <div class="selected-header">
        <span class="selected-title">已选择 ({{ selectedTags.length }}/{{ maxSelection }})</span>
        <van-button 
          type="default" 
          size="mini" 
          @click="clearSelection"
        >
          清空
        </van-button>
      </div>
      
      <div class="selected-list">
        <van-tag
          v-for="tagName in selectedTags"
          :key="tagName"
          type="primary"
          size="medium"
          round
          closeable
          class="selected-tag"
          @close="removeTag(tagName)"
        >
          {{ getTagEmoji(tagName) }} {{ tagName }}
        </van-tag>
      </div>
    </div>
    
    <!-- 标签统计 -->
    <div class="tag-stats">
      <van-grid :column-num="3" :border="false">
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ totalTags }}</div>
            <div class="stat-label">总标签</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ hotTags.length }}</div>
            <div class="stat-label">热门</div>
          </div>
        </van-grid-item>
        <van-grid-item>
          <div class="stat-item">
            <div class="stat-number">{{ newTags.length }}</div>
            <div class="stat-label">新增</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [
      { name: '温柔', count: 1234, emoji: '🌸', isHot: true },
      { name: '爱笑', count: 987, emoji: '😊', isNew: true },
      { name: '旅行', count: 756, emoji: '✈️' },
      { name: '美食', count: 654, emoji: '🍰', isHot: true },
      { name: '音乐', count: 543, emoji: '🎵' },
      { name: '运动', count: 432, emoji: '🏃‍♀️' },
      { name: '读书', count: 321, emoji: '📚', isNew: true },
      { name: '电影', count: 298, emoji: '🎬' },
      { name: '摄影', count: 267, emoji: '📸' },
      { name: '咖啡', count: 234, emoji: '☕' },
      { name: '猫咪', count: 198, emoji: '🐱', isHot: true },
      { name: '游戏', count: 176, emoji: '🎮' },
      { name: '绘画', count: 154, emoji: '🎨', isNew: true },
      { name: '瑜伽', count: 132, emoji: '🧘‍♀️' },
      { name: '烘焙', count: 98, emoji: '🧁' }
    ]
  },
  title: {
    type: String,
    default: '兴趣标签云'
  },
  maxSelection: {
    type: Number,
    default: 5
  },
  cloudHeight: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['tagSelect', 'tagDeselect', 'selectionChange'])

const cloudContainer = ref(null)
const selectedTags = ref([])
const isRefreshing = ref(false)
const particles = ref([])
const animationId = ref(null)

// 使用 VueUse 获取容器尺寸
const { width: containerWidth } = useElementSize(cloudContainer)

// 处理后的标签数据
const processedTags = ref([])

// 计算属性
const totalTags = computed(() => props.tags.length)
const hotTags = computed(() => props.tags.filter(tag => tag.isHot))
const newTags = computed(() => props.tags.filter(tag => tag.isNew))

// 标签表情映射
const getTagEmoji = (tagName) => {
  const tag = props.tags.find(t => t.name === tagName)
  return tag?.emoji || '💫'
}

// 生成3D标签云位置
const generateTagPositions = () => {
  const tags = props.tags.map((tag, index) => {
    // 3D球面坐标
    const phi = Math.acos(-1 + (2 * index) / props.tags.length)
    const theta = Math.sqrt(props.tags.length * Math.PI) * phi
    
    // 转换为笛卡尔坐标
    const radius = 120
    const x = radius * Math.cos(theta) * Math.sin(phi)
    const y = radius * Math.sin(theta) * Math.sin(phi)
    const z = radius * Math.cos(phi)
    
    // 投影到2D平面
    const scale = 200 / (200 + z)
    const x2d = x * scale + containerWidth.value / 2
    const y2d = y * scale + props.cloudHeight / 2
    
    // 根据z轴距离计算大小和透明度
    const size = Math.max(0.5, scale)
    const opacity = Math.max(0.3, scale)
    
    return {
      ...tag,
      id: index,
      x: x2d,
      y: y2d,
      z: z,
      scale: size,
      opacity: opacity,
      rotation: Math.random() * 360,
      style: {
        position: 'absolute',
        left: x2d + 'px',
        top: y2d + 'px',
        transform: `scale(${size}) rotate(${Math.random() * 10 - 5}deg)`,
        opacity: opacity,
        zIndex: Math.floor(z + 200),
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }
    }
  })
  
  processedTags.value = tags
}

// 生成粒子背景
const generateParticles = () => {
  particles.value = []
  for (let i = 0; i < 20; i++) {
    particles.value.push({
      id: i,
      style: {
        position: 'absolute',
        left: Math.random() * containerWidth.value + 'px',
        top: Math.random() * props.cloudHeight + 'px',
        width: Math.random() * 4 + 2 + 'px',
        height: Math.random() * 4 + 2 + 'px',
        background: `hsl(${Math.random() * 60 + 300}, 70%, 80%)`,
        borderRadius: '50%',
        opacity: Math.random() * 0.5 + 0.2,
        animation: `particleFloat ${Math.random() * 10 + 10}s linear infinite`,
        animationDelay: Math.random() * 5 + 's'
      }
    })
  }
}

// 标签云旋转动画
const rotateCloud = () => {
  let angle = 0
  
  const animate = () => {
    angle += 0.005
    
    processedTags.value.forEach((tag, index) => {
      const phi = Math.acos(-1 + (2 * index) / props.tags.length)
      const theta = Math.sqrt(props.tags.length * Math.PI) * phi + angle
      
      const radius = 120
      const x = radius * Math.cos(theta) * Math.sin(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(phi)
      
      const scale = 200 / (200 + z)
      const x2d = x * scale + containerWidth.value / 2
      const y2d = y * scale + props.cloudHeight / 2
      
      const size = Math.max(0.5, scale)
      const opacity = Math.max(0.3, scale)
      
      tag.style = {
        ...tag.style,
        left: x2d + 'px',
        top: y2d + 'px',
        transform: `scale(${size}) rotate(${tag.rotation}deg)`,
        opacity: opacity,
        zIndex: Math.floor(z + 200)
      }
    })
    
    animationId.value = requestAnimationFrame(animate)
  }
  
  animate()
}

// 处理标签点击
const handleTagClick = (tag) => {
  if (selectedTags.value.includes(tag.name)) {
    removeTag(tag.name)
  } else if (selectedTags.value.length < props.maxSelection) {
    selectedTags.value.push(tag.name)
    emit('tagSelect', tag)
    
    // 添加选中动画
    addSelectAnimation(tag)
  } else {
    // 达到最大选择数量
    showToast(`最多只能选择${props.maxSelection}个标签`)
  }
  
  emit('selectionChange', selectedTags.value)
}

// 处理标签悬停
const handleTagHover = (tag) => {
  // 悬停放大效果
  const element = document.querySelector(`[data-tag-id="${tag.id}"]`)
  if (element) {
    element.style.transform = `scale(${tag.scale * 1.2}) rotate(${tag.rotation}deg)`
  }
}

// 处理标签离开
const handleTagLeave = (tag) => {
  const element = document.querySelector(`[data-tag-id="${tag.id}"]`)
  if (element) {
    element.style.transform = `scale(${tag.scale}) rotate(${tag.rotation}deg)`
  }
}

// 处理云朵点击（空白区域）
const handleCloudClick = (event) => {
  // 点击空白区域创建涟漪效果
  createRipple(event.offsetX, event.offsetY)
}

// 创建涟漪效果
const createRipple = (x, y) => {
  const ripple = document.createElement('div')
  ripple.className = 'click-ripple'
  ripple.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,182,193,0.6) 0%, transparent 70%);
    pointer-events: none;
    animation: rippleExpand 1s ease-out forwards;
  `
  
  cloudContainer.value.querySelector('.tag-cloud').appendChild(ripple)
  
  setTimeout(() => ripple.remove(), 1000)
}

// 添加选中动画
const addSelectAnimation = (tag) => {
  // 创建心形粒子效果
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createHeartParticle(tag.x, tag.y)
    }, i * 100)
  }
}

// 创建心形粒子
const createHeartParticle = (x, y) => {
  const heart = document.createElement('div')
  heart.textContent = '💖'
  heart.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    font-size: 16px;
    pointer-events: none;
    animation: heartFloat 2s ease-out forwards;
    z-index: 1000;
  `
  
  cloudContainer.value.appendChild(heart)
  setTimeout(() => heart.remove(), 2000)
}

// 移除标签
const removeTag = (tagName) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    const tag = props.tags.find(t => t.name === tagName)
    emit('tagDeselect', tag)
    emit('selectionChange', selectedTags.value)
  }
}

// 清空选择
const clearSelection = () => {
  selectedTags.value = []
  emit('selectionChange', [])
}

// 刷新云朵
const refreshCloud = async () => {
  isRefreshing.value = true
  
  // 停止当前动画
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  
  // 重新生成位置
  await new Promise(resolve => setTimeout(resolve, 500))
  generateTagPositions()
  generateParticles()
  
  // 重启动画
  rotateCloud()
  
  isRefreshing.value = false
}

// 生命周期
onMounted(() => {
  generateTagPositions()
  generateParticles()
  rotateCloud()
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<style scoped>
.tag-cloud-container {
  background: linear-gradient(135deg, var(--van-background) 0%, rgba(255,182,193,0.05) 100%);
  border-radius: var(--van-radius-lg);
  padding: 16px;
  margin: 16px;
  box-shadow: var(--van-shadow-2);
}

.cloud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.cloud-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--van-text-color);
  margin: 0;
}

.tag-cloud {
  position: relative;
  overflow: hidden;
  border-radius: var(--van-radius-md);
  background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,182,193,0.1) 100%);
  cursor: pointer;
}

.cloud-tag {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.cloud-tag:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3);
  border-color: var(--van-primary-color);
}

.tag-selected {
  background: linear-gradient(135deg, var(--van-primary-color), #FF69B4) !important;
  color: white;
  border-color: var(--van-primary-color);
  animation: selectedPulse 2s ease-in-out infinite;
}

.tag-hot {
  border-color: #FF6B35;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 182, 193, 0.1));
}

.tag-new {
  border-color: #4ECDC4;
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(255, 182, 193, 0.1));
}

.tag-emoji {
  font-size: 16px;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
}

.tag-count {
  font-size: 12px;
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
}

.hot-flame {
  position: absolute;
  top: -8px;
  right: -8px;
}

.flame {
  position: absolute;
  font-size: 12px;
  animation: flameFlicker 1s ease-in-out infinite alternate;
}

.flame-1 {
  animation-delay: 0s;
}

.flame-2 {
  animation-delay: 0.5s;
  left: 8px;
}

.new-sparkle {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 10px;
  animation: sparkleGlow 2s ease-in-out infinite;
}

.particle-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
}

.selected-tags {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 182, 193, 0.1);
  border-radius: var(--van-radius-md);
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selected-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--van-text-color);
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-tag {
  transition: all var(--van-duration-fast) var(--van-ease-out);
}

.selected-tag:hover {
  transform: scale(1.05);
}

.tag-stats {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--van-radius-md);
  overflow: hidden;
}

.stat-item {
  text-align: center;
  padding: 12px;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--van-primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--van-text-color-2);
}

/* 动画定义 */
@keyframes selectedPulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(255, 182, 193, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(255, 182, 193, 0.6); }
}

@keyframes flameFlicker {
  0% { transform: scale(1) rotate(-2deg); }
  100% { transform: scale(1.1) rotate(2deg); }
}

@keyframes sparkleGlow {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
}

@keyframes particleFloat {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-20px) rotate(360deg); }
}

@keyframes rippleExpand {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 100px; height: 100px; margin: -50px 0 0 -50px; opacity: 0; }
}

@keyframes heartFloat {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-cloud-container {
    margin: 8px;
    padding: 12px;
  }
  
  .cloud-tag {
    padding: 4px 8px;
  }
  
  .tag-name {
    font-size: 12px;
  }
  
  .tag-emoji {
    font-size: 14px;
  }
}
</style>