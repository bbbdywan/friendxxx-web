<template>
  <div class="example-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">组件示例用法 ✨</h1>
      <p class="page-subtitle">展示各种可爱组件的使用方法</p>
    </div>

    <!-- 表情雨示例 -->
    <div class="example-section">
      <h2 class="section-title">🌧️ 表情雨组件</h2>

      <!-- 基础用法 -->
      <div class="example-item">
        <h3>基础用法（自动开始）</h3>
        <div class="demo-area" style="height: 200px; position: relative;">
          <EmojiRain
            :auto-start="true"
            :duration="5000"
            :show-controls="true"
          />
        </div>
      </div>

      <!-- 点击触发 -->
      <div class="example-item">
        <h3>点击触发</h3>
        <div class="demo-area click-demo" @click="triggerRain" style="height: 150px; position: relative;">
          <div class="trigger-hint">点击这里触发表情雨 🎉</div>
          <EmojiRain
            ref="clickRain"
            trigger="manual"
            :show-controls="false"
          />
        </div>
      </div>
    </div>

    <!-- 用户卡片示例 -->
    <div class="example-section">
      <h2 class="section-title">💕 用户卡片组件</h2>
      <div class="card-examples">
        <UserCard
          v-for="user in sampleUsers"
          :key="user.id"
          :user="user"
          class="example-card"
        />
      </div>
    </div>

    <!-- 聊天气泡示例 -->
    <div class="example-section">
      <h2 class="section-title">💬 聊天气泡组件</h2>
      <div class="chat-examples">
        <div class="chat-demo">
          <div class="demo-message sent">
            <div class="message-bubble">你好呀！今天天气真不错 ☀️</div>
          </div>
          <div class="demo-message received">
            <div class="message-bubble">是的呢！要不要一起出去走走？🌸</div>
          </div>
          <div class="demo-message sent">
            <div class="message-bubble">好主意！我们去公园看樱花吧 🌺</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签云示例 -->
    <div class="example-section">
      <h2 class="section-title">🏷️ 标签云组件</h2>
      <div class="tags-demo">
        <span
          v-for="tag in sampleTags"
          :key="tag"
          class="demo-tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 空状态示例 -->
    <div class="example-section">
      <h2 class="section-title">🐱 空状态组件</h2>
      <EmptyState
        illustration="🎨"
        title="暂无内容"
        description="这里展示了空状态组件的使用方法"
        action-text="刷新试试"
        @action="handleRefresh"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EmojiRain from './EmojiRain.vue'
import UserCard from './UserCard.vue'
import EmptyState from './EmptyState.vue'

const clickRain = ref(null)

const sampleUsers = ref([
  {
    id: 1,
    name: '小甜心',
    age: 22,
    avatar: 'https://picsum.photos/200/200?random=1',
    isOnline: true,
    tags: ['温柔', '爱笑', '喜欢猫咪']
  },
  {
    id: 2,
    name: '阳光男孩',
    age: 25,
    avatar: 'https://picsum.photos/200/200?random=2',
    isOnline: false,
    tags: ['运动', '摄影', '旅行']
  }
])

const sampleTags = ref([
  '可爱', '温柔', '阳光', '活泼', '文艺', '运动', '音乐', '电影',
  '旅行', '美食', '摄影', '读书', '游戏', '动漫', '宠物', '花艺'
])

const triggerRain = () => {
  if (clickRain.value) {
    clickRain.value.start()
  }
}

const handleRefresh = () => {
  console.log('刷新操作')
}
</script>

<style scoped>
.example-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding: var(--spacing-lg);
  padding-bottom: 100px;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-md);
}

.page-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.example-section {
  margin-bottom: var(--spacing-xl);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border);
}

.example-item {
  margin-bottom: var(--spacing-lg);
}

.example-item h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.demo-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-card);
  background: rgba(255, 182, 193, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.click-demo {
  cursor: pointer;
  transition: all 0.3s ease;
}

.click-demo:hover {
  border-color: var(--primary-pink);
  background: rgba(255, 182, 193, 0.1);
}

.trigger-hint {
  font-size: 16px;
  color: var(--color-text-secondary);
  text-align: center;
  user-select: none;
}

.card-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.example-card {
  animation: slideInUp 0.6s ease;
}

.chat-examples {
  max-width: 600px;
  margin: 0 auto;
}

.chat-demo {
  padding: var(--spacing-lg);
  background: #f8f9fa;
  border-radius: var(--radius-card);
  max-height: 300px;
  overflow-y: auto;
}

.demo-message {
  margin-bottom: var(--spacing-md);
  display: flex;
}

.demo-message.sent {
  justify-content: flex-end;
}

.demo-message.received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: var(--spacing-md);
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  animation: fadeInUp 0.6s ease;
}

.demo-message.sent .message-bubble {
  background: var(--primary-pink);
  color: white;
  border-bottom-right-radius: 6px;
}

.demo-message.received .message-bubble {
  background: white;
  color: var(--color-text);
  border-bottom-left-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tags-demo {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.demo-tag {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  animation: bounceIn 0.6s ease;
  cursor: pointer;
  transition: all 0.3s ease;
}

.demo-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .example-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 24px;
  }

  .card-examples {
    grid-template-columns: 1fr;
  }
}
</style>