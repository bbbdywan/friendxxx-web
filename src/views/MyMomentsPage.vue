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
            <div v-if="moment.imageList && moment.imageList.length > 0" class="moment-images">
              <van-image
                v-for="(image, index) in moment.imageList"
                :key="index"
                :src="image"
                fit="cover"
              />
            </div>
          </div>

          <!-- 点赞/评论操作栏 -->
          <div class="moment-actions">
            <button
              class="action-btn like-btn"
              :class="{ liked: moment.liked }"
              @click="toggleLike(moment)"
            >
              <van-icon :name="moment.liked ? 'good-job' : 'good-job-o'" size="18" />
              <span>{{ moment.likeCount || 0 }}</span>
            </button>
            <button class="action-btn comment-btn" @click="openComment(moment)">
              <van-icon name="chat-o" size="18" />
              <span>{{ moment.commentCount || 0 }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <van-popup
      v-model:show="showComment"
      position="bottom"
      :style="{ height: '70%', borderRadius: '16px 16px 0 0' }"
    >
      <div class="comment-popup">
        <div class="comment-header">
          <span>评论 {{ currentMoment?.commentCount || 0 }}</span>
          <van-icon name="cross" @click="showComment = false" />
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div v-if="commentsLoading" class="comments-loading">
            <van-loading type="spinner" size="20" />
          </div>
          <div v-else-if="commentsList.length === 0" class="comments-empty">
            暂无评论，快来抢沙发
          </div>
          <div v-else>
            <div v-for="(c, i) in commentsList" :key="i" class="comment-item">
              <van-image
                :src="c.avatarUrl || 'https://picsum.photos/200/200?random=' + c.userId"
                round width="32" height="32" fit="cover"
              />
              <div class="comment-body">
                <div class="comment-nickname">{{ c.nickname || '用户' }}</div>
                <div class="comment-content">{{ c.content }}</div>
                <div class="comment-time">{{ c.createTime ? formatTime(new Date(c.createTime)) : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="comment-input-area">
          <van-field
            v-model="commentText"
            type="textarea"
            placeholder="说点什么..."
            rows="2"
            autosize
            maxlength="200"
            show-word-limit
          />
        </div>
        <div class="comment-footer">
          <van-button
            type="primary"
            round
            size="small"
            :loading="commentLoading"
            @click="submitComment"
          >
            发送
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'
import { useUserStore } from '../stores/user.js'
import { getuserup, deleteMoment as deleteMomentApi, likesPost, commentPost, getComments } from '../api/post.js'
import { getUserProfile } from '../api/user.js'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const moments = ref([])

// 评论相关
const showComment = ref(false)
const currentMoment = ref(null)
const commentText = ref('')
const commentLoading = ref(false)
const commentsList = ref([])
const commentsLoading = ref(false)

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

    if (response.code === 200 || response.code === 0) {
      moments.value = (response.data || []).map(m => ({
        ...m,
        liked: false
      }))
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

// 点赞 / 取消点赞
const toggleLike = async (moment) => {
  const userId = userStore.userInfo?.id
  if (!userId) return showToast('请先登录')
  const newLiked = !moment.liked
  moment.liked = newLiked
  moment.likeCount = Math.max(0, (moment.likeCount || 0) + (newLiked ? 1 : -1))
  try {
    // likesId=0 点赞，likesId=1 取消点赞
    await likesPost(moment.id, userId, newLiked ? 0 : 1)
  } catch (e) {
    moment.liked = !newLiked
    moment.likeCount = Math.max(0, (moment.likeCount || 0) + (newLiked ? -1 : 1))
    showToast('操作失败')
  }
}

// 打开评论弹窗
const openComment = async (moment) => {
  currentMoment.value = moment
  commentText.value = ''
  commentsList.value = []
  showComment.value = true
  try {
    commentsLoading.value = true
    const res = await getComments(moment.id)
    if (res.code === 200 || res.code === 0) {
      commentsList.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.error('获取评论失败:', e)
  } finally {
    commentsLoading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) return showToast('请输入评论内容')
  const userId = userStore.userInfo?.id
  if (!userId) return showToast('请先登录')
  try {
    commentLoading.value = true
    // 从 /user/profile 获取最新的昵称和头像
    const profileRes = await getUserProfile()
    const profile = (profileRes.code === 200 || profileRes.code === 0) ? profileRes.data : null
    const nickname = profile?.userName || userStore.userInfo?.userName || '用户'
    const avatarUrl = profile?.avatar || userStore.userInfo?.avatar || ''
    await commentPost(
      currentMoment.value.id,
      userId,
      nickname,
      commentText.value.trim(),
      avatarUrl
    )
    commentsList.value.push({
      postId: currentMoment.value.id,
      userId,
      nickname,
      content: commentText.value.trim(),
      createTime: new Date().toISOString(),
      avatarUrl
    })
    currentMoment.value.commentCount = (parseInt(currentMoment.value.commentCount) || 0) + 1
    commentText.value = ''
    showToast('评论成功')
    showComment.value = false
  } catch (e) {
    showToast('评论失败')
  } finally {
    commentLoading.value = false
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

.top-nav h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
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

/* 点赞/评论操作栏 */
.moment-actions {
  display: flex;
  gap: 20px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.2s;
}

.action-btn:active {
  background: #f5f5f5;
}

.like-btn.liked {
  color: #ff6b8a;
}

/* 评论弹窗 */
.comment-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
}

.comments-loading,
.comments-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-body {
  flex: 1;
}

.comment-nickname {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.comment-content {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.comment-time {
  font-size: 11px;
  color: #bbb;
  margin-top: 4px;
}

.comment-input-area {
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
