<template>
  <div class="post-page">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <van-nav-bar
        :title="isEditMode ? '编辑动态' : '发布动态'"
        left-arrow
        @click-left="$router.go(-1)"
        class="nav-bar"
      >
        <template #right>
          <van-button
            type="primary"
            size="small"
            round
            :loading="isPublishing"
            :disabled="!canPublish"
            class="nav-publish-btn"
            @click="handlePublish"
          >
            {{ isEditMode ? '保存' : '发布' }}
          </van-button>
        </template>
      </van-nav-bar>
    </div>

    <!-- 加载动态详情时的loading -->
    <van-loading v-if="isLoadingMoment" type="spinner" color="#FFB6C1" vertical>
      加载动态详情中...
    </van-loading>

    <!-- 原有内容 -->
    <div v-else class="content-wrapper">
      <!-- 用户信息卡片 -->
      <div class="user-card card-hover">
        <div class="user-info">
          <van-image 
            :src="userInfo.avatar" 
            fit="cover" 
            round 
            width="60" 
            height="60"
            class="user-avatar"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <div class="avatar-error">👤</div>
            </template>
          </van-image>
          
          <div class="user-details">
            <h3 class="username">{{ userInfo.name }}</h3>
            <div class="user-status">
              <van-tag 
                type="primary" 
                size="small" 
                class="mood-tag"
              >
                {{ getMoodEmoji(userInfo.mood) }} {{ userInfo.mood }}
              </van-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容输入卡片 -->
      <div class="content-card card-hover">
        <van-field
          v-model="postContent"
          type="textarea"
          placeholder="分享你的甜蜜时刻... 🌸"
          rows="6"
          autosize
          maxlength="500"
          show-word-limit
          class="content-input"
        />
      </div>

      <!-- 媒体预览卡片 -->
      <div v-if="mediaList.length > 0" class="media-card card-hover">
        <div class="media-header">
          <span class="media-title">📸 媒体内容</span>
          <van-button
            type="danger"
            size="mini"
            plain
            @click="clearAllMedia"
            class="clear-btn"
          >
            清空
          </van-button>
        </div>
        <div class="media-grid">
          <div
            v-for="(media, index) in mediaList"
            :key="index"
            class="media-item"
          >
            <van-image
              :src="media.url"
              fit="cover"
              width="80"
              height="80"
              radius="8"
              class="media-preview"
              @click="previewMedia(index)"
            />
            <van-icon
              name="cross"
              class="remove-media"
              @click="removeMedia(index)"
            />
          </div>
          <div
            v-if="mediaList.length < 9"
            class="add-media-btn"
            @click="selectFromAlbum"
            :class="{ disabled: isUploading }"
          >
            <van-loading v-if="isUploading" size="20" />
            <van-icon v-else name="plus" size="24" />
          </div>
        </div>
      </div>

      <!-- 功能选项卡片 -->
      <div class="options-card card-hover">
        <div class="option-item" @click="selectFromAlbum">
          <div class="option-icon">📷</div>
          <span class="option-text">添加图片</span>
          <van-icon name="arrow" class="option-arrow" />
        </div>
        
        <div class="option-item" @click="showMediaPicker = true">
          <div class="option-icon">🎬</div>
          <span class="option-text">更多媒体选项</span>
          <van-icon name="arrow" class="option-arrow" />
        </div>
        
        <div class="option-item" @click="showLocationPicker = true">
          <div class="option-icon">📍</div>
          <span class="option-text">
            {{ location ? location.name : '添加位置' }}
          </span>
          <van-icon name="arrow" class="option-arrow" />
        </div>
        
        <div class="option-item" @click="showMoodPicker = true">
          <div class="option-icon">😊</div>
          <span class="option-text">选择心情</span>
          <van-icon name="arrow" class="option-arrow" />
        </div>

        <!-- 限时展示选项 -->
        <div class="option-item" @click="showTtlPicker = true">
          <div class="option-icon">⏰</div>
          <span class="option-text">限时展示</span>
          <van-icon name="arrow" class="option-arrow" />
        </div>
      </div>

      <!-- 选中的心情标签 -->
      <div v-if="selectedMoods.length > 0" class="mood-card card-hover">
        <div class="mood-header">
          <span class="mood-title">💭 当前心情</span>
        </div>
        <div class="mood-tags">
          <van-tag
            v-for="mood in selectedMoods"
            :key="mood"
            type="primary"
            size="medium"
            round
            closeable
            @close="removeMood(mood)"
            class="mood-tag-item"
          >
            {{ getMoodEmoji(mood) }} {{ mood }}
          </van-tag>
        </div>
      </div>
    </div>

    <!-- 媒体选择器 -->
    <van-action-sheet
      v-model:show="showMediaPicker"
      :actions="mediaActions"
      @select="onMediaSelect"
      cancel-text="取消"
      title="选择媒体"
      class="media-sheet"
    />

    <!-- 位置选择器 -->
    <van-action-sheet
      v-model:show="showLocationPicker"
      title="选择位置"
      cancel-text="取消"
      class="location-sheet"
    >
      <div class="location-content">
        <div
          v-for="loc in nearbyLocations"
          :key="loc.id"
          class="location-item"
          @click="selectLocation(loc)"
        >
          <div class="location-info">
            <h4>{{ loc.name }}</h4>
            <p>{{ loc.address }}</p>
          </div>
          <van-icon
            v-if="location && location.id === loc.id"
            name="success"
            color="#FFB6C1"
          />
        </div>
      </div>
    </van-action-sheet>

    <!-- 心情选择器 -->
    <van-action-sheet
      v-model:show="showMoodPicker"
      title="选择心情"
      cancel-text="取消"
      class="mood-sheet"
    >
      <div class="mood-content">
        <div class="mood-grid">
          <div
            v-for="mood in availableMoods"
            :key="mood"
            class="mood-option"
            :class="{ selected: selectedMoods.includes(mood) }"
            @click="toggleMood(mood)"
          >
            <span class="mood-emoji">{{ getMoodEmoji(mood) }}</span>
            <span class="mood-name">{{ mood }}</span>
          </div>
        </div>
      </div>
    </van-action-sheet>

    <!-- 限时展示选择器 - 简洁版 -->
    <van-popup 
      v-model:show="showTtlPicker" 
      position="bottom" 
      :style="{ height: '50%' }"
      round
      closeable
      close-icon-position="top-right"
    >
      <div class="ttl-picker-simple">
        <!-- 简洁头部 -->
        <div class="picker-header-simple">
          <h3 class="picker-title-simple">选择展示时长</h3>
          <p class="picker-subtitle-simple">动态将在指定时间后自动删除</p>
        </div>
        
        <!-- 选项列表 -->
        <div class="ttl-options-simple">
          <!-- 限时选项 -->
          <div
            v-for="option in ttlOptions"
            :key="option.value"
            class="ttl-option-simple"
            :class="{ 'selected': selectedTtl === option.value }"
            @click="selectTtl(option.value)"
          >
            <div class="option-content-simple">
              <div class="option-icon-simple">🕒</div>
              <div class="option-info-simple">
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.desc }}</div>
              </div>
            </div>
            <div class="option-check">
              <van-icon 
                v-if="selectedTtl === option.value" 
                name="success" 
                color="#FFB6C1"
                size="18"
              />
            </div>
          </div>
          
          <!-- 永久展示选项 -->
          <div
            class="ttl-option-simple permanent-simple"
            :class="{ 'selected': selectedTtl === null }"
            @click="selectTtl(null)"
          >
            <div class="option-content-simple">
              <div class="option-icon-simple permanent-icon">♾️</div>
              <div class="option-info-simple">
                <div class="option-label">永久展示</div>
                <div class="option-desc">动态将一直保留</div>
              </div>
            </div>
            <div class="option-check">
              <van-icon 
                v-if="selectedTtl === null" 
                name="success" 
                color="#FFB6C1"
                size="18"
              />
            </div>
          </div>
        </div>

        <!-- 简洁按钮组 -->
        <div class="picker-actions-simple">
          <van-button 
            class="action-btn cancel-simple" 
            size="large"
            @click="showTtlPicker = false"
          >
            取消
          </van-button>
          <van-button 
            class="action-btn confirm-simple" 
            type="primary"
            size="large"
            @click="confirmTtlSelection"
          >
            确定
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 隐藏的文件输入元素 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showImagePreview, showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { uploadImage } from '../api/upload'
import { publishPost, updatesocia, getonlyup } from '../api/post'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const fileInput = ref(null)

// 用户信息 - 从store获取
const userInfo = ref({
  name: '用户',
  avatar: 'https://picsum.photos/100/100?random=1',
  mood: '开心'
})

// 初始化用户信息
const initUserInfo = () => {
  // 确保store已初始化
  if (!userStore.userInfo) {
    userStore.initUserInfo()
  }
  
  if (userStore.userInfo) {
    userInfo.value = {
      name: userStore.userInfo.userName || userStore.userInfo.nickname || userStore.userInfo.name || '用户',
      avatar: userStore.userInfo.avatar || 'https://picsum.photos/100/100?random=1',
      mood: '开心'
    }
  } else {
    // 如果store中没有用户信息，尝试从localStorage获取
    const storedUser = getCurrentUserInfo()
    if (storedUser) {
      userInfo.value = {
        name: storedUser.userName || storedUser.nickname || storedUser.name || '用户',
        avatar: storedUser.avatar || 'https://picsum.photos/100/100?random=1',
        mood: '开心'
      }
    }
  }
}

// 获取用户信息的辅助函数
const getCurrentUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 组件挂载时初始化用户信息
onMounted(() => {
  initUserInfo()
})

// 发布内容
const postContent = ref('')
const mediaList = ref([])
const location = ref(null)
const selectedMoods = ref([])
const isPublishing = ref(false)
const isUploading = ref(false)

// 弹窗状态
const showMediaPicker = ref(false)
const showLocationPicker = ref(false)
const showMoodPicker = ref(false)
const showTtlPicker = ref(false)

// 限时展示选项
const ttlOptions = [
  { value: 60 * 1000, label: '1分钟', icon: '🕒', desc: '1分钟后自动删除' },
  { value: 30 * 60 * 1000, label: '30分钟', icon: '🕒', desc: '30分钟后自动删除' },
  { value: 60 * 60 * 1000, label: '1小时', icon: '🕒', desc: '1小时后自动删除' },
  { value: 2*60 * 60 * 1000, label: '2小时', icon: '🕒', desc: '2小时后自动删除' }
]

const selectedTtl = ref(null)

// 选择限时展示时长
const selectTtl = (value) => {
  selectedTtl.value = value
}

// 确认限时展示选择
const confirmTtlSelection = () => {
  showTtlPicker.value = false
  // 在这里可以处理选择的限时展示时长
  console.log('选择的限时展示时长:', selectedTtl.value)
}

// 媒体选择选项
const mediaActions = [
  { name: '从相册选择', value: 'album', icon: 'photo-o' },
  { name: '拍照', value: 'camera', icon: 'photograph' },
  { name: '录制视频', value: 'video', icon: 'video-o' }
]

// 附近位置
const nearbyLocations = ref([
  { id: 1, name: '星巴克咖啡', address: '距离你100m' },
  { id: 2, name: '甜品工坊', address: '距离你200m' },
  { id: 3, name: '樱花公园', address: '距离你500m' },
  { id: 4, name: '温馨书店', address: '距离你800m' }
])

// 可选心情
const availableMoods = [
  '开心', '兴奋', '甜蜜', '温暖', '感动', '惊喜',
  '平静', '思考', '期待', '满足', '幸福', '破防'
]

// 心情表情映射
//小表情获取网址
//https://unicode.org/emoji/charts/full-emoji-list.html
const getMoodEmoji = (mood) => {
  const emojiMap = {
    '开心': '😊', '兴奋': '🤩', '甜蜜': '🥰', '温暖': '🤗',
    '感动': '🥺', '惊喜': '😲', '平静': '😌', '思考': '🤔',
    '期待': '😍', '满足': '😄', '幸福': '😘', '破防': '👽'
  }
  return emojiMap[mood] || '😊'
}

// 是否可以发布
const canPublish = computed(() => {
  return (postContent.value.trim().length > 0 || mediaList.value.length > 0) && !isUploading.value
})

// 处理媒体选择
const onMediaSelect = (action) => {
  showMediaPicker.value = false
  
  switch (action.value) {
    case 'album':
      selectFromAlbum()
      break
    case 'camera':
      capturePhoto()
      break
    case 'video':
      recordVideo()
      break
  }
}

// 从相册选择图片 - 添加调试信息
const selectFromAlbum = () => {
  console.log('selectFromAlbum 被调用')
  console.log('fileInput.value:', fileInput.value)
  
  if (mediaList.value.length >= 9) {
    showToast('最多只能添加9张图片')
    return
  }
  
  // 确保文件输入元素存在
  if (!fileInput.value) {
    console.error('文件输入元素未找到')
    showToast('文件选择器初始化失败')
    return
  }
  
  // 触发文件选择器
  console.log('触发文件选择器')
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = async (event) => {
  console.log('文件选择事件触发')
  const files = Array.from(event.target.files)
  console.log('选择的文件:', files)
  
  if (files.length === 0) return
  
  // 检查文件数量限制
  if (mediaList.value.length + files.length > 9) {
    showToast('最多只能添加9张图片')
    return
  }
  
  // 检查文件类型和大小
  const validFiles = files.filter(file => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showToast(`${file.name} 不是有效的图片格式`)
      return false
    }
    
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name} 文件大小超过10MB`)
      return false
    }
    
    return true
  })
  
  console.log('有效文件:', validFiles)
  
  if (validFiles.length === 0) return
  
  // 上传文件
  await uploadFiles(validFiles)
  
  // 清空文件选择器
  event.target.value = ''
}

// 上传文件到服务器
const uploadFiles = async (files) => {
  isUploading.value = true
  const loadingToast = showLoadingToast({
    message: '上传中...',
    forbidClick: true,
    duration: 0
  })
  
  try {
    const uploadPromises = files.map(async (file) => {
      try {
        console.log('开始上传文件:', file.name)
        const response = await uploadImage(file)
        console.log('上传响应:', response)
        
        // 根据实际API响应结构调整
        if (response.code === 200 || response.code === 0) {
          // 处理不同的响应数据结构
          let imageUrl = ''
          
          if (typeof response.data === 'string') {
            // 如果data直接是URL字符串
            imageUrl = response.data
          } else if (response.data && response.data.url) {
            // 如果data是对象且包含url字段
            imageUrl = response.data.url
          } else if (response.url) {
            // 如果响应直接包含url字段
            imageUrl = response.url
          } else {
            console.warn('无法从响应中提取图片URL:', response)
            throw new Error('上传成功但无法获取图片URL')
          }
          
          console.log('提取的图片URL:', imageUrl)
          
          return {
            type: 'image',
            url: imageUrl,
            file: file
          }
        } else {
          throw new Error(response.message || '上传失败')
        }
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error)
        showToast(`${file.name} 上传失败: ${error.message}`)
        return null
      }
    })
    
    const results = await Promise.all(uploadPromises)
    const successUploads = results.filter(result => result !== null)
    
    console.log('上传结果:', successUploads)
    
    if (successUploads.length > 0) {
      mediaList.value.push(...successUploads)
      showToast(`成功上传 ${successUploads.length} 张图片`)
      console.log('当前媒体列表:', mediaList.value)
    }
    
  } catch (error) {
    console.error('批量上传失败:', error)
    showToast('上传失败，请重试')
  } finally {
    closeToast()
    isUploading.value = false
  }
}

// 模拟拍照 - 保持现有功能
const capturePhoto = () => {
  const mockPhoto = {
    type: 'image',
    url: `https://picsum.photos/400/400?random=${Date.now()}`
  }
  mediaList.value.push(mockPhoto)
  showToast('照片添加成功')
}

// 模拟录制视频 - 保持现有功能
const recordVideo = () => {
  const mockVideo = {
    type: 'video',
    url: `https://picsum.photos/400/400?random=${Date.now()}`,
    thumbnail: `https://picsum.photos/400/400?random=${Date.now()}`
  }
  mediaList.value.push(mockVideo)
  showToast('视频添加成功')
}

// 预览媒体
const previewMedia = (index) => {
  const images = mediaList.value.map(media => media.url)
  showImagePreview({ images, startPosition: index })
}

// 移除媒体
const removeMedia = (index) => {
  mediaList.value.splice(index, 1)
}

// 清空所有媒体
const clearAllMedia = async () => {
  try {
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有媒体内容吗？'
    })
    mediaList.value = []
    showToast('已清空媒体内容')
  } catch {
    // 用户取消
  }
}

// 选择位置
const selectLocation = (loc) => {
  location.value = loc
  showLocationPicker.value = false
  showToast(`已选择位置：${loc.name}`)
}

// 切换心情
const toggleMood = (mood) => {
  const index = selectedMoods.value.indexOf(mood)
  if (index > -1) {
    selectedMoods.value.splice(index, 1)
  } else {
    if (selectedMoods.value.length < 3) {
      selectedMoods.value.push(mood)
    } else {
      showToast('最多只能选择3个心情标签')
    }
  }
}

// 移除心情
const removeMood = (mood) => {
  const index = selectedMoods.value.indexOf(mood)
  if (index > -1) {
    selectedMoods.value.splice(index, 1)
  }
}

// 发布动态 - 支持编辑模式
const handlePublish = async () => {
  if (!canPublish.value) return
  
  isPublishing.value = true
  
  try {
    if (isEditMode.value) {
      // 编辑模式 - 调用更新接口
      const updateData = {
        id: editingMomentId.value,
        content: postContent.value.trim()
      }
      
      console.log('更新动态数据:', updateData)
      const response = await updatesocia(updateData)
      
      if (response.code === 200 || response.code === 0) {
        showToast('动态更新成功！')
        router.push('/discover?tab=moments')
      } else {
        throw new Error(response.message || '更新失败')
      }
    } else {
      // 发布模式 - 原有逻辑
      const currentUser = userStore.userInfo || getCurrentUserInfo()
      
      if (!currentUser) {
        showToast('请先登录')
        router.push('/login')
        return
      }
      
      const postData = {
        content: postContent.value.trim(),
        createTime: new Date().toISOString(),
        id: 0,
        imageList: mediaList.value
          .filter(media => media.type === 'image')
          .map(media => media.url),
        isDeleted: 0,
        likeCount: 0,
        mood: selectedMoods.value.map(moodLabel => ({
          emoji: getMoodEmoji(moodLabel),
          label: moodLabel
        })),
        nickname: currentUser.userName || currentUser.nickname || currentUser.name || '用户',
        updateTime: '',
        userId: currentUser.id || currentUser.userId || 0,
        avatarUrl: currentUser.avatar || currentUser.avatarUrl || ''
      }
      
      if (selectedTtl.value !== null && selectedTtl.value > 0) {
        postData.deleteTtl = selectedTtl.value.toString()
        postData.supTtl = Date.now().toString()
      }
      
      const response = await publishPost(postData)
      
      if (response.code === 200 || response.code === 0) {
        showToast('动态发布成功！')
        resetForm()
        router.push('/')
      } else {
        throw new Error(response.message || '发布失败')
      }
    }
    
  } catch (error) {
    console.error('操作失败:', error)
    showToast(error.message || '操作失败，请重试')
  } finally {
    isPublishing.value = false
  }
}

// 重置表单 - 包含TTL重置
const resetForm = () => {
  postContent.value = ''
  mediaList.value = []
  location.value = null
  selectedMoods.value = []
  selectedTtl.value = null // 重置限时展示选择
}

// 添加编辑模式相关数据
const isEditMode = ref(false)
const editingMomentId = ref(null)
const isLoadingMoment = ref(false)

// 获取动态详情并回显
const fetchMomentDetail = async (momentId) => {
  try {
    isLoadingMoment.value = true
    console.log('获取动态详情:', momentId)
    
    const response = await getonlyup(momentId)
    console.log('动态详情响应:', response)
    
    if (response.code === 200 || response.code === 0) {
      const momentData = response.data
      
      // 回显内容
      postContent.value = momentData.content || ''
      
      // 回显图片
      if (momentData.imageList && Array.isArray(momentData.imageList)) {
        mediaList.value = momentData.imageList.map(url => ({
          type: 'image',
          url: url,
          file: null
        }))
      }
      
      // 回显心情（如果有）
      if (momentData.mood && Array.isArray(momentData.mood)) {
        selectedMoods.value = momentData.mood.map(m => m.label || m)
      }
      
      console.log('动态数据回显完成:', {
        content: postContent.value,
        images: mediaList.value,
        moods: selectedMoods.value
      })
      
    } else {
      throw new Error(response.message || '获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    showToast(error.message || '获取动态详情失败')
    // 获取失败时返回上一页
    router.go(-1)
  } finally {
    isLoadingMoment.value = false
  }
}

// 在组件挂载时检查是否为编辑模式
onMounted(async () => {
  const { mode, momentId } = route.query
  
  if (mode === 'edit' && momentId) {
    isEditMode.value = true
    editingMomentId.value = parseInt(momentId)
    
    // 获取动态详情并回显
    await fetchMomentDetail(momentId)
  }
  
  // 原有的用户信息获取逻辑
  if (userStore.userInfo) {
    userInfo.value = {
      name: userStore.userInfo.userName || userStore.userInfo.nickname || '用户',
      avatar: userStore.userInfo.avatar || userStore.userInfo.avatarUrl || 'https://picsum.photos/100/100?random=1',
      mood: '开心'
    }
  }
})
</script>

<style scoped>
.post-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef7f0 0%, rgba(255,182,193,0.05) 100%);
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-bar {
  background: white;
}

.nav-publish-btn {
  background: #FFB6C1;
  border: none;
  font-size: 14px;
  padding: 6px 16px;
}

.content-wrapper {
  padding: 16px;
  padding-bottom: 100px;
}

.card-hover {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 182, 193, 0.2);
}

.user-card {
  padding: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  border: 3px solid #FFB6C1;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.user-status {
  display: flex;
  align-items: center;
}

.mood-tag {
  background: linear-gradient(45deg, #FFB6C1, #FFC0CB);
  border: none;
  color: white;
}

.content-card {
  padding: 20px;
}

.content-input {
  background: transparent;
  border: none;
  font-size: 16px;
  line-height: 1.6;
}

.content-input :deep(.van-field__control) {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #333;
}

.content-input :deep(.van-field__control::placeholder) {
  color: #999;
}

.media-card {
  padding: 20px;
}

.media-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.media-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  border-color: #ff4757;
  color: #ff4757;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.media-item {
  position: relative;
}

.media-preview {
  cursor: pointer;
  transition: transform 0.2s;
}

.media-preview:hover {
  transform: scale(1.05);
}

.remove-media {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

.add-media-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  border: 2px dashed #FFB6C1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #FFB6C1;
}

.add-media-btn:hover {
  background: rgba(255, 182, 193, 0.1);
  border-color: #FF69B4;
}

.options-card {
  padding: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f5f5f5;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:hover {
  background: rgba(255, 182, 193, 0.05);
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
  border-radius: 8px;
}

.option-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 32px;
  text-align: center;
}

.option-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.option-arrow {
  color: #999;
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

.option-item:hover .option-arrow {
  transform: rotate(90deg);
}

.mood-card {
  padding: 20px;
}

.mood-header {
  margin-bottom: 16px;
}

.mood-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.mood-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mood-tag-item {
  background: linear-gradient(45deg, #FFB6C1, #FFC0CB);
  border: none;
  color: white;
  animation: fadeInUp 0.3s ease;
}

.location-content {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.3s ease;
}

.location-item:hover {
  background: rgba(255, 182, 193, 0.05);
}

.location-info h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 4px 0;
}

.location-info p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.mood-content {
  padding: 20px;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border: 2px solid #f5f5f5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mood-option:hover {
  border-color: #FFB6C1;
  background: rgba(255, 182, 193, 0.05);
}

.mood-option.selected {
  border-color: #FFB6C1;
  background: linear-gradient(45deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
}

.mood-emoji {
  font-size: 24px;
  margin-bottom: 8px;
}

.mood-name {
  font-size: 14px;
  color: #333;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .mood-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.add-media-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 限时展示选项卡片美化 */
.cute-option {
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(255, 240, 245, 0.8) 100%);
  border: 2px solid rgba(255, 182, 193, 0.2);
  border-radius: var(--van-radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cute-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.cute-option:active::before {
  transform: translateX(100%);
}

.cute-option:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
}

.option-icon-wrapper {
  margin-right: 12px;
}

.gradient-bg {
  background: linear-gradient(135deg, var(--van-primary-color) 0%, #ff8fa3 100%);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

.icon-emoji {
  font-size: 20px;
  display: block;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.option-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
  margin-bottom: 2px;
}

.option-desc {
  font-size: 13px;
  color: var(--van-text-color-2);
}

.cute-arrow {
  color: var(--van-primary-color);
  transition: transform 0.3s ease;
}

.cute-option:active .cute-arrow {
  transform: translateX(4px);
}

/* 选择器弹窗美化 */
.cute-picker {
  background: linear-gradient(180deg, #fff9f0 0%, #ffffff 100%);
  border-radius: 24px 24px 0 0;
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cute-header {
  background: linear-gradient(135deg, var(--van-primary-color) 0%, #ff8fa3 100%);
  padding: 24px 20px 20px;
  border-radius: 24px 24px 0 0;
  color: white;
  text-align: center;
  position: relative;
}

.cute-header::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-icon {
  font-size: 32px;
  margin-bottom: 8px;
  animation: cute-pulse 2s infinite;
}

.picker-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.picker-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

/* 选项列表美化 */
.cute-options {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.cute-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 182, 193, 0.1);
  border-radius: var(--van-radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  backdrop-filter: blur(10px);
}

.cute-option-item:hover {
  background: rgba(255, 240, 245, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.15);
}

.ttl-selected {
  border-color: var(--van-primary-color) !important;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.15) 0%, rgba(255, 240, 245, 0.9) 100%) !important;
  box-shadow: 0 6px 20px rgba(255, 182, 193, 0.25);
}

.ttl-selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
  border-radius: inherit;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.option-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.ttl-icon-wrapper {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.2) 0%, rgba(255, 240, 245, 0.5) 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.cute-option-item:hover .ttl-icon-wrapper {
  transform: scale(1.1);
  background: linear-gradient(135deg, var(--van-primary-color) 0%, #ff8fa3 100%);
}

.ttl-icon {
  font-size: 24px;
  transition: all 0.3s ease;
}

.cute-option-item:hover .ttl-icon {
  transform: scale(1.1);
}

.permanent-icon {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ttl-info {
  flex: 1;
}

.ttl-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.ttl-desc {
  font-size: 14px;
  color: var(--van-text-color-2);
  transition: color 0.3s ease;
}

.ttl-selected .ttl-label {
  color: var(--van-primary-color);
}

.option-right {
  margin-left: 12px;
}

/* 底部按钮组美化 */
.picker-footer {
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(255, 182, 193, 0.1);
  display: flex;
  gap: 12px;
  backdrop-filter: blur(10px);
}

.footer-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-btn {
  background: rgba(255, 182, 193, 0.1);
  color: var(--van-text-color-2);
  border: 2px solid rgba(255, 182, 193, 0.2);
}

.cancel-btn:active {
  background: rgba(255, 182, 193, 0.2);
  transform: scale(0.98);
}

.confirm-btn {
  background: linear-gradient(135deg, var(--van-primary-color) 0%, #ff8fa3 100%);
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
}

.confirm-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
}

/* 永久展示选项特殊样式 */
.permanent-option {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 240, 245, 0.8) 100%);
  border-color: rgba(255, 215, 0, 0.2);
}

.permanent-option:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 240, 245, 0.9) 100%);
}

.permanent-option.ttl-selected {
  border-color: #ffd700 !important;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 240, 245, 0.9) 100%) !important;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.25);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .cute-header {
    padding: 20px 16px 16px;
  }
  
  .picker-title {
    font-size: 18px;
  }
  
  .cute-options {
    padding: 16px;
  }
  
  .cute-option-item {
    padding: 16px 14px;
  }
  
  .footer-btn {
    height: 44px;
    font-size: 15px;
  }
}

/* 简洁版限时展示选择器样式 */
.ttl-picker-simple {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 简洁头部 */
.picker-header-simple {
  padding: 24px 20px 16px;
  text-align: center;
  border-bottom: 1px solid #f5f5f5;
}

.picker-title-simple {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.picker-subtitle-simple {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* 选项列表 */
.ttl-options-simple {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.ttl-option-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f8f8f8;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ttl-option-simple:last-child {
  border-bottom: none;
}

.ttl-option-simple:active {
  background-color: #f8f8f8;
}

.ttl-option-simple.selected {
  background-color: rgba(255, 182, 193, 0.08);
}

.option-content-simple {
  display: flex;
  align-items: center;
  flex: 1;
}

.option-icon-simple {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.permanent-icon {
  color: #ffa500;
}

.option-info-simple {
  flex: 1;
}

.option-label {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.option-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.3;
}

.option-check {
  margin-left: 12px;
  width: 20px;
  display: flex;
  justify-content: center;
}

/* 永久展示选项特殊样式 */
.permanent-simple.selected {
  background-color: rgba(255, 165, 0, 0.08);
}

/* 简洁按钮组 */
.picker-actions-simple {
  padding: 16px 20px 20px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #f5f5f5;
  background: #ffffff;
}

.action-btn {
  flex: 1;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
}

.cancel-simple {
  background: #f5f5f5;
  color: #666;
}

.cancel-simple:active {
  background: #e8e8e8;
}

.confirm-simple {
  background: #FFB6C1;
  color: white;
}

.confirm-simple:active {
  background: #ff9fb4;
}

/* 响应式优化 */
@media (max-width: 375px) {
  .picker-header-simple {
    padding: 20px 16px 12px;
  }
  
  .picker-title-simple {
    font-size: 17px;
  }
  
  .ttl-options-simple {
    padding: 12px 16px;
  }
  
  .ttl-option-simple {
    padding: 14px 0;
  }
  
  .picker-actions-simple {
    padding: 12px 16px 16px;
  }
  
  .action-btn {
    height: 42px;
    font-size: 15px;
  }
}


</style>



