<template>
  <div class="profile-page" :data-theme="finalTheme">
    <!-- 主题切换器 -->
    <div class="theme-switcher">
      <button 
        v-for="theme in themes" 
        :key="theme.value"
        class="theme-btn"
        :class="{ active: currentTheme === theme.value }"
        @click="setTheme(theme.value)"
        ref="themeBtns"
      >
        {{ theme.icon }}
      </button>
    </div>

    <!-- 3D卡片堆叠 -->
    <div class="card-stack-section">
      <h2 class="section-title">发现新朋友</h2>
      <CardStack 
        :cards="profileCards"
        @like="handleLike"
        @reject="handleReject"
        @empty="handleEmpty"
      />
    </div>

    <!-- 情绪化按钮示例 -->
    <div class="emotion-buttons">
      <button 
        class="btn btn-primary emotion-btn"
        ref="successBtn"
        @click="handleSuccess"
      >
        成功操作
      </button>
      
      <button 
        class="btn btn-secondary emotion-btn"
        ref="errorBtn"
        @click="handleError"
      >
        错误操作
      </button>
      
      <button 
        class="btn btn-accent emotion-btn"
        ref="easterEggBtn"
      >
        长按我试试
      </button>
    </div>

    <!-- 特殊节日提示 -->
    <div v-if="specialTheme" class="special-day-notice">
      <div class="notice-content">
        <span class="notice-icon">{{ getSpecialIcon() }}</span>
        <span class="notice-text">{{ getSpecialMessage() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useEmotionalFeedback } from '../composables/useEmotionalFeedback'
import CardStack from './CardStack.vue'

const { currentTheme, finalTheme, setTheme, getSpecialTheme } = useTheme()
const { shake, bounce, handleLongPress, showError, showSuccess } = useEmotionalFeedback()

const successBtn = ref(null)
const errorBtn = ref(null)
const easterEggBtn = ref(null)
const themeBtns = ref([])

const themes = [
  { value: 'auto', icon: '🌅', name: '自动' },
  { value: 'light', icon: '☀️', name: '浅色' },
  { value: 'dark', icon: '🌙', name: '深色' },
  { value: 'system', icon: '📱', name: '跟随系统' }
]

const profileCards = ref([
  {
    id: 1,
    name: '小甜心',
    age: 22,
    avatar: 'https://picsum.photos/300/400?random=1',
    tags: ['温柔', '爱笑', '喜欢猫咪']
  },
  {
    id: 2,
    name: '阳光男孩',
    age: 25,
    avatar: 'https://picsum.photos/300/400?random=2',
    tags: ['运动', '摄影', '旅行']
  },
  {
    id: 3,
    name: '文艺少女',
    age: 23,
    avatar: 'https://picsum.photos/300/400?random=3',
    tags: ['读书', '画画', '咖啡']
  }
])

const specialTheme = computed(() => getSpecialTheme())

const getSpecialIcon = () => {
  const theme = getSpecialTheme()
  switch (theme) {
    case 'valentine': return '💕'
    case 'christmas': return '🎄'
    case 'newyear': return '🎊'
    default: return '✨'
  }
}

const getSpecialMessage = () => {
  const theme = getSpecialTheme()
  switch (theme) {
    case 'valentine': return '情人节快乐！愿你找到真爱 💕'
    case 'christmas': return '圣诞快乐！祝你节日愉快 🎄'
    case 'newyear': return '新年快乐！新的一年新的开始 🎊'
    default: return '今天是特殊的日子 ✨'
  }
}

const handleSuccess = () => {
  showSuccess('操作成功！', successBtn.value)
}

const handleError = () => {
  showError('操作失败，请重试', errorBtn.value)
}

const handleLike = (card) => {
  console.log('喜欢:', card.name)
  showSuccess(`你喜欢了${card.name}！`, null)
}

const handleReject = (card) => {
  console.log('拒绝:', card.name)
}

const handleEmpty = () => {
  showSuccess('没有更多卡片了！', null)
}

onMounted(() => {
  // 为长按按钮添加事件监听
  if (easterEggBtn.value) {
    handleLongPress(easterEggBtn.value, () => {
      console.log('发现彩蛋！')
    })
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: var(--spacing-lg);
  background: var(--color-background);
  transition: all 0.3s ease;
}

.theme-switcher {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 8px;
  border-radius: 20px;
  box-shadow: var(--shadow-card);
}

.theme-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
}

.theme-btn:hover {
  transform: scale(1.1);
}

.theme-btn.active {
  background: var(--primary-pink);
  transform: scale(1.2);
}

.card-stack-section {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.emotion-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.emotion-btn {
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.special-day-notice {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.notice-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  box-shadow: var(--shadow-elevated);
  animation: noticeFloat 3s ease-in-out infinite;
}

@keyframes noticeFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

.notice-icon {
  font-size: 20px;
}

.notice-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-switcher {
    top: 10px;
    right: 10px;
    gap: 4px;
  }
  
  .theme-btn {
    width: 35px;
    height: 35px;
    font-size: 16px;
  }
  
  .emotion-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .emotion-btn {
    width: 200px;
  }
}
</style>