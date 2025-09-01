<template>
  <div class="profile-page">
    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-section">
          <van-image 
            :src="userInfo.avatar" 
            fit="cover" 
            round 
            width="80" 
            height="80"
            @click="showAvatarModal = true"
          />
          <div class="edit-avatar-btn">
            <van-icon name="photograph" size="16" />
          </div>
        </div>
        <div class="user-info">
          <h2>{{ userInfo.userName || '用户' }}</h2>
          <p>{{ userInfo.age || '未设置' }}岁 · {{ getGenderText(userInfo.gender) }}</p>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.likes }}</span>
              <span class="stat-label">获赞</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.matches }}</span>
              <span class="stat-label">匹配</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ userInfo.visitors }}</span>
              <span class="stat-label">访客</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profile-bio">
        <p>{{ userInfo.signature || '这个人很懒，什么都没有留下...' }}</p>
        <div class="user-tags">
          <span v-for="tag in userTags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell 
          title="编辑资料" 
          icon="edit" 
          is-link 
          @click="showEditModal = true"
        />
        <van-cell 
          title="我的相册" 
          icon="photo-o" 
          is-link 
          @click="showPhotoModal = true"
        />
        <van-cell 
          title="隐私设置" 
          icon="shield-o" 
          is-link 
          @click="showPrivacyModal = true"
        />
        <van-cell 
          title="账户安全" 
          icon="lock" 
          is-link 
        />
      </van-cell-group>
      
      <van-cell-group inset>
        <van-cell 
          title="会员中心" 
          icon="diamond-o" 
          is-link 
          label="解锁更多特权"
        />
        <van-cell 
          title="邀请好友" 
          icon="friends-o" 
          is-link 
          label="获得奖励"
        />
        <van-cell 
          title="帮助中心" 
          icon="question-o" 
          is-link 
        />
      </van-cell-group>
      
      <van-cell-group inset>
        <van-cell 
          title="设置" 
          icon="setting-o" 
          is-link 
          @click="showSettingsModal = true"
        />
        <van-cell 
          title="关于我们" 
          icon="info-o" 
          is-link 
        />
      </van-cell-group>
    </div>

    <!-- 编辑资料弹窗 -->
    <van-popup v-model:show="showEditModal" position="bottom" :style="{ height: '80%' }">
      <div class="edit-modal">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <van-button type="primary" size="mini" @click="saveProfile">
            保存
          </van-button>
        </div>
        
        <van-form>
          <van-cell-group inset>
            <van-field
              v-model="editForm.username"
              label="昵称"
              placeholder="请输入昵称"
              required
            />
            <van-field
              v-model="editForm.age"
              label="年龄"
              placeholder="请输入年龄"
              type="number"
            />
            <van-field
              name="gender"
              label="性别"
            >
              <template #input>
                <van-radio-group v-model="editForm.gender" direction="horizontal">
                  <van-radio :name="1">男</van-radio>
                  <van-radio :name="0">女</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model="editForm.signature"
              label="个人简介"
              type="textarea"
              placeholder="介绍一下自己吧"
              rows="3"
              autosize
            />
          </van-cell-group>
          
          <div class="tag-section">
            <h4>兴趣标签</h4>
            <div class="tag-grid">
              <div 
                v-for="tag in allTags" 
                :key="tag"
                class="tag-item"
                :class="{ active: editForm.tags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 相册弹窗 -->
    <van-popup v-model:show="showPhotoModal" position="bottom" :style="{ height: '70%' }">
      <div class="photo-modal">
        <div class="modal-header">
          <h3>我的相册</h3>
          <van-button type="primary" size="mini" @click="addPhoto">
            添加照片
          </van-button>
        </div>
        
        <div class="photo-grid">
          <div 
            v-for="(photo, index) in userInfo.photos" 
            :key="index"
            class="photo-item"
          >
            <van-image :src="photo" fit="cover" width="100%" height="120" />
            <div class="photo-actions">
              <van-icon name="delete-o" @click="deletePhoto(index)" />
            </div>
          </div>
          <div class="add-photo-btn" @click="addPhoto">
            <van-icon name="plus" size="32" />
            <span>添加照片</span>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 隐私设置弹窗 -->
    <van-popup v-model:show="showPrivacyModal" position="bottom" :style="{ height: '60%' }">
      <div class="privacy-modal">
        <div class="modal-header">
          <h3>隐私设置</h3>
          <van-icon name="cross" @click="showPrivacyModal = false" />
        </div>
        
        <van-cell-group inset>
          <van-cell title="显示在线状态">
            <template #right-icon>
              <van-switch v-model="privacySettings.showOnline" />
            </template>
          </van-cell>
          <van-cell title="允许陌生人查看资料">
            <template #right-icon>
              <van-switch v-model="privacySettings.allowStrangers" />
            </template>
          </van-cell>
          <van-cell title="显示距离信息">
            <template #right-icon>
              <van-switch v-model="privacySettings.showDistance" />
            </template>
          </van-cell>
          <van-cell title="接收消息推送">
            <template #right-icon>
              <van-switch v-model="privacySettings.pushNotification" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 设置弹窗 -->
    <van-popup v-model:show="showSettingsModal" position="bottom" :style="{ height: '50%' }">
      <div class="settings-modal">
        <div class="modal-header">
          <h3>设置</h3>
          <van-icon name="cross" @click="showSettingsModal = false" />
        </div>
        
        <van-cell-group inset>
          <van-cell title="清除缓存" is-link @click="clearCache" />
          <van-cell title="检查更新" is-link @click="checkUpdate" />
          <van-cell title="意见反馈" is-link />
          <van-cell title="退出登录" is-link @click="logout" />
        </van-cell-group>
      </div>
    </van-popup>

    <!-- 头像选择弹窗 -->
    <van-popup v-model:show="showAvatarModal" :style="{ padding: '20px' }">
      <div class="avatar-modal">
        <h3>更换头像</h3>
        <div class="avatar-options">
          <van-button block type="primary" @click="chooseFromGallery">
            从相册选择
          </van-button>
          <van-button block plain @click="takePhoto">
            拍照
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user.js'
import { getCurrentUser, updateUser, uploadAvatar, uploadBackground, getUserProfile } from '../api/user.js'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const showEditModal = ref(false)
const showPhotoModal = ref(false)
const showPrivacyModal = ref(false)
const showSettingsModal = ref(false)
const showAvatarModal = ref(false)

// 获取用户store
const userStore = useUserStore()

// 用户信息
const userInfo = ref({
  id: null,
  userAccount: '',
  userName: '用户',
  age: null,
  gender: null,
  avatar: '',
  background: '',
  signature: '',
  tags: '',
  likes: 0,
  matches: 0,
  visitors: 0,
  photos: []
})

// 编辑表单
const editForm = reactive({
  username: '',
  age: '',
  gender: null,
  signature: '',
  tags: []
})

// 隐私设置
const privacySettings = reactive({
  showOnline: true,
  allowStrangers: true,
  showDistance: true,
  pushNotification: true
})

// 所有标签
const allTags = ref([
  '温柔', '阳光', '活泼', '文艺', '运动', '音乐', '电影', '旅行',
  '美食', '摄影', '读书', '游戏', '动漫', '宠物', '花艺', '舞蹈'
])

// 方法
const saveProfile = async () => {
  try {
    const updateData = {
      id: userInfo.value.id,
      username: editForm.username,
      age: parseInt(editForm.age) || null,
      gender: editForm.gender,
      signature: editForm.signature,
      tags: JSON.stringify(editForm.tags)
    }

    const success = await updateProfile(updateData)
    if (success) {
      showEditModal.value = false
    }
  } catch (error) {
    console.error('保存资料失败:', error)
    showToast('保存失败')
  }
}

const toggleTag = (tag) => {
  const index = editForm.tags.indexOf(tag)
  if (index > -1) {
    editForm.tags.splice(index, 1)
  } else {
    if (editForm.tags.length < 5) {
      editForm.tags.push(tag)
    }
  }
}

const addPhoto = () => {
  console.log('添加照片')
  // 这里可以调用相机或相册API
}

const deletePhoto = (index) => {
  userInfo.value.photos.splice(index, 1)
}

const chooseFromGallery = () => {
  console.log('从相册选择')
  showAvatarModal.value = false
}

const takePhoto = () => {
  console.log('拍照')
  showAvatarModal.value = false
}

const clearCache = () => {
  console.log('清除缓存')
}

const checkUpdate = () => {
  console.log('检查更新')
}

const logout = async () => {
  try {
    // 显示确认对话框
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    console.log('开始退出登录')

    // 调用用户store的logout方法
    await userStore.logout()

    showToast({
      type: 'success',
      message: '已退出登录'
    })

    // 跳转到登录页面
    router.replace('/login')

  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
      showToast({
        type: 'fail',
        message: '退出登录失败'
      })
    }
  }
}

// 初始化编辑表单
const initEditForm = () => {
  editForm.username = userInfo.value.userName || ''
  editForm.age = userInfo.value.age ? userInfo.value.age.toString() : ''
  editForm.gender = userInfo.value.gender
  editForm.signature = userInfo.value.signature || ''
  editForm.tags = [...userTags.value]
}

// 解析标签字符串为数组
const parseTags = (tagsStr) => {
  if (!tagsStr) return []
  try {
    return JSON.parse(tagsStr)
  } catch {
    return tagsStr.split(',').filter(tag => tag.trim())
  }
}

// 获取标签数组
const userTags = computed(() => parseTags(userInfo.value.tags))

// 获取性别文本
const getGenderText = (gender) => {
  if (gender === 0) return '女'
  if (gender === 1) return '男'
  return '未设置'
}

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    loading.value = true
    console.log('开始获取用户信息...')

    // 使用新的API端点
    const response = await getUserProfile()
    console.log('获取用户信息响应:', response)

    if (response.code === 200 || response.code === 0) {
      const data = response.data
      console.log('用户数据:', data)

      // 确保数据类型正确
      userInfo.value = {
        id: String(data.id),
        userAccount: data.userAccount || '',
        userName: data.userName || '用户',
        age: Number(data.age) || null,
        gender: Number(data.gender),
        avatar: data.avatar || '',
        background: data.background || '',
        signature: data.signature || '',
        tags: data.tags || '[]',
        height: data.height || '',
        profession: data.profession || '',
        education: data.education || '',
        hometown: data.hometown || '',
        zodiac: data.zodiac || '',
        relationshipStatus: Number(data.relationshipStatus) || 0,
        likes: 0,
        matches: 0,
        visitors: 0,
        photos: []
      }

      console.log('更新后的用户信息:', userInfo.value)
      console.log('解析后的标签:', userTags.value)

      // 更新编辑表单
      initEditForm()
    } else {
      console.error('获取用户信息失败:', response)
      showToast(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    showToast('获取用户信息失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 更新用户信息
const updateProfile = async (updateData) => {
  try {
    loading.value = true
    const response = await updateUser(updateData)

    if (response.code === 200 || response.code === 0) {
      showToast('更新成功')
      await fetchUserProfile() // 重新获取用户信息
      return true
    } else {
      showToast(response.message || '更新失败')
      return false
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    showToast('更新失败')
    return false
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('个人资料页面加载完成')

  // 首先从store获取用户信息
  if (userStore.userInfo) {
    console.log('从store获取用户信息:', userStore.userInfo)
    userInfo.value = {
      id: userStore.userInfo.id,
      userAccount: userStore.userInfo.userAccount,
      userName: userStore.userInfo.userName,
      age: userStore.userInfo.age,
      gender: userStore.userInfo.gender,
      avatar: userStore.userInfo.avatar,
      background: userStore.userInfo.background,
      signature: userStore.userInfo.signature,
      tags: userStore.userInfo.tags,
      likes: 0,
      matches: 0,
      visitors: 0,
      photos: []
    }
    initEditForm()
  }

  // 然后获取最新的用户信息
  await fetchUserProfile()
})
</script>

<style scoped>
.profile-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--cream-white) 0%, rgba(255,182,193,0.05) 100%);
  padding-bottom: 80px;
  margin: 0;
  padding-left: 0;
  padding-right: 0;
}

.profile-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-card);
  margin: var(--spacing-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  width: calc(100% - 2 * var(--spacing-md));
}

.profile-header {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.avatar-section {
  position: relative;
}

.edit-avatar-btn {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 28px;
  height: 28px;
  background: var(--primary-pink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.user-info {
  flex: 1;
}

.user-info h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.user-info p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.user-stats {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-pink);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.profile-bio p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 182, 193, 0.2);
  color: var(--primary-pink);
  border-radius: 12px;
  font-size: 12px;
}

.menu-section {
  padding: 0 var(--spacing-lg);
}

.menu-section .van-cell-group {
  margin-bottom: var(--spacing-lg);
}

.edit-modal, .photo-modal, .privacy-modal, .settings-modal {
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

.tag-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.tag-section h4 {
  font-size: 16px;
  margin-bottom: var(--spacing-md);
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.photo-item {
  position: relative;
  border-radius: var(--radius-card);
  overflow: hidden;
}

.photo-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}

.add-photo-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-photo-btn:hover {
  border-color: var(--primary-pink);
  background: rgba(255, 182, 193, 0.05);
}

.add-photo-btn span {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.avatar-modal {
  text-align: center;
}

.avatar-modal h3 {
  margin-bottom: var(--spacing-lg);
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .tag-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>


