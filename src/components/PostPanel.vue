<template>
  <div class="post-panel">
    <van-cell-group inset>
      <!-- 用户信息头部 -->
      <van-cell class="user-header">
        <template #icon>
          <van-image
            :src="userInfo.avatar"
            round
            width="40"
            height="40"
            class="user-avatar"
          />
        </template>
        <template #title>
          <div class="user-info">
            <span class="username">{{ userInfo.name }}</span>
            <van-tag type="primary" size="mini" round>{{ userInfo.mood }}</van-tag>
          </div>
        </template>
      </van-cell>
      
      <!-- 内容输入区 -->
      <van-cell class="content-input">
        <van-field
          v-model="postContent"
          type="textarea"
          placeholder="分享你的甜蜜时刻... 🌸"
          rows="4"
          autosize
          maxlength="500"
          show-word-limit
          class="post-textarea"
        />
      </van-cell>
      
      <!-- 媒体预览区 -->
      <van-cell v-if="mediaList.length" class="media-preview">
        <div class="media-grid">
          <div 
            v-for="(media, index) in mediaList" 
            :key="index"
            class="media-item"
            @click="previewMedia(index)"
          >
            <van-image
              v-if="media.type === 'image'"
              :src="media.url"
              fit="cover"
              width="80"
              height="80"
              radius="8"
            />
            <div v-else-if="media.type === 'video'" class="video-preview">
              <video :src="media.url" width="80" height="80"></video>
              <div class="video-play-icon">▶️</div>
            </div>
            
            <van-icon 
              name="cross" 
              class="media-delete"
              @click.stop="removeMedia(index)"
            />
          </div>
          
          <!-- 添加媒体按钮 -->
          <div 
            v-if="mediaList.length < 9"
            class="add-media-btn"
            @click="showMediaPicker = true"
          >
            <van-icon name="plus" size="24" />
          </div>
        </div>
      </van-cell>
      
      <!-- 位置信息 -->
      <van-cell v-if="location" class="location-info">
        <template #icon>
          <van-icon name="location-o" color="var(--van-primary-color)" />
        </template>
        <template #title>
          <span class="location-text">{{ location.name }}</span>
        </template>
        <template #right-icon>
          <van-icon name="cross" @click="location = null" />
        </template>
      </van-cell>
      
      <!-- 心情标签 -->
      <van-cell v-if="selectedMoods.length" class="mood-tags">
        <template #title>
          <div class="mood-list">
            <van-tag
              v-for="mood in selectedMoods"
              :key="mood"
              type="primary"
              size="mini"
              round
              closeable
              class="mood-tag"
              @close="removeMood(mood)"
            >
              {{ getMoodEmoji(mood) }} {{ mood }}
            </van-tag>
          </div>
        </template>
      </van-cell>
    </van-cell-group>
    
    <!-- 功能按钮区 -->
    <div class="action-bar">
      <van-button
        icon="photograph"
        type="default"
        size="small"
        round
        class="action-btn"
        @click="showMediaPicker = true"
      >
        图片
      </van-button>
      
      <van-button
        icon="location-o"
        type="default"
        size="small"
        round
        class="action-btn"
        @click="showLocationPicker = true"
      >
        位置
      </van-button>
      
      <van-button
        icon="smile-o"
        type="default"
        size="small"
        round
        class="action-btn"
        @click="showMoodPicker = true"
      >
        心情
      </van-button>
      
      <van-button
        icon="music-o"
        type="default"
        size="small"
        round
        class="action-btn"
        @click="showMusicPicker = true"
      >
        音乐
      </van-button>
    </div>
    
    <!-- 发布按钮 -->
    <div class="publish-section">
      <van-button
        type="primary"
        size="large"
        round
        block
        :loading="isPublishing"
        :disabled="!canPublish"
        class="publish-btn"
        @click="handlePublish"
      >
        {{ isPublishing ? '发布中...' : '发布动态' }} ✨
      </van-button>
    </div>
    
    <!-- 媒体选择器 -->
    <van-action-sheet
      v-model:show="showMediaPicker"
      :actions="mediaActions"
      @select="onMediaSelect"
      cancel-text="取消"
      title="选择媒体"
    />
    
    <!-- 位置选择器 -->
    <van-popup v-model:show="showLocationPicker" position="bottom" :style="{ height: '50%' }">
      <div class="location-picker">
        <div class="picker-header">
          <van-button type="default" size="mini" @click="showLocationPicker = false">
            取消
          </van-button>
          <span class="picker-title">选择位置</span>
          <van-button type="primary" size="mini" @click="confirmLocation">
            确定
          </van-button>
        </div>
        
        <div class="location-list">
          <van-cell
            v-for="loc in nearbyLocations"
            :key="loc.id"
            :title="loc.name"
            :label="loc.address"
            clickable
            @click="selectLocation(loc)"
          >
            <template #icon>
              <van-icon name="location-o" />
            </template>
          </van-cell>
        </div>
      </div>
    </van-popup>
    
    <!-- 心情选择器 -->
    <van-popup v-model:show="showMoodPicker" position="bottom" :style="{ height: '40%' }">
      <div class="mood-picker">
        <div class="picker-header">
          <van-button type="default" size="mini" @click="showMoodPicker = false">
            取消
          </van-button>
          <span class="picker-title">选择心情</span>
          <van-button type="primary" size="mini" @click="showMoodPicker = false">
            确定
          </van-button>
        </div>
        
        <div class="mood-grid">
          <div
            v-for="mood in availableMoods"
            :key="mood"
            class="mood-item"
            :class="{ 'mood-selected': selectedMoods.includes(mood) }"
            @click="toggleMood(mood)"
          >
            <div class="mood-emoji">{{ getMoodEmoji(mood) }}</div>
            <div class="mood-name">{{ mood }}</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showImagePreview, showToast } from 'vant'

const emit = defineEmits(['publish'])

// 用户信息
const userInfo = ref({
  name: '小甜心',
  avatar: 'https://picsum.photos/80/80?random=1',
  mood: '开心'
})

// 发布内容
const postContent = ref('')
const mediaList = ref([])
const location = ref(null)
const selectedMoods = ref([])
const isPublishing = ref(false)

// 弹窗状态
const showMediaPicker = ref(false)
const showLocationPicker = ref(false)
const showMoodPicker = ref(false)
const showMusicPicker = ref(false)

// 媒体选择选项
const mediaActions = [
  { name: '拍照', value: 'camera', icon: 'photograph' },
  { name: '从相册选择', value: 'album', icon: 'photo-o' },
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
  '平静', '思考', '期待', '满足', '幸福', '浪漫'
]

// 心情表情映射
const getMoodEmoji = (mood) => {
  const emojiMap = {
    '开心': '😊',
    '兴奋': '🤩',
    '甜蜜': '🥰',
    '温暖': '🤗',
    '感动': '🥺',
    '惊喜': '😲',
    '平静': '😌',
    '思考': '🤔',
    '期待': '😍',
    '满足': '😄',
    '幸福': '😘',
    '浪漫': '💕'
  }
  return emojiMap[mood] || '😊'
}

// 是否可以发布
const canPublish = computed(() => {
  return postContent.value.trim().length > 0 || mediaList.value.length > 0
})

// 处理媒体选择
const onMediaSelect = (action) => {
  showMediaPicker.value = false
  
  switch (action.value) {
    case 'camera':
      // 调用相机
      capturePhoto()
      break
    case 'album':
      // 选择相册
      selectFromAlbum()
      break
    case 'video':
      // 录制视频
      recordVideo()
      break
  }
}

// 模拟拍照
const capturePhoto = () => {
  // 这里应该调用实际的相机API
  const mockPhoto = {
    type: 'image',
    url: `https://picsum.photos/400/400?random=${Date.now()}`
  }
  mediaList.value.push(mockPhoto)
  showToast('照片添加成功')
}

// 模拟选择相册
const selectFromAlbum = () => {
  // 这里应该调用实际的相册API
  const mockImages = [
    { type: 'image', url: `https://picsum.photos/400/400?random=${Date.now()}` },
    { type: 'image', url: `https://picsum.photos/400/400?random=${Date.now() + 1}` }
  ]
  mediaList.value.push(...mockImages)
  showToast('图片添加成功')
}

// 模拟录制视频
const recordVideo = () => {
  // 这里应该调用实际的视频录制API
  const mockVideo = {
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  }
  mediaList.value.push(mockVideo)
  showToast('视频添加成功')
}

// 预览媒体
const previewMedia = (index) => {
  const media = mediaList.value[index]
  if (media.type === 'image') {
    const images = mediaList.value
      .filter(m => m.type === 'image')
      .map(m => m.url)
    showImagePreview(images)
  }
}

// 删除媒体
const removeMedia = (index) => {
  mediaList.value.splice(index, 1)
}

// 选择位置
const selectLocation = (loc) => {
  location.value = loc
}

// 确认位置
const confirmLocation = () => {
  showLocationPicker.value = false
  if (location.value) {
    showToast(`已选择位置: ${location.value.name}`)
  }
}

// 切换心情
const toggleMood = (mood) => {
  const index = selectedMoods.value.indexOf(mood)
  if (index > -1) {
    selectedMoods.value.splice(index, 1)
  } else if (selectedMoods.value.length < 3) {
    selectedMoods.value.push(mood)
  } else {
    showToast('最多只能选择3个心情标签')
  }
}

// 移除心情
const removeMood = (mood) => {
  const index = selectedMoods.value.indexOf(mood)
  if (index > -1) {
    selectedMoods.value.splice(index, 1)
  }
}

// 发布动态
const handlePublish = async () => {
  if (!canPublish.value) return
  
  isPublishing.value = true
  
  try {
    const postData = {
      content: postContent.value,
      media: mediaList.value,
      location: location.value,
      moods: selectedMoods.value,
      timestamp: Date.now()
    }
    
    // 模拟发布延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    emit('publish', postData)
    
    // 重置表单
    resetForm()
    
    showToast('动态发布成功！')
  } catch (error) {
    showToast('发布失败，请重试')
  } finally {
    isPublishing.value = false
  }
}

// 重置表单
const resetForm = () => {
  postContent.value = ''
  mediaList.value = []
  location.value = null
  selectedMoods.value = []
}
</script>

<style scoped>
.post-panel {
  background: var(--van-background);
  padding: 16px;
}

.user-header {
  padding: 12px 16px;
}

.user-avatar {
  margin-right: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 600;
  color: var(--van-text-color);
}

.content-input {
  padding: 0;
}

.post-textarea {
  border: none;
  background: transparent;
}

.media-preview {
  padding: 12px 16px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.media-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.video-preview {
  position: relative;
  width: 80px;
  height: 80px;
}

.video-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.media-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.add-media-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed var(--van-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--van-duration-base) var(--van-ease-out);
}

.add-media-btn:hover {
  border-color: var(--van-primary-color);
  background: rgba(255, 182, 193, 0.1);
}

.location-info {
  padding: 8px 16px;
}

.location-text {
  color: var(--van-primary-color);
  font-size: 14px;
}

.mood-tags {
  padding: 8px 16px;
}

.mood-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mood-tag {
  transition: all var(--van-duration-fast) var(--van-ease-out);
}

.action-bar {
  display: flex;
  gap: 12px;
  margin: 16px 0;
  padding: 0 4px;
}

.action-btn {
  flex: 1;
  transition: all var(--van-duration-base) var(--van-ease-out);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--van-shadow-2);
}

.publish-section {
  margin-top: 16px;
}

.publish-btn {
  background: linear-gradient(135deg, var(--van-primary-color), #FF69B4);
  border: none;
  font-weight: 600;
  transition: all var(--van-duration-base) var(--van-ease-out);
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--van-shadow-3);
}

.publish-btn:active:not(:disabled) {
  transform: translateY(0);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--van-border-color);
}

.picker-title {
  font-weight: 600;
  color: var(--van-text-color);
}

.location-picker,
.mood-picker {
  height: 100%;
  background: white;
}

.location-list {
  padding: 8px 0;
  max-height: calc(100% - 60px);
  overflow-y: auto;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  max-height: calc(100% - 60px);
  overflow-y: auto;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--van-duration-base) var(--van-ease-out);
  border: 2px solid transparent;
}

.mood-item:hover {
  background: var(--van-gray-1);
  transform: scale(1.05);
}

.mood-selected {
  background: rgba(255, 182, 193, 0.2);
  border-color: var(--van-primary-color);
}

.mood-emoji {
  font-size: 24px;
  margin-bottom: 4px;
}

.mood-name {
  font-size: 12px;
  color: var(--van-text-color-2);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .mood-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .action-bar {
    flex-wrap: wrap;
  }
  
  .action-btn {
    min-width: calc(50% - 6px);
  }
}
</style>