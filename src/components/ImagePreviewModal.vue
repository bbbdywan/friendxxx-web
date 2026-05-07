<template>
  <teleport to="body">
    <transition name="preview-fade">
      <div v-if="show" class="preview-overlay" @click.self="close" @wheel.prevent>
        <!-- 计数器 -->
        <div v-if="images.length > 1" class="preview-counter">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>

        <!-- 关闭按钮 -->
        <button class="preview-close" @click="close">×</button>

        <!-- 左箭头 -->
        <button
          v-if="images.length > 1"
          class="preview-arrow preview-arrow-left"
          :class="{ disabled: currentIndex === 0 }"
          @click.stop="prev"
        >‹</button>

        <!-- 图片 -->
        <img
          :src="images[currentIndex]"
          class="preview-image"
          draggable="false"
          @click.stop="handleImageClick"
          @mousedown="onDragStart"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        />

        <!-- 右箭头 -->
        <button
          v-if="images.length > 1"
          class="preview-arrow preview-arrow-right"
          :class="{ disabled: currentIndex === images.length - 1 }"
          @click.stop="next"
        >›</button>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  images: { type: Array, default: () => [] },
  startPosition: { type: Number, default: 0 }
})

const emit = defineEmits(['update:show'])

const currentIndex = ref(0)

watch(() => props.show, (val) => {
  if (val) currentIndex.value = props.startPosition
})

watch(() => props.startPosition, (val) => {
  currentIndex.value = val
})

const close = () => emit('update:show', false)

const prev = () => { if (currentIndex.value > 0) currentIndex.value-- }
const next = () => { if (currentIndex.value < props.images.length - 1) currentIndex.value++ }

// 鼠标拖拽滑动
let dragStartX = 0
let isDragging = false

const onDragStart = (e) => {
  dragStartX = e.clientX
  isDragging = false

  const onMove = (e) => {
    if (Math.abs(e.clientX - dragStartX) > 5) isDragging = true
  }
  const onUp = (e) => {
    const delta = e.clientX - dragStartX
    if (Math.abs(delta) > 50) {
      delta < 0 ? next() : prev()
    }
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const handleImageClick = () => {
  if (!isDragging) close()
}

// 触摸滑动
let touchStartX = 0

const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
}

const onTouchEnd = (e) => {
  const delta = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(delta) > 50) {
    delta < 0 ? next() : prev()
  }
}

// 键盘支持
const onKeyDown = (e) => {
  if (!props.show) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-image {
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  object-fit: contain;
  cursor: grab;
  user-select: none;
}

.preview-image:active {
  cursor: grabbing;
}

.preview-close {
  position: fixed;
  top: 16px;
  right: 20px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  font-size: 28px;
  line-height: 1;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10000;
}

.preview-close:hover {
  background: rgba(255,255,255,0.3);
}

.preview-counter {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  z-index: 10000;
}

.preview-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  font-size: 36px;
  width: 48px;
  height: 64px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10000;
  line-height: 1;
}

.preview-arrow:hover {
  background: rgba(255,255,255,0.3);
}

.preview-arrow.disabled {
  opacity: 0.2;
  cursor: default;
  pointer-events: none;
}

.preview-arrow-left { left: 16px; }
.preview-arrow-right { right: 16px; }

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
