<template>
  <div
    class="emoji-rain-container"
    :class="{ 'rain-active': isActive, 'standalone': isStandalone }"
    ref="rainContainer"
  >
    <!-- 独立页面欢迎信息 -->
    <div v-if="isStandalone" class="welcome-message">
      <h1 class="welcome-title">表情雨 🌧️</h1>
      <p class="welcome-subtitle">点击开始按钮，享受可爱的表情雨吧！</p>
    </div>

    <!-- 表情雨粒子 -->
    <div
      v-for="emoji in activeEmojis"
      :key="emoji.id"
      class="emoji-particle"
      :class="emoji.className"
      :style="emoji.style"
      @animationend="removeEmoji(emoji.id)"
    >
      {{ emoji.content }}
    </div>
    
    <!-- 控制面板 -->
    <div v-if="showControls" class="rain-controls">
      <div class="button-group">
        <van-button
          size="mini"
          :type="isActive ? 'danger' : 'primary'"
          @click="toggleRain"
        >
          {{ isActive ? '停止' : '开始' }}
        </van-button>
        <van-button size="mini" @click="showSettings = true">
          设置
        </van-button>
      </div>
    </div>
    
    <!-- 设置弹窗 -->
    <van-popup 
      v-model:show="showSettings" 
      position="bottom" 
      :style="{ height: '60%' }"
    >
      <div class="settings-panel">
        <div class="settings-header">
          <h3>表情雨设置</h3>
          <van-button type="primary" size="mini" @click="showSettings = false">
            完成
          </van-button>
        </div>
        
        <van-cell-group inset>
          <!-- 强度设置 -->
          <van-cell title="雨量强度">
            <template #right-icon>
              <van-slider
                v-model="settings.intensity"
                :min="1"
                :max="10"
                :step="1"
                style="width: 100px;"
                @change="updateSettings"
              />
            </template>
          </van-cell>
          
          <!-- 速度设置 -->
          <van-cell title="下落速度">
            <template #right-icon>
              <van-slider
                v-model="settings.speed"
                :min="1"
                :max="5"
                :step="0.5"
                style="width: 100px;"
                @change="updateSettings"
              />
            </template>
          </van-cell>
          
          <!-- 表情类型选择 -->
          <van-cell title="表情类型" is-link @click="showEmojiPicker = true">
            <template #right-icon>
              <span class="current-emojis">
                {{ selectedEmojiTypes.slice(0, 3).join(' ') }}
                <span v-if="selectedEmojiTypes.length > 3">...</span>
              </span>
            </template>
          </van-cell>
          
          <!-- 特效开关 -->
          <van-cell title="粒子特效">
            <template #right-icon>
              <van-switch v-model="settings.particles" @change="updateSettings" />
            </template>
          </van-cell>
          
          <!-- 音效开关 -->
          <van-cell title="音效">
            <template #right-icon>
              <van-switch v-model="settings.sound" @change="updateSettings" />
            </template>
          </van-cell>
        </van-cell-group>
        
        <!-- 预设方案 -->
        <div class="preset-schemes">
          <h4>预设方案</h4>
          <van-grid :column-num="2" :border="false">
            <van-grid-item
              v-for="preset in presetSchemes"
              :key="preset.name"
              :text="preset.name"
              @click="applyPreset(preset)"
            >
              <template #icon>
                <div class="preset-icon">{{ preset.icon }}</div>
              </template>
            </van-grid-item>
          </van-grid>
        </div>
      </div>
    </van-popup>
    
    <!-- 表情选择器 -->
    <van-popup 
      v-model:show="showEmojiPicker" 
      position="bottom" 
      :style="{ height: '50%' }"
    >
      <div class="emoji-picker">
        <div class="picker-header">
          <h3>选择表情</h3>
          <van-button type="primary" size="mini" @click="showEmojiPicker = false">
            确定
          </van-button>
        </div>
        
        <van-tabs v-model:active="activeEmojiTab">
          <van-tab 
            v-for="category in emojiCategories"
            :key="category.name"
            :title="category.name"
          >
            <div class="emoji-grid">
              <div
                v-for="emoji in category.emojis"
                :key="emoji"
                class="emoji-item"
                :class="{ 'emoji-selected': selectedEmojiTypes.includes(emoji) }"
                @click="toggleEmoji(emoji)"
              >
                {{ emoji }}
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  autoStart: {
    type: Boolean,
    default: false
  },
  showControls: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 0 // 0表示无限循环
  },
  trigger: {
    type: String,
    default: 'manual' // manual, click, hover, scroll
  }
})

// 检测是否作为独立页面使用
const isStandalone = computed(() => {
  return props.showControls && props.trigger === 'manual'
})

const emit = defineEmits(['start', 'stop', 'complete'])

const rainContainer = ref(null)
const isActive = ref(false)
const showSettings = ref(false)
const showEmojiPicker = ref(false)
const activeEmojiTab = ref(0)
const activeEmojis = ref([])
const emojiId = ref(0)
const rainTimer = ref(null)
const durationTimer = ref(null)

// 获取容器尺寸
const { width: containerWidth, height: containerHeight } = useElementSize(rainContainer)

// 设置
const settings = ref({
  intensity: 5, // 1-10
  speed: 2.5, // 1-5
  particles: true,
  sound: false
})

// 选中的表情类型
const selectedEmojiTypes = ref(['💖', '🌸', '✨', '🦋', '💕'])

// 表情分类
const emojiCategories = [
  {
    name: '爱心',
    emojis: ['💖', '💕', '💗', '💝', '💘', '💞', '💓', '💟', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤']
  },
  {
    name: '花朵',
    emojis: ['🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌿', '🍀', '🌱', '🌳', '🌲', '🎋', '🎍']
  },
  {
    name: '星空',
    emojis: ['✨', '⭐', '🌟', '💫', '⚡', '🔥', '🎆', '🎇', '🌠', '🌙', '☀️', '🌈', '☁️', '⛅']
  },
  {
    name: '动物',
    emojis: ['🦋', '🐝', '🐞', '🦄', '🐰', '🐱', '🐶', '🐼', '🐨', '🐯', '🦊', '🐸', '🐙', '🐠']
  },
  {
    name: '食物',
    emojis: ['🍰', '🧁', '🍪', '🍭', '🍬', '🍯', '🍓', '🍒', '🍑', '🥝', '🍇', '🍉', '🍊', '🍋']
  },
  {
    name: '表情',
    emojis: ['😊', '😍', '🥰', '😘', '😋', '😎', '🤗', '🥳', '😇', '🤩', '😴', '🤤', '😌', '😉']
  }
]

// 预设方案
const presetSchemes = [
  {
    name: '浪漫爱心',
    icon: '💖',
    settings: { intensity: 7, speed: 2, particles: true, sound: true },
    emojis: ['💖', '💕', '💗', '💝', '💘']
  },
  {
    name: '樱花飞舞',
    icon: '🌸',
    settings: { intensity: 8, speed: 1.5, particles: true, sound: false },
    emojis: ['🌸', '🌺', '🌼', '🌿', '🍀']
  },
  {
    name: '星光闪烁',
    icon: '✨',
    settings: { intensity: 6, speed: 3, particles: true, sound: false },
    emojis: ['✨', '⭐', '🌟', '💫', '🌠']
  },
  {
    name: '蝴蝶飞舞',
    icon: '🦋',
    settings: { intensity: 4, speed: 1, particles: false, sound: false },
    emojis: ['🦋', '🐝', '🐞', '🌸', '🌿']
  }
]

// 计算雨滴生成间隔
const dropInterval = computed(() => {
  return Math.max(50, 500 - settings.value.intensity * 45)
})

// 计算下落持续时间
const fallDuration = computed(() => {
  return Math.max(2, 6 - settings.value.speed)
})

// 开始表情雨
const startRain = () => {
  if (isActive.value) return
  
  isActive.value = true
  emit('start')
  
  // 开始生成表情
  rainTimer.value = setInterval(createEmoji, dropInterval.value)
  
  // 设置持续时间
  if (props.duration > 0) {
    durationTimer.value = setTimeout(() => {
      stopRain()
      emit('complete')
    }, props.duration)
  }
  
  // 播放音效
  if (settings.value.sound) {
    playSound('start')
  }
}

// 停止表情雨
const stopRain = () => {
  if (!isActive.value) return
  
  isActive.value = false
  emit('stop')
  
  // 清除定时器
  if (rainTimer.value) {
    clearInterval(rainTimer.value)
    rainTimer.value = null
  }
  
  if (durationTimer.value) {
    clearTimeout(durationTimer.value)
    durationTimer.value = null
  }
  
  // 播放音效
  if (settings.value.sound) {
    playSound('stop')
  }
}

// 切换表情雨状态
const toggleRain = () => {
  if (isActive.value) {
    stopRain()
  } else {
    startRain()
  }
}

// 创建表情粒子
const createEmoji = () => {
  if (!rainContainer.value || selectedEmojiTypes.value.length === 0) return
  
  const emoji = {
    id: emojiId.value++,
    content: selectedEmojiTypes.value[Math.floor(Math.random() * selectedEmojiTypes.value.length)],
    className: getRandomClassName(),
    style: generateEmojiStyle()
  }
  
  activeEmojis.value.push(emoji)
  
  // 限制最大粒子数量
  if (activeEmojis.value.length > 100) {
    activeEmojis.value.shift()
  }
}

// 生成表情样式
const generateEmojiStyle = () => {
  const startX = Math.random() * (containerWidth.value || 400)
  const endX = startX + (Math.random() - 0.5) * 100
  const rotation = Math.random() * 360
  const scale = Math.random() * 0.5 + 0.5
  const duration = fallDuration.value + Math.random() * 2
  
  return {
    left: startX + 'px',
    fontSize: Math.random() * 20 + 20 + 'px',
    animationDuration: duration + 's',
    animationDelay: Math.random() * 0.5 + 's',
    transform: `rotate(${rotation}deg) scale(${scale})`,
    '--end-x': endX + 'px',
    '--rotation': rotation + 360 + 'deg'
  }
}

// 获取随机动画类名
const getRandomClassName = () => {
  const classes = ['fall-straight', 'fall-curve', 'fall-spiral', 'fall-zigzag']
  return classes[Math.floor(Math.random() * classes.length)]
}

// 移除表情
const removeEmoji = (id) => {
  const index = activeEmojis.value.findIndex(emoji => emoji.id === id)
  if (index > -1) {
    activeEmojis.value.splice(index, 1)
  }
}

// 切换表情选择
const toggleEmoji = (emoji) => {
  const index = selectedEmojiTypes.value.indexOf(emoji)
  if (index > -1) {
    selectedEmojiTypes.value.splice(index, 1)
  } else {
    selectedEmojiTypes.value.push(emoji)
  }
}

// 应用预设方案
const applyPreset = (preset) => {
  settings.value = { ...preset.settings }
  selectedEmojiTypes.value = [...preset.emojis]
  showSettings.value = false
  
  // 如果正在运行，重启以应用新设置
  if (isActive.value) {
    stopRain()
    nextTick(() => startRain())
  }
}

// 更新设置
const updateSettings = () => {
  // 如果正在运行，重启以应用新设置
  if (isActive.value) {
    stopRain()
    nextTick(() => startRain())
  }
}

// 播放音效
const playSound = (type) => {
  // 这里可以添加实际的音效播放逻辑
  console.log(`播放音效: ${type}`)
}

// 暴露方法给父组件
defineExpose({
  start: startRain,
  stop: stopRain,
  toggle: toggleRain,
  isActive: () => isActive.value
})

// 生命周期
onMounted(() => {
  if (props.autoStart) {
    startRain()
  }
  
  // 根据触发方式添加事件监听
  if (props.trigger === 'click') {
    rainContainer.value?.addEventListener('click', toggleRain)
  } else if (props.trigger === 'hover') {
    rainContainer.value?.addEventListener('mouseenter', startRain)
    rainContainer.value?.addEventListener('mouseleave', stopRain)
  }
})

onUnmounted(() => {
  stopRain()

  // 清理事件监听
  if (props.trigger === 'click') {
    rainContainer.value?.removeEventListener('click', toggleRain)
  } else if (props.trigger === 'hover') {
    rainContainer.value?.removeEventListener('mouseenter', startRain)
    rainContainer.value?.removeEventListener('mouseleave', stopRain)
  }
})
</script>

<style scoped>
.emoji-rain-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

/* 独立页面样式 */
.emoji-rain-container.standalone {
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(255, 182, 193, 0.1) 0%,
    rgba(255, 192, 203, 0.1) 25%,
    rgba(255, 218, 185, 0.1) 50%,
    rgba(255, 240, 245, 0.1) 75%,
    rgba(255, 255, 255, 0.1) 100%
  );
  pointer-events: auto;
}

.emoji-rain-container.standalone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="hearts" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><text x="10" y="15" text-anchor="middle" font-size="12" fill="rgba(255,182,193,0.1)">💕</text></pattern></defs><rect width="100" height="100" fill="url(%23hearts)"/></svg>');
  opacity: 0.3;
  pointer-events: none;
}

.emoji-rain-container.standalone .rain-controls {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: var(--spacing-xl);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  max-width: 400px;
  width: 90%;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-md);
  animation: bounce 2s infinite;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.rain-active {
  pointer-events: auto;
}

.emoji-particle {
  position: absolute;
  top: -50px;
  pointer-events: none;
  user-select: none;
  z-index: 1000;
  will-change: transform;
  font-size: 24px;
}

/* 下落动画 */
.fall-straight {
  animation: fallStraight linear forwards;
}

.fall-curve {
  animation: fallCurve linear forwards;
}

.fall-spiral {
  animation: fallSpiral linear forwards;
}

.fall-zigzag {
  animation: fallZigzag linear forwards;
}

.rain-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
  pointer-events: auto;
}

.button-group {
  display: flex;
  gap: 8px;
}

.settings-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--van-border-color);
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--van-text-color);
}

.current-emojis {
  font-size: 16px;
  color: var(--van-text-color-2);
}

.preset-schemes {
  margin-top: 20px;
}

.preset-schemes h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
}

.preset-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.emoji-picker {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--van-border-color);
}

.picker-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--van-text-color);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 15px 0;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 24px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  user-select: none;
}

.emoji-item:hover {
  background: var(--van-gray-2);
  transform: scale(1.1);
}

.emoji-selected {
  background: var(--van-primary-color);
  color: white;
  transform: scale(1.1);
}

.emoji-selected:hover {
  background: var(--van-primary-color);
}

/* 动画定义 */
@keyframes fallStraight {
  0% {
    transform: translateY(-50px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) rotate(var(--rotation));
    opacity: 0;
  }
}

@keyframes fallCurve {
  0% {
    transform: translateY(-50px) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateY(50vh) translateX(var(--end-x)) rotate(180deg);
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) translateX(var(--end-x)) rotate(var(--rotation));
    opacity: 0;
  }
}

@keyframes fallSpiral {
  0% {
    transform: translateY(-50px) rotate(0deg) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  25% {
    transform: translateY(25vh) rotate(90deg) scale(1.2);
  }
  50% {
    transform: translateY(50vh) rotate(180deg) scale(0.8);
  }
  75% {
    transform: translateY(75vh) rotate(270deg) scale(1.1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) rotate(var(--rotation)) scale(0.5);
    opacity: 0;
  }
}

@keyframes fallZigzag {
  0% {
    transform: translateY(-50px) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  20% {
    transform: translateY(20vh) translateX(20px) rotate(45deg);
  }
  40% {
    transform: translateY(40vh) translateX(-20px) rotate(-45deg);
  }
  60% {
    transform: translateY(60vh) translateX(15px) rotate(30deg);
  }
  80% {
    transform: translateY(80vh) translateX(-15px) rotate(-30deg);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) translateX(0) rotate(var(--rotation));
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rain-controls {
    top: 10px;
    right: 10px;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
  
  .emoji-item {
    width: 35px;
    height: 35px;
    font-size: 20px;
  }
  
  .settings-panel,
  .emoji-picker {
    padding: 15px;
  }
}

/* 性能优化 */
.emoji-particle {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 暗色主题适配 */
[data-theme="dark"] .settings-panel,
[data-theme="dark"] .emoji-picker {
  background: var(--van-background-2);
}

[data-theme="dark"] .emoji-item:hover {
  background: var(--van-gray-7);
}
</style>

