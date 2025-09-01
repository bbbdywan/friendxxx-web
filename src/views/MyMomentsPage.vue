<template>
  <div class="my-moments-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <van-icon name="arrow-left" @click="$router.back()" />
      <h1>我的动态</h1>
      <div></div>
    </div>

    <!-- 动态列表 -->
    <div class="moments-list">
      <van-loading v-if="loading" type="spinner" size="24">加载中...</van-loading>
      
      <div v-else-if="moments.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>还没有发布动态</p>
        <van-button type="primary" size="small" @click="$router.push('/post')">
          发布第一条动态
        </van-button>
      </div>

      <div v-else>
        <div v-for="moment in moments" :key="moment.id" class="moment-item">
          <div class="moment-header">
            <div class="user-info">
              <van-image :src="moment.avatarUrl" round width="40" height="40" />
              <div class="user-details">
                <h4>{{ moment.nickname }}</h4>
                <span class="time">{{ formatTime(moment.createTime) }}</span>
              </div>
            </div>
            <van-icon name="delete-o" @click="deleteMoment(moment.id)" />
          </div>

          <div class="moment-content">
            <p>{{ moment.content }}</p>
            <div v-if="moment.imageList.length > 0" class="moment-images">
              <van-image
                v-for="(image, index) in moment.imageList"
                :key="index"
                :src="image"
                fit="cover"
              />
            </div>
          </div>

          <!-- 删除动态统计区域 -->
          <!--
          <div class="moment-stats">
            <span>{{ moment.likeCount }} 赞</span>
          </div>
          -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'
import { useUserStore } from '../stores/user.js'
import { getuserup, deleteMoment as deleteMomentApi } from '../api/post.js'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const moments = ref([])

// 获取用户动态
const fetchUserMoments = async () => {
  try {
    loading.value = true
    const userId = userStore.userInfo?.id
    
    if (!userId) {
      showToast('用户信息错误')
      return
    }

    const response = await getuserup(Number(userId))
    console.log('用户动态响应:', response)

    if (response.code === 200 || response.code === 0) {
      moments.value = response.data || []
    } else {
      showToast(response.message || '获取动态失败')
    }
  } catch (error) {
    console.error('获取用户动态失败:', error)
    showToast('获取动态失败')
  } finally {
    loading.value = false
  }
}

// 删除动态
const deleteMoment = async (momentId) => {
  try {
    await showConfirmDialog({
      title: '删除动态',
      message: '确定要删除这条动态吗？',
      confirmButtonText: '删除',
      confirmButtonColor: '#ff4757'
    })

    const response = await deleteMomentApi(momentId)
    
    if (response.code === 200 || response.code === 0) {
      showToast('删除成功')
      // 从列表中移除
      moments.value = moments.value.filter(moment => moment.id !== momentId)
    } else {
      showToast(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      showToast('删除失败')
    }
  }
}

// 预览图片
const previewImages = (images, startIndex = 0) => {
  showImagePreview({
    images,
    startPosition: startIndex
  })
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

onMounted(() => {
  fetchUserMoments()
})
</script>

<style scoped>
.my-moments-page {
  min-height: 100vh;
  background: var(--cream-white);
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.moments-list {
  padding: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.moment-item {
  background: white;
  border-radius: 12px;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.moment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-details h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.moment-content p {
  margin: var(--spacing-sm) 0;
  line-height: 1.5;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: var(--spacing-sm);
}

.moment-images .van-image {
  width: 100%;
  height: 80px;
  border-radius: 8px;
}

.moment-stats {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

