<template>
  <div class="discover-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <h1>发现</h1>
      <div class="nav-actions">
        <van-icon name="filter-o" size="20" @click="showFilter = true" />
        <van-icon name="location-o" size="20" class="ml-4" />
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs" :class="{ 'filter-tabs--scrollable': activeTab === 'moments' }">
      <van-tabs v-model:active="activeTab" @change="handleTabChange">
        <van-tab title="推荐" name="recommend">
          <div class="user-grid">
            <CuteUserCard
              v-for="user in filteredUsers"
              :key="user.id"
              :user="user"
              @like="handleLike"
              @pass="handlePass"
              @chat="handleChat"
              @view-profile="viewUserProfile"
            />
          </div>
        </van-tab>
        
        <van-tab title="附近" name="nearby">
          <div class="user-grid">
            <CuteUserCard
              v-for="user in nearbyUsers"
              :key="user.id"
              :user="user"
              @like="handleLike"
              @pass="handlePass"
              @chat="handleChat"
              @view-profile="viewUserProfile"
            />
          </div>
        </van-tab>
        
        <van-tab title="在线" name="online">
          <div class="user-grid">
            <CuteUserCard
              v-for="user in onlineUsers"
              :key="user.id"
              :user="user"
              @like="handleLike"
              @pass="handlePass"
              @chat="handleChat"
              @view-profile="viewUserProfile"
            />
          </div>
        </van-tab>
        
        <van-tab title="我的动态" name="moments">
          <!-- 我的动态内容 -->
          <div class="my-moments-content">
            <van-loading v-if="momentsLoading" type="spinner" size="24">加载中...</van-loading>
            
            <div v-else-if="userMoments.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <p>还没有发布动态</p>
              <van-button type="primary" size="small" @click="$router.push('/post')">
                发布第一条动态
              </van-button>
            </div>

            <div v-else class="moments-list">
              <div v-for="moment in userMoments" :key="moment.id" class="moment-item">
                <div class="moment-header">
                  <div class="user-info">
                    <van-image :src="moment.avatarUrl" round width="40" height="40" />
                    <div class="user-details">
                      <h4>{{ moment.nickname }}</h4>
                      <span class="time">{{ formatTime(moment.createTime) }}</span>
                    </div>
                  </div>
                  <div class="moment-actions">
                    <van-icon name="edit" @click="editMoment(moment)" />
                    <van-icon name="delete-o" @click="deleteMoment(moment.id)" />
                  </div>
                </div>

                <div class="moment-content">
                  <p>{{ moment.content }}</p>
                  <div v-if="moment.imageList && moment.imageList.length > 0" class="moment-images">
                    <van-image
                      v-for="(image, index) in moment.imageList"
                      :key="index"
                      :src="image"
                      fit="cover"
                      width="80px"
                      height="80px"
                      radius="8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 卡片堆叠区域 -->
    <div v-if="activeTab !== 'moments'" class="card-stack-container">
      <CardStack 
        :cards="currentUsers"
        :loading="isLoading"
        @like="handleLike"
        @reject="handleReject"
        @empty="loadMoreUsers"
        ref="cardStack"
      />
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          round 
          size="large" 
          icon="cross" 
          color="#ff4757"
          @click="rejectCurrent"
        />
        <van-button 
          round 
          size="large" 
          icon="star-o" 
          color="#ffa502"
          @click="superLike"
        />
        <van-button 
          round 
          size="large" 
          icon="like-o" 
          color="#2ed573"
          @click="likeCurrent"
        />
      </div>
    </div>

    <!-- 匹配成功弹窗 -->
    <van-popup v-model:show="showMatchModal" :style="{ padding: '40px 20px' }">
      <div class="match-modal">
        <div class="match-animation">
          <div class="heart-icon">💕</div>
          <h2>匹配成功！</h2>
          <p>你和 {{ matchedUser?.name }} 互相喜欢</p>
        </div>
        <div class="match-users">
          <div class="match-user">
            <van-image :src="currentUser.avatar" round width="80" height="80" />
            <span>{{ currentUser.name }}</span>
          </div>
          <div class="match-heart">💖</div>
          <div class="match-user">
            <van-image :src="matchedUser?.avatar" round width="80" height="80" />
            <span>{{ matchedUser?.name }}</span>
          </div>
        </div>
        <div class="match-actions">
          <van-button block type="primary" @click="startChat">
            开始聊天
          </van-button>
          <van-button block plain @click="showMatchModal = false">
            继续寻找
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 筛选弹窗 -->
    <van-popup v-model:show="showFilter" position="bottom" :style="{ height: '70%' }">
      <div class="filter-modal">
        <div class="modal-header">
          <h3>筛选条件</h3>
          <van-button type="primary" size="mini" @click="applyFilter">
            应用
          </van-button>
        </div>
        
        <van-cell-group inset>
          <van-cell title="年龄范围">
            <template #right-icon>
              <span>{{ ageRange[0] }} - {{ ageRange[1] }}岁</span>
            </template>
          </van-cell>
          <van-cell>
            <van-slider 
              v-model="ageRange" 
              range 
              :min="18" 
              :max="50" 
              :step="1"
            />
          </van-cell>
          
          <van-cell title="距离范围">
            <template #right-icon>
              <span>{{ distance }}km内</span>
            </template>
          </van-cell>
          <van-cell>
            <van-slider 
              v-model="distance" 
              :min="1" 
              :max="100" 
              :step="1"
            />
          </van-cell>
          
          <van-cell title="兴趣标签" is-link @click="showTagPicker = true">
            <template #right-icon>
              <span>{{ selectedTags.length }}个已选</span>
            </template>
          </van-cell>
          
          <van-cell title="只看在线">
            <template #right-icon>
              <van-switch v-model="onlineOnly" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 标签选择弹窗 -->
    <van-popup v-model:show="showTagPicker" position="bottom" :style="{ height: '60%' }">
      <div class="tag-picker">
        <div class="modal-header">
          <h3>选择兴趣标签</h3>
          <van-button type="primary" size="mini" @click="showTagPicker = false">
            完成
          </van-button>
        </div>
        <div class="tag-grid">
          <div 
            v-for="tag in allTags" 
            :key="tag"
            class="tag-item"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 编辑动态弹窗 -->
    <van-popup v-model:show="showEditModal" position="bottom" :style="{ height: '80%' }">
      <div class="edit-modal">
        <div class="modal-header">
          <h3>编辑动态</h3>
          <van-button type="primary" size="mini" @click="updateMoment">
            保存
          </van-button>
        </div>
        <van-field
          v-model="editContent"
          type="textarea"
          placeholder="分享你的想法..."
          rows="4"
          autosize
        />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
defineOptions({ name: 'DiscoverPage' })
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import CardStack from '../components/CardStack.vue'
import { getUserTagsList, getRecommendUsers } from '../api/user.js'
import { parseTags } from '../api/types.js'
import { useUserStore } from '../stores/user.js'
import { wsManager } from '../utils/websocket.js'
import { getuserup, deleteMoment as deleteMomentApi } from '../api/post.js'
import { showConfirmDialog } from 'vant'
import { getApiErrorMessage } from '../utils/error.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const activeTab = ref('recommend')
const showFilter = ref(false)
const showTagPicker = ref(false)
const showMatchModal = ref(false)
const cardStack = ref(null)
const isLoading = ref(false) // 添加加载状态

// 添加我的动态相关数据
const userMoments = ref([])
const momentsLoading = ref(false)

// 筛选条件
const ageRange = ref([20, 30])
const distance = ref(10)
const selectedTags = ref([])
const onlineOnly = ref(false)

// 当前用户信息
const currentUser = ref({
  name: '我',
  avatar: 'https://picsum.photos/200/200?random=100'
})

// 匹配的用户
const matchedUser = ref(null)

// 所有标签
const allTags = ref([
  '温柔', '阳光', '活泼', '文艺', '运动', '音乐', '电影', '旅行',
  '美食', '摄影', '读书', '游戏', '动漫', '宠物', '花艺', '舞蹈'
])

// 用户数据 - 改为空数组
const allUsers = ref([])

// 计算当前显示的用户
const currentUsers = computed(() => {
  let users = []
  
  // 根据当前标签页获取用户
  switch (activeTab.value) {
    case 'recommend':
      users = allUsers.value
      break
    case 'nearby':
      users = allUsers.value.filter(user => user.distance < 5)
      break
    case 'online':
      users = allUsers.value.filter(user => user.isOnline)
      break
    default:
      users = allUsers.value
  }
  
  return users
})

// 方法
const handleTabChange = () => {
  console.log('切换到:', activeTab.value)
  // 如果切换到我的动态标签，加载动态数据
  if (activeTab.value === 'moments') {
    loadUserMoments()
  }
}

const handleLike = async (user) => {
  console.log('喜欢:', user.name)
  
  // 发送打招呼消息
  try {
    await sendGreetingMessage(user.id)
    // 移除toast提示
    // showToast(`已向${user.name}发送打招呼消息`)
  } catch (error) {
    console.error('发送打招呼消息失败:', error)
    // showToast('发送消息失败，请重试')  // 注释掉白色弹窗
  }
  
  // 移除匹配逻辑，不再显示匹配成功弹窗
}

const handleReject = (user) => {
  console.log('拒绝:', user.name)
}

// const loadMoreUsers = () => {
//   console.log('加载更多用户')
//   // 这里可以添加加载更多用户的逻辑
// }

const rejectCurrent = () => {
  if (cardStack.value) {
    cardStack.value.rejectCurrent()
  }
}

const likeCurrent = () => {
  if (cardStack.value) {
    cardStack.value.likeCurrent()
  }
}

const superLike = () => {
  if (cardStack.value) {
    cardStack.value.superLike()
  }
}

const startChat = () => {
  showMatchModal.value = false
  router.push(`/chat/${matchedUser.value.id}`)
}

const applyFilter = () => {
  showFilter.value = false
  console.log('应用筛选条件')
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 添加数据转换函数
const transformApiUserToCardUser = (apiUser) => {
  // 解析标签
  let tags = []
  try {
    const tagsStr = apiUser.tags || ''
    
    if (!tagsStr) {
      tags = []
    } else if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
      // JSON数组格式: ["java","python"]
      tags = JSON.parse(tagsStr)
    } else if (tagsStr.includes(',')) {
      // 逗号分隔格式: "python,go"
      tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag)
    } else {
      // 单个标签: "java"
      tags = [tagsStr.trim()]
    }
  } catch (e) {
    console.warn('解析标签失败:', e, apiUser.tags)
    tags = []
  }

  return {
    id: apiUser.id,
    name: apiUser.username || apiUser.userAccount || '用户',
    age: apiUser.age || 22,
    distance: (Math.random() * 5 + 0.5).toFixed(1), // 模拟距离，实际应从后端获取
    avatar: (apiUser.avatarUrl || `https://picsum.photos/300/400?random=${apiUser.id}`).trim(),
    tags: Array.isArray(tags) ? tags.slice(0, 3) : [], // 确保是数组再调用slice
    isOnline: Math.random() > 0.5, // 模拟在线状态
    bio: apiUser.signature || '这个人很神秘，什么都没有留下...',
    photos: [
      (apiUser.avatarUrl || `https://picsum.photos/300/400?random=${apiUser.id}`).trim(),
      `https://picsum.photos/300/400?random=${apiUser.id}1`,
      `https://picsum.photos/300/400?random=${apiUser.id}2`
    ]
  }
}

// 添加分页状态
const currentPage = ref(1)
const pageSize = ref(50) // 改为50条
const hasNextPage = ref(false)
const totalUsers = ref(0)

// 从API获取用户数据
const fetchUsersFromApi = async (page = 1, append = false) => {
  try {
    if (!append) {
      isLoading.value = true
    }
    console.log(`获取第${page}页用户数据...`)

    let response
    if (activeTab.value === 'recommend') {
      // 推荐tab：使用新的推荐API
      const currentUserId = userStore.userInfo?.id
      if (!currentUserId) {
        console.warn('未登录，无法获取推荐')
        isLoading.value = false
        return
      }
      response = await getRecommendUsers({
        userId: currentUserId,
        limit: pageSize.value,
        gender: null,
        ageMin: ageRange.value[0],
        ageMax: ageRange.value[1]
      })
      console.log('推荐API响应:', response)

      if (response.code === 200 && response.data) {
        const list = Array.isArray(response.data) ? response.data : []
        const transformedUsers = list.map(u => ({
          id: u.id,
          name: u.userName || '用户',
          age: u.age || 22,
          distance: (Math.random() * 5 + 0.5).toFixed(1),
          avatar: (u.avatar || `https://picsum.photos/300/400?random=${u.id}`).trim(),
          tags: Array.isArray(u.tags) ? u.tags.slice(0, 3) : parseTags(u.tags).slice(0, 3),
          isOnline: Math.random() > 0.5,
          bio: u.signature || '这个人很神秘，什么都没有留下...',
          matchScore: u.matchScore || 0,
          photos: [
            (u.avatar || `https://picsum.photos/300/400?random=${u.id}`).trim(),
            `https://picsum.photos/300/400?random=${u.id}1`,
            `https://picsum.photos/300/400?random=${u.id}2`
          ]
        }))

        if (append) {
          allUsers.value = [...allUsers.value, ...transformedUsers]
        } else {
          allUsers.value = transformedUsers
        }
        hasNextPage.value = false
        totalUsers.value = transformedUsers.length
      }
    } else {
      // 附近/在线tab：使用原来的标签列表API
      response = await getUserTagsList({ pageNum: page, pageSize: pageSize.value })
      console.log('标签列表API响应:', response)

      if (response.code === 200 && response.data) {
        const { list, hasNextPage: hasNext, total } = response.data
        console.log('分页数据:', { list: list?.length, hasNext, total })

        if (page === 1 && list?.length > 0) {
          userStore.cacheUsers(list)
        }

        const transformedUsers = (list || []).map(transformApiUserToCardUser)

        if (append) {
          allUsers.value = [...allUsers.value, ...transformedUsers]
        } else {
          allUsers.value = transformedUsers
        }

        hasNextPage.value = hasNext
        totalUsers.value = parseInt(total) || 0
        currentPage.value = page
      }
    }

    console.log(`已加载${allUsers.value.length}个用户`)
  } catch (error) {
    console.error('获取用户数据失败:', error)
    if (!append) {
      allUsers.value = []
    }
  } finally {
    if (!append) {
      isLoading.value = false
    }
  }
}

// 加载更多用户（翻页）
const loadMoreUsers = async () => {
  if (!isLoading.value) {
    console.log('加载下一页用户数据...')
    isLoading.value = true
    try {
      await fetchUsersFromApi(currentPage.value + 1, true)
      console.log(`加载完成，当前总用户数: ${allUsers.value.length}`)
    } finally {
      isLoading.value = false
    }
  }
}

onMounted(async () => {
  console.log('发现页面加载完成')
  
  // 首先检查URL参数，设置正确的标签页
  if (route.query.tab === 'moments') {
    activeTab.value = 'moments'
    await loadUserMoments()
    return // 如果是动态页面，直接返回，不需要加载用户数据
  }
  
  // 检查是否已有缓存数据
  if (userStore.userCacheLoaded && userStore.userCache.size > 0) {
    console.log('使用缓存数据')
    const cachedUsers = Array.from(userStore.userCache.values()).map(transformCachedUserToCardUser)
    allUsers.value = cachedUsers
  } else if (allUsers.value.length === 0) {
    // 没有缓存数据时，从API加载用户数据
    isLoading.value = true
    await fetchUsersFromApi()
  }
})

// 发送打招呼消息的函数
const sendGreetingMessage = async (userId) => {
  const greetingMessage = 'ta刚刚在广场向你打了招呼,快来聊天吧'
  
  // 检查WebSocket连接状态
  if (!wsManager.isConnected()) {
    console.log('WebSocket未连接，尝试重连...')
    if (userStore.userInfo?.id) {
      await userStore.connectWebSocket()
    }
  }

  // 构造消息对象
  const messageData = {
    type: 'private',
    toUserId: String(userId),
    message: greetingMessage
  }

  // 通过WebSocket发送消息
  const success = wsManager.sendMessage(messageData)
  
  if (!success) {
    throw new Error('WebSocket发送失败')
  }
  
  console.log('打招呼消息发送成功:', messageData)
}

// 添加加载用户动态的方法
const loadUserMoments = async () => {
  try {
    momentsLoading.value = true
    const userId = userStore.userInfo?.id
    
    if (!userId) {
      showToast('用户信息错误')
      return
    }

    const response = await getuserup(Number(userId))
    console.log('用户动态响应:', response)

    if (response.code === 200 || response.code === 0) {
      userMoments.value = response.data || []
    } else {
      showToast(response.message || '获取动态失败')
    }
  } catch (error) {
    console.error('获取用户动态失败:', error)
    showToast(getApiErrorMessage(error, '获取动态失败'))
  } finally {
    momentsLoading.value = false
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
      userMoments.value = userMoments.value.filter(moment => moment.id !== momentId)
    } else {
      showToast(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      showToast(getApiErrorMessage(error, '删除失败'))
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

// 将缓存的用户数据转换为卡片用户格式
const transformCachedUserToCardUser = (cachedUser) => {
  const tags = Array.isArray(cachedUser.tags) ? cachedUser.tags : 
               (typeof cachedUser.tags === 'string' ? JSON.parse(cachedUser.tags || '[]') : [])
  
  return {
    id: cachedUser.id,
    name: cachedUser.username,
    age: cachedUser.age,
    avatar: cachedUser.avatarUrl,
    distance: Math.random() * 5 + 0.5, // 模拟距离
    isOnline: cachedUser.isOnline,
    tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
    gender: cachedUser.gender,
    signature: cachedUser.signature
  }
}

// 添加编辑相关数据
const showEditModal = ref(false)
const editContent = ref('')
const editingMoment = ref(null)

// 编辑动态 - 跳转到编辑页面
const editMoment = (moment) => {
  router.push({
    path: '/post',
    query: {
      mode: 'edit',
      momentId: moment.id
    }
  })
}

// 更新动态
const updateMoment = async () => {
  try {
    // 调用更新API
    const response = await updateMomentApi(editingMoment.value.id, {
      content: editContent.value
    })
    
    if (response.code === 200) {
      showToast('更新成功')
      // 更新本地数据
      const index = userMoments.value.findIndex(m => m.id === editingMoment.value.id)
      if (index > -1) {
        userMoments.value[index].content = editContent.value
      }
      showEditModal.value = false
    }
  } catch (error) {
    showToast(getApiErrorMessage(error, '更新失败'))
  }
}
</script>

<style scoped>
.discover-page {
  height: 100%;
  background: rgb(252, 245, 236);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-nav h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ml-4 {
  margin-left: 16px;
}

.filter-tabs {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* 动态 tab 时撑满剩余空间，tab 头固定，内容区滚动 */
.filter-tabs--scrollable {
  flex: 1;
  min-height: 0;
}

/* van-tabs 内部：tab 头固定，内容区滚动 */
.filter-tabs--scrollable :deep(.van-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-tabs--scrollable :deep(.van-tabs__wrap) {
  flex-shrink: 0;
}

.filter-tabs--scrollable :deep(.van-tabs__content) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: none;
}

.filter-tabs--scrollable :deep(.van-tabs__content)::-webkit-scrollbar {
  display: none;
}

.card-stack-container {
  position: relative;
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.action-buttons {
  display: none;
}

.match-modal {
  text-align: center;
}

.match-animation {
  margin-bottom: var(--spacing-xl);
}

.heart-icon {
  font-size: 60px;
  animation: heartbeat 1s ease-in-out infinite;
  margin-bottom: var(--spacing-lg);
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.match-modal h2 {
  font-size: 24px;
  color: var(--primary-pink);
  margin-bottom: var(--spacing-sm);
}

.match-modal p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.match-users {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.match-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.match-user span {
  font-size: 14px;
  color: var(--color-text);
}

.match-heart {
  font-size: 32px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.match-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-modal, .tag-picker {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 18px;
  color: var(--color-text);
  margin: 0;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.tag-item {
  padding: var(--spacing-md);
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tag-item:hover {
  border-color: var(--primary-pink);
}

.tag-item.active {
  background: var(--primary-pink);
  color: white;
  border-color: var(--primary-pink);
}

/* 我的动态样式 */
.my-moments-content {
  padding: var(--spacing-md);
  background: rgb(252, 245, 236);
  min-height: 100%;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.moments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: rgb(252, 245, 236);
}

.moment-item {
  background: white;
  border-radius: 12px;
  padding: var(--spacing-md);
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: var(--spacing-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    gap: var(--spacing-md);
  }
}
</style>















