<template>
  <div class="user-card card card-enter">
    <div class="avatar-container">
      <img 
        :src="user.avatar" 
        :alt="user.name"
        class="avatar"
        :class="{ 'avatar-online': user.isOnline }"
        @load="imageLoaded = true"
        v-show="imageLoaded"
      />
      <div v-show="!imageLoaded" class="avatar-skeleton skeleton-cloud"></div>
    </div>
    
    <div class="user-info">
      <h3 class="user-name">{{ user.name }}</h3>
      <p class="user-age">{{ user.age }}岁</p>
      
      <div class="user-tags">
        <span 
          v-for="tag in user.tags" 
          :key="tag"
          class="tag"
          :class="`tag-${getTagColor(tag)}`"
        >
          {{ tag }}
        </span>
      </div>
      
      <div class="user-actions">
        <button class="btn btn-icon btn-secondary">
          💬
        </button>
        <button 
          class="btn btn-primary like-btn"
          :class="{ liked: isLiked }"
          @click="handleLike"
          ref="likeButton"
        >
          {{ isLiked ? '💖' : '🤍' }} {{ isLiked ? '已喜欢' : '喜欢' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  user: {
    type: Object,
    required: true
  }
})

const imageLoaded = ref(false)
const isLiked = ref(false)
const likeButton = ref(null)

const getTagColor = (tag) => {
  const colors = ['pink', 'blue', 'mint']
  return colors[Math.floor(Math.random() * colors.length)]
}

const handleLike = (event) => {
  isLiked.value = !isLiked.value
  
  if (isLiked.value) {
    // 创建涟漪效果
    createRipple(event)
    
    // 创建粒子特效
    createParticles(event)
  }
}

const createRipple = (event) => {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  const ripple = document.createElement('div')
  
  ripple.classList.add('ripple')
  ripple.style.left = (event.clientX - rect.left - 25) + 'px'
  ripple.style.top = (event.clientY - rect.top - 25) + 'px'
  ripple.style.width = '50px'
  ripple.style.height = '50px'
  
  button.appendChild(ripple)
  
  setTimeout(() => {
    ripple.remove()
  }, 600)
}

const createParticles = (event) => {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  const particleCount = Math.floor(Math.random() * 4) + 5 // 5-8个粒子
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.classList.add('particle')
    particle.textContent = '💖'
    
    const angle = (Math.PI * 2 * i) / particleCount
    const distance = 50 + Math.random() * 30
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    
    particle.style.setProperty('--dx', dx + 'px')
    particle.style.setProperty('--dy', dy + 'px')
    particle.style.left = (event.clientX - rect.left) + 'px'
    particle.style.top = (event.clientY - rect.top) + 'px'
    
    button.appendChild(particle)
    
    setTimeout(() => {
      particle.remove()
    }, 1000)
  }
}
</script>

<style scoped>
.user-card {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-avatar);
  object-fit: cover;
  border: 3px solid var(--color-surface);
  box-shadow: var(--shadow-card);
  filter: brightness(105%);
  transition: all 0.3s ease;
}

.avatar-skeleton {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-avatar);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.user-age {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.user-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.user-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.user-actions .btn {
  flex: 1;
}

.user-actions .btn-icon {
  flex: 0 0 44px;
}

.like-btn {
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
}

.like-btn.liked {
  background: linear-gradient(135deg, var(--accent-rose), #FF1493);
  transform: scale(1.05);
}
</style>
