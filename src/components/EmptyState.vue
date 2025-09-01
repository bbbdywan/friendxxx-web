<template>
  <div class="empty-state">
    <div class="empty-illustration">{{ illustration }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <button v-if="actionText" class="btn btn-primary" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  illustration: {
    type: String,
    default: '🐱‍👤'
  },
  title: {
    type: String,
    default: '暂时没有内容'
  },
  description: {
    type: String,
    default: '快去寻找你的甜心吧~'
  },
  actionText: {
    type: String,
    default: ''
  }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-illustration {
  font-size: 80px;
  margin-bottom: var(--spacing-lg);
  animation: emptyFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}

@keyframes emptyFloat {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg);
  }
  33% { 
    transform: translateY(-8px) rotate(1deg);
  }
  66% { 
    transform: translateY(-4px) rotate(-1deg);
  }
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.empty-description {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}
</style>