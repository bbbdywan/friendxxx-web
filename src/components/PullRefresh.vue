<template>
  <div class="pull-refresh-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <div class="pull-refresh" :style="{ transform: `translateY(${pullDistance}px)` }">
      <div class="refresh-content" v-if="pullDistance > 0">
        <div class="refresh-icon" :class="{ spinning: isRefreshing }">
          {{ isRefreshing ? '☁️' : '💫' }}
        </div>
        <span class="refresh-text">
          {{ refreshText }}
        </span>
      </div>
    </div>
    <div class="content" :style="{ transform: `translateY(${pullDistance}px)` }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['refresh'])

const pullDistance = ref(0)
const isRefreshing = ref(false)
const startY = ref(0)
const threshold = 60

const refreshText = computed(() => {
  if (isRefreshing.value) return '刷新中...'
  if (pullDistance.value >= threshold) return '松开刷新'
  return '下拉刷新'
})

const handleTouchStart = (e) => {
  if (window.scrollY === 0) {
    startY.value = e.touches[0].clientY
  }
}

const handleTouchMove = (e) => {
  if (window.scrollY === 0 && !isRefreshing.value) {
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY.value) * 0.5)
    pullDistance.value = Math.min(distance, 100)
  }
}

const handleTouchEnd = () => {
  if (pullDistance.value >= threshold && !isRefreshing.value) {
    isRefreshing.value = true
    emit('refresh')
    
    setTimeout(() => {
      isRefreshing.value = false
      pullDistance.value = 0
    }, 2000)
  } else {
    pullDistance.value = 0
  }
}
</script>

<style scoped>
.pull-refresh-container {
  position: relative;
  overflow: hidden;
}

.pull-refresh {
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-background);
  transition: transform 0.3s ease;
}

.refresh-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.refresh-icon {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: refreshSpin 1s linear infinite;
}

@keyframes refreshSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.content {
  transition: transform 0.3s ease;
}
</style>