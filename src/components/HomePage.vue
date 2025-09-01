<template>
  <div class="home-page">
    <PullRefresh @refresh="handleRefresh">
      <!-- 顶部导航 -->
      <nav class="navbar card-enter">
        <div class="nav-brand">
          <div class="logo">💕</div>
          <h1 class="brand-name">甜心交友</h1>
        </div>
        <div class="nav-actions">
          <button class="btn btn-secondary">登录</button>
          <button class="btn btn-primary">注册</button>
        </div>
      </nav>

      <!-- 主要内容区域 -->
      <main class="main-content">
        <!-- 欢迎卡片 -->
        <div class="welcome-card card card-enter">
          <div class="welcome-content">
            <h2 class="welcome-title">找到你的专属甜心 🧸</h2>
            <p class="welcome-subtitle">在这里遇见最温暖的ta，开启甜蜜的恋爱故事</p>
            <div class="welcome-actions">
              <button class="btn btn-primary btn-large">开始寻找</button>
              <button class="btn btn-secondary btn-large">了解更多</button>
            </div>
          </div>
          <div class="welcome-illustration">
            <div class="cute-mascot">🐰💖</div>
          </div>
        </div>

        <!-- 用户卡片示例 -->
        <div class="users-section">
          <h2 class="section-title">推荐用户</h2>
          <UserCard 
            v-for="(user, index) in sampleUsers" 
            :key="user.id"
            :user="user"
            :style="{ animationDelay: `${index * 0.1}s` }"
          />
          
          <!-- 空状态示例 -->
          <EmptyState 
            v-if="sampleUsers.length === 0"
            illustration="🐱‍💻"
            title="还没有推荐用户"
            description="系统正在为你寻找最合适的甜心~"
            action-text="刷新一下"
            @action="handleRefresh"
          />
        </div>

        <!-- 功能卡片网格 -->
        <div class="feature-grid">
          <div class="feature-card card card-enter">
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">智能匹配</h3>
            <p class="feature-desc">基于兴趣爱好和性格特征，为你推荐最合适的人</p>
          </div>
          
          <div class="feature-card card card-enter">
            <div class="feature-icon">💬</div>
            <h3 class="feature-title">甜蜜聊天</h3>
            <p class="feature-desc">可爱的表情包和贴纸，让聊天更有趣</p>
          </div>
          
          <div class="feature-card card card-enter">
            <div class="feature-icon">🎁</div>
            <h3 class="feature-title">虚拟礼物</h3>
            <p class="feature-desc">送出毛绒玩具和小礼物，表达你的心意</p>
          </div>
        </div>
      </main>

      <!-- 底部导航 -->
      <TabBar />
    </PullRefresh>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserCard from './UserCard.vue'
import TabBar from './TabBar.vue'
import EmptyState from './EmptyState.vue'
import PullRefresh from './PullRefresh.vue'

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

const handleRefresh = () => {
  console.log('刷新数据...')
  // 这里可以添加实际的数据刷新逻辑
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding-bottom: 80px; /* 为底部导航留空间 */
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-card);
  margin-bottom: var(--spacing-xl);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logo {
  font-size: 32px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.brand-name {
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-actions {
  display: flex;
  gap: var(--spacing-md);
}

.welcome-card {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-xl);
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.welcome-subtitle {
  font-size: 18px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.welcome-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
}

.welcome-illustration {
  display: flex;
  justify-content: center;
  align-items: center;
}

.cute-mascot {
  font-size: 80px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.users-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  text-align: center;
  padding: var(--spacing-xl);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-lg);
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.feature-desc {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .welcome-card {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .welcome-title {
    font-size: 28px;
  }
  
  .welcome-actions {
    flex-direction: column;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>

