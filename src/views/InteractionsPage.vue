<template>
  <div class="interactions-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <van-icon name="arrow-left" size="20" @click="$router.back()" />
      <h1>互动消息</h1>
      <span class="read-all-btn" v-if="list.length > 0" @click="markAllRead">全部已读</span>
    </div>

    <!-- 加载中 -->
    <div class="loading-wrap" v-if="loading && list.length === 0">
      <van-loading color="#ff6b8a" />
    </div>

    <!-- 列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loadingMore"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div
          v-for="item in list"
          :key="item.id"
          class="notify-item"
          :class="{ unread: item.isRead === 0 }"
          @click="handleClick(item)"
        >
          <!-- 类型图标 -->
          <div class="notify-icon" :class="item.type">
            <van-icon
              :name="item.type === 'like' ? 'like' : 'chat'"
              size="18"
              color="white"
            />
          </div>

          <!-- 内容 -->
          <div class="notify-content">
            <div class="notify-title">
              <span class="from-name">{{ item.fromNickname || '有人' }}</span>
              {{ item.type === 'like' ? '赞了你的动态' : '评论了你的动态' }}
            </div>
            <div class="notify-comment" v-if="item.type === 'comment' && item.content">
              {{ item.content }}
            </div>
            <div class="notify-time">{{ formatTime(item.createTime) }}</div>
          </div>

          <!-- 未读红点 -->
          <div class="unread-dot" v-if="item.isRead === 0"></div>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 空状态 -->
    <div class="empty-wrap" v-if="!loading && list.length === 0">
      <van-icon name="like-o" size="60" color="#ffb6c1" />
      <p>暂无互动消息</p>
      <span>有人点赞或评论你的动态时，会在这里显示</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getInformList, getUnreadCount, readAll, readOne } from '@/api/interaction'
import wsManager from '@/utils/websocket'

const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const PAGE_SIZE = 20

const userId = userStore.userInfo?.id

// 拉取一页数据
const fetchPage = async (pageNum) => {
  const res = await getInformList(userId, pageNum, PAGE_SIZE)
  if (res.code === 200 || res.code === 0) {
    return Array.isArray(res.data) ? res.data : []
  }
  return []
}

// 初始加载
const loadInit = async () => {
  try {
    loading.value = true
    page.value = 1
    finished.value = false
    const data = await fetchPage(1)
    list.value = data
    if (data.length < PAGE_SIZE) finished.value = true
  } catch (e) {
    console.error('获取互动消息失败:', e)
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  try {
    page.value = 1
    finished.value = false
    const data = await fetchPage(1)
    list.value = data
    if (data.length < PAGE_SIZE) finished.value = true
  } finally {
    refreshing.value = false
  }
}

// 上拉加载更多
const loadMore = async () => {
  if (finished.value) return
  try {
    page.value++
    const data = await fetchPage(page.value)
    list.value.push(...data)
    if (data.length < PAGE_SIZE) finished.value = true
  } catch (e) {
    page.value--
  } finally {
    loadingMore.value = false
  }
}

// 点击条目：单条标记已读 + 跳动态详情（如有）
const handleClick = async (item) => {
  if (item.isRead === 0) {
    item.isRead = 1
    readOne(item.id, userId).catch(() => {})
    // 同步更新 ChatPage 角标（通知 localStorage）
    syncUnreadToStorage()
  }
}

// 全部已读
const markAllRead = async () => {
  try {
    await readAll(userId)
    list.value.forEach(item => { item.isRead = 1 })
    syncUnreadToStorage()
    showToast('已全部标记为已读')
  } catch (e) {
    showToast('操作失败')
  }
}

// 把当前未读数写入 localStorage，ChatPage 角标读这里
const syncUnreadToStorage = () => {
  const unread = list.value.filter(i => i.isRead === 0).length
  try {
    const stored = localStorage.getItem('interactionState')
    const state = stored ? JSON.parse(stored) : {}
    state.unread = unread
    localStorage.setItem('interactionState', JSON.stringify(state))
  } catch {}
}

// WebSocket 实时推送：收到新通知时插入列表顶部
const handleNotification = (data) => {
  if (data.type !== 'notification') return
  list.value.unshift({
    id: Date.now(),          // 临时 id，刷新后会被真实 id 替换
    toUserId: userId,
    fromUserId: data.fromUserId,
    fromNickname: data.fromNickname,
    type: data.notifyType,
    postId: data.postId,
    content: data.content,
    isRead: 0,
    createTime: new Date(data.timestamp).toISOString()
  })
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

onMounted(async () => {
  await loadInit()
  // 进入页面立即把未读数同步到 storage（方便 ChatPage 角标更新）
  syncUnreadToStorage()

  if (wsManager && typeof wsManager.onMessage === 'function') {
    wsManager.onMessage('notification', handleNotification)
  }
})

onUnmounted(() => {
  if (wsManager && typeof wsManager.offMessage === 'function') {
    wsManager.offMessage('notification', handleNotification)
  }
})
</script>

<style scoped>
.interactions-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding-bottom: 40px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-nav h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.read-all-btn {
  font-size: 14px;
  color: #ff6b8a;
  cursor: pointer;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.notify-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.notify-item.unread {
  background: #fff8f9;
}

.notify-item:active {
  background: #f9f9f9;
}

.notify-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notify-icon.like {
  background: linear-gradient(135deg, #ff6b8a, #ff8fa3);
}

.notify-icon.comment {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.notify-content {
  flex: 1;
  min-width: 0;
}

.notify-title {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.4;
}

.from-name {
  font-weight: 600;
}

.notify-comment {
  font-size: 13px;
  color: #888;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notify-time {
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b8a;
  flex-shrink: 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  gap: 10px;
}

.empty-wrap p {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.empty-wrap span {
  font-size: 13px;
  text-align: center;
  color: #bbb;
}
</style>
