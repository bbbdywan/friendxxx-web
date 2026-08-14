<template>
  <div class="profile-page">
    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <!-- 背景图 -->
      <div class="profile-background" :style="{ backgroundImage: `url(${userInfo.background})` }">
        <div class="background-overlay"></div>
      </div>
      
      <!-- 头像和基本信息 -->
      <div class="profile-header">
        <div class="avatar-section">
          <van-image 
            :src="userInfo.avatar || 'https://picsum.photos/120/120?random=1'" 
            fit="cover" 
            round 
            width="100" 
            height="100"
            @click="showAvatarModal = true"
          />
          <div class="edit-avatar-btn">
            <van-icon name="photograph" size="16" />
          </div>
          <div class="online-status" v-if="userInfo.isOnline"></div>
        </div>
        
        <div class="user-basic-info">
          <h2>{{ userInfo.userName || '用户' }}</h2>
          <div class="user-meta">
            <span class="age-gender">{{ userInfo.age || '未设置' }}岁 · {{ getGenderText(userInfo.gender) }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <!-- 移除编辑按钮 -->
        </div>
      </div>
      
      <!-- 个人简介 -->
      <div class="profile-bio">
        <p>{{ userInfo.signature || '这个人很懒，什么都没有留下...' }}</p>
      </div>
      
      <!-- 标签 -->
      <div class="user-tags" v-if="userTags.length > 0">
        <span v-for="tag in userTags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 详细信息卡片 -->
    <div class="detail-card">
      <div class="detail-section">
        <div class="detail-item">
          <span class="detail-label">身高</span>
          <span class="detail-value">{{ userInfo.height }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">职业</span>
          <span class="detail-value">{{ userInfo.profession }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">学历</span>
          <span class="detail-value">{{ userInfo.education }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">星座</span>
          <span class="detail-value">{{ userInfo.constellation }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">家乡</span>
          <span class="detail-value">{{ userInfo.hometown }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">感情状态</span>
          <span class="detail-value">{{ getRelationshipStatus(userInfo.relationshipStatus) }}</span>
        </div>
      </div>
    </div>

    <!-- 兴趣爱好 -->
    <div class="interest-card" v-if="userInterests.length > 0">
      <h3>兴趣爱好</h3>
      <div class="interest-grid">
        <div v-for="interest in userInterests" :key="interest.name" class="interest-item">
          <div class="interest-icon">{{ interest.icon }}</div>
          <span class="interest-name">{{ interest.name }}</span>
        </div>
      </div>
    </div>

    <!-- 照片墙 -->
    <div class="photo-wall" v-if="userInfo.photos && userInfo.photos.length > 0">
      <h3>我的照片</h3>
      <div class="photo-grid">
        <div v-for="(photo, index) in userInfo.photos" :key="index" class="photo-item">
          <van-image :src="photo" fit="cover" @click="previewPhoto(index)" />
        </div>
        <div class="add-photo-btn" @click="showPhotoModal = true">
          <van-icon name="plus" size="24" />
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell
          title="修改个人资料"
          icon="edit"
          is-link
          @click="openEditModal"
        />
      </van-cell-group>

      <van-cell-group inset>
        <van-cell
          title="AI提示词设置"
          icon="chat-o"
          is-link
          label="自定义AI人设与对话风格"
          @click="router.push('/prompt')"
        />
      </van-cell-group>

      <!-- 管理员专属入口 -->
      <van-cell-group inset>
        <van-cell 
          title="管理员专属界面" 
          icon="manager-o" 
          is-link 
          @click="goToAdmin"
          class="admin-cell"
        />
      </van-cell-group>

      <van-cell-group inset>
        <van-cell 
          title="退出登录" 
          icon="sign" 
          is-link 
          @click="logout"
          class="logout-cell"
        />
      </van-cell-group>
    </div>

    <!-- 编辑资料弹窗 -->
    <van-popup v-model:show="showEditModal" position="bottom" :style="{ height: '90%' }">
      <div class="edit-modal">
        <div class="edit-header">
          <van-button text @click="showEditModal = false">取消</van-button>
          <h3>编辑资料</h3>
          <van-button type="primary" text @click="saveProfile">保存</van-button>
        </div>
        
        <div class="edit-content">
          <!-- 预览卡片 -->
          <div class="preview-card">
            <!-- 背景图预览 -->
            <div class="preview-background" :style="{ backgroundImage: `url(${userInfo.background})` }">
              <div class="background-overlay"></div>
              <van-button 
                size="small" 
                round 
                class="change-bg-btn"
                @click="changeBackground"
              >
                更换背景
              </van-button>
            </div>
            
            <!-- 头像和基本信息预览 -->
            <div class="preview-header">
              <div class="preview-avatar-section">
                <van-image 
                  :src="userInfo.avatar || 'https://picsum.photos/120/120?random=1'" 
                  fit="cover" 
                  round 
                  width="60" 
                  height="60"
                  @click="changeAvatar"
                />
                <div class="edit-avatar-icon">
                  <van-icon name="photograph" size="12" />
                </div>
              </div>
              
              <div class="preview-user-info">
                <h4>{{ editForm.userName || '用户' }}</h4>
                <span>{{ editForm.age || '未设置' }}岁 · {{ getGenderText(editForm.gender) }}</span>
              </div>
            </div>
            
            <!-- 标签预览 -->
            <div class="preview-tags" v-if="previewTags.length > 0">
              <span v-for="tag in previewTags" :key="tag" class="preview-tag">
                {{ tag }}
              </span>
            </div>
            
            <!-- 个人简介预览 -->
            <div class="preview-bio">
              <p>{{ editForm.signature || '这个人很懒，什么都没有留下...' }}</p>
            </div>
          </div>
          
          <!-- 编辑表单 -->
          <van-form @submit="saveProfile">
            <!-- 基本信息：昵称、年龄、性别 -->
            <van-cell-group>
              <van-field v-model="editForm.userName" label="昵称" placeholder="请输入昵称" />
              <van-field v-model="editForm.age" label="年龄" type="number" placeholder="请输入年龄" />
              
              <!-- 性别选择卡片 -->
              <van-cell title="性别">
                <template #value>
                  <div class="gender-selector">
                    <div 
                      class="gender-card"
                      :class="{ active: editForm.gender === 0 }"
                      @click="editForm.gender = 0"
                    >
                      <div class="gender-icon">👩</div>
                      <span class="gender-text">女生</span>
                    </div>
                    <div 
                      class="gender-card"
                      :class="{ active: editForm.gender === 1 }"
                      @click="editForm.gender = 1"
                    >
                      <div class="gender-icon">👨</div>
                      <span class="gender-text">男生</span>
                    </div>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
            
            <!-- 身高学历星座 -->
            <van-cell-group>
              <van-field v-model="editForm.height" label="身高" type="number" placeholder="请输入身高(cm)" />
              <van-field v-model="editForm.education" label="学历" placeholder="请输入学历" />
              <van-field v-model="editForm.zodiac" label="星座" placeholder="请输入星座" />
            </van-cell-group>
            
            <!-- 家乡职业 -->
            <van-cell-group>
              <van-field v-model="editForm.hometown" label="家乡" placeholder="请输入家乡" />
              <van-field v-model="editForm.profession" label="职业" placeholder="请输入职业" />
            </van-cell-group>
            
            <!-- 个性签名 -->
            <van-cell-group>
              <van-field v-model="editForm.signature" label="个性签名" type="textarea" placeholder="介绍一下自己吧..." />
            </van-cell-group>
            
            <!-- 个性标签 -->
            <van-cell-group>
              <van-cell 
                title="个性标签" 
                is-link 
                @click="editTags"
                :value="selectedTagsText"
              />
            </van-cell-group>
            
            <!-- 感情状态 -->
            <van-cell-group>
              <van-cell 
                title="感情状态" 
                is-link 
                @click="showRelationshipPicker = true"
                :value="relationshipText"
              />
            </van-cell-group>
          </van-form>
        </div>
      </div>
    </van-popup>

    <!-- 头像预览弹窗 -->
    <van-popup v-model:show="showAvatarModal" closeable>
      <div class="avatar-preview">
        <van-image :src="userInfo.avatar" fit="contain" />
      </div>
    </van-popup>

    <!-- 照片弹窗 -->
    <van-popup v-model:show="showPhotoModal" position="bottom" :style="{ height: '60%' }">
      <div class="photo-modal">
        <div class="photo-header">
          <h3>我的照片</h3>
          <van-button icon="cross" @click="showPhotoModal = false" />
        </div>
        <div class="photo-content">
          <p>照片功能开发中...</p>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
defineOptions({ name: 'NewProfilePage' })
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { getCurrentUser, updateUser, uploadAvatar, getUserProfile } from '../api/user.js'
import { showToast, showLoadingToast, showSuccessToast, closeToast, showConfirmDialog } from 'vant'
import { getApiErrorMessage } from '../utils/error.js'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const showEditModal = ref(false)
const showAvatarModal = ref(false)
const showPhotoModal = ref(false)
const showRelationshipPicker = ref(false)

// 性别选项
const genderColumns = [
  { text: '女', value: 0 },
  { text: '男', value: 1 }
]

// 感情状态选项
const relationshipColumns = [
  { text: '单身', value: 0 },
  { text: '恋爱中', value: 1 },
  { text: '已婚', value: 2 }
]

// 感情状态确认
const onRelationshipConfirm = ({ selectedValues }) => {
  editForm.value.relationshipStatus = selectedValues[0]
  showRelationshipPicker.value = false
}

// 用户信息
const userInfo = ref({
  id: '',
  userAccount: '',
  userName: '',
  age: null,
  gender: null,
  avatar: '',
  background: '',
  signature: '',
  tags: '',
  height: '',
  profession: '',
  education: '',
  constellation: '',
  hometown: '',
  relationshipStatus: 0,
  location: '',
  distance: '',
  isOnline: false,
  likes: 0,
  matches: 0,
  visitors: 0,
  photos: []
})

// 编辑表单数据
const editForm = ref({
  userName: '',
  age: null,
  gender: null, // 改为null，让初始化方法来设置
  signature: '',
  height: null,
  profession: '',
  education: '',
  hometown: '',
  zodiac: '',
  relationshipStatus: 0
})

// 计算属性
const userTags = computed(() => {
  if (!userInfo.value.tags) return []
  try {
    return JSON.parse(userInfo.value.tags)
  } catch {
    return []
  }
})

// 判断是否为管理员（可以根据 userAccount, id 或其他字段判断）
const isAdmin = computed(() => {
  // 方式1: 根据用户账号判断
  if (userInfo.value?.userAccount === 'admin') return true
  
  // 方式2: 根据用户ID判断（示例：ID为1的是管理员）
  if (userInfo.value?.id === '1' || userInfo.value?.id === 1) return true
  
  // 方式3: 根据用户的 role 字段判断（如果后端提供）
  if (userInfo.value?.role === 'admin') return true
  
  return false
})

const genderText = computed(() => {
  const gender = editForm.value?.gender
  console.log('计算性别文本，当前gender值:', gender, typeof gender)
  if (gender === 0) return '女'
  if (gender === 1) return '男'
  return ''
})

const relationshipText = computed(() => {
  return getRelationshipStatus(editForm.value.relationshipStatus)
})

// 添加预览标签计算属性
const previewTags = computed(() => {
  const tags = []
  if (editForm.value.height) tags.push(`${editForm.value.height}cm`)
  if (editForm.value.profession) tags.push(editForm.value.profession)
  if (editForm.value.education) tags.push(editForm.value.education)
  if (editForm.value.hometown) tags.push(editForm.value.hometown)
  return tags
})

// 兴趣爱好数据
const userInterests = computed(() => [
  { name: '咖啡', icon: '☕' },
  { name: '读书', icon: '📚' },
  { name: '旅行', icon: '✈️' },
  { name: '音乐', icon: '🎵' },
  { name: '电影', icon: '🎬' },
  { name: '运动', icon: '🏃' }
])

// 添加标签相关数据和方法
const selectedUserTags = ref([])

// 计算属性 - 显示选中的标签文本
const selectedTagsText = computed(() => {
  if (selectedUserTags.value.length === 0) return '请选择标签'
  if (selectedUserTags.value.length <= 3) {
    return selectedUserTags.value.join('、')
  }
  return `${selectedUserTags.value.slice(0, 3).join('、')}等${selectedUserTags.value.length}个`
})

// 编辑标签方法
const editTags = () => {
  router.push({
    path: '/tags-edit',
    query: {
      tags: JSON.stringify(selectedUserTags.value)
    }
  })
}

// 方法
const getGenderText = (gender) => {
  console.log('getGenderText 接收到的值:', gender, typeof gender)
  if (gender === 0) return '女'
  if (gender === 1) return '男'
  return ''
}

const getRelationshipStatus = (status) => {
  const statusMap = {
    0: '单身',
    1: '恋爱中',
    2: '已婚',
    3: '离异',
    4: '保密'
  }
  return statusMap[status] || '单身'
}

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    loading.value = true
    
    // 使用新的API端点
    const response = await getUserProfile()
    
    if (response.code === 200 || response.code === 0) {
      const data = response.data
      
      console.log('原始性别数据:', data.gender, typeof data.gender)

      userInfo.value = {
        id: String(data.id),
        userAccount: data.userAccount || '',
        userName: data.userName || '用户',
        age: Number(data.age) || null,
        gender: data.gender !== null && data.gender !== undefined ? Number(data.gender) : null,
        avatar: data.avatar || '',
        background: data.background || '',
        signature: data.signature || '',
        tags: data.tags || '[]',
        height: data.height || '未填写',
        profession: data.profession || '未填写',
        education: data.education || '未填写',
        hometown: data.hometown || '未填写',
        constellation: data.zodiac || '未填写',
        relationshipStatus: Number(data.relationshipStatus) || 0,
        location: data.location || '北京',
        distance: data.distance || '1.2',
        isOnline: data.isOnline || false,
        likes: 0,
        matches: 0,
        visitors: 0,
        photos: data.photos || []
      }

      console.log('处理后的用户信息:', userInfo.value)
      
      // 重要：获取用户信息后立即初始化编辑表单
      initEditForm()
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    showToast(getApiErrorMessage(error, '获取用户信息失败'))
  } finally {
    loading.value = false
  }
}

// 初始化编辑表单
const initEditForm = () => {
  console.log('开始初始化编辑表单，userInfo.gender:', userInfo.value.gender)
  
  editForm.value = {
    userName: userInfo.value.userName || '',
    age: userInfo.value.age || null,
    gender: userInfo.value.gender,
    signature: userInfo.value.signature || '',
    height: userInfo.value.height === '未填写' ? null : parseInt(userInfo.value.height),
    profession: userInfo.value.profession === '未填写' ? '' : userInfo.value.profession,
    education: userInfo.value.education === '未填写' ? '' : userInfo.value.education,
    hometown: userInfo.value.hometown === '未填写' ? '' : userInfo.value.hometown,
    zodiac: userInfo.value.constellation === '未填写' ? '' : userInfo.value.constellation,
    relationshipStatus: userInfo.value.relationshipStatus || 0
  }
  
  // 初始化标签
  selectedUserTags.value = userTags.value || []
  
  console.log('初始化完成，editForm.gender:', editForm.value.gender)
  console.log('genderText应该显示:', getGenderText(editForm.value.gender))
  
  // 强制触发响应性更新
  nextTick(() => {
    console.log('nextTick后的genderText:', getGenderText(editForm.value.gender))
  })
}

// 显示编辑弹窗时初始化表单
const openEditModal = () => {
  initEditForm()
  showEditModal.value = true
}

// 保存用户资料
const saveProfile = async () => {
  try {
    showLoadingToast('保存中...')
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.id
    
    if (!userId) {
      throw new Error('用户ID不存在，请重新登录')
    }
    
    // 构造更新参数
    const updateParams = {
      id: parseInt(userId),
      username: editForm.value.userName,
      age: editForm.value.age ? parseInt(editForm.value.age) : null,
      gender: parseInt(editForm.value.gender), // 0=女, 1=男
      signature: editForm.value.signature,
      height: editForm.value.height ? parseInt(editForm.value.height) : null,
      profession: editForm.value.profession || null,
      education: editForm.value.education || null,
      hometown: editForm.value.hometown || null,
      zodiac: editForm.value.zodiac || null,
      relationship_status: parseInt(editForm.value.relationshipStatus) // 0=单身, 1=恋爱中, 2=已婚
    }
    
    console.log('更新参数:', updateParams)
    
    const result = await updateUser(updateParams)
    
    if (result.code === 200 || result.code === 0) {
      showSuccessToast('保存成功')
      showEditModal.value = false
      await fetchUserProfile()
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    showToast(getApiErrorMessage(error, '保存失败，请重试'))
  } finally {
    closeToast()
  }
}

// 预览照片
const previewPhoto = (index) => {
  // TODO: 实现照片预览
  console.log('预览照片:', index)
}

// 更换背景图
const changeBackground = async () => {
  try {
    // 创建文件输入元素
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        showLoadingToast('上传中...')
        
        // 使用相同的接口，type=background
        const result = await uploadAvatar(file, 'background')
        
        if (result.code === 200 || result.code === 0) {
          // 更新背景图
          userInfo.value.background = result.data
          showSuccessToast('背景图更新成功')
          await fetchUserProfile() // 重新获取用户信息
        } else {
          throw new Error(result.message || '上传失败')
        }
      } catch (error) {
        console.error('上传背景图失败:', error)
        showToast(getApiErrorMessage(error, '上传失败，请重试'))
      } finally {
        closeToast()
      }
    }
    
    input.click()
  } catch (error) {
    console.error('选择文件失败:', error)
  }
}

// 更换头像
const changeAvatar = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        showLoadingToast('上传中...')
        
        // 使用相同的接口，type=avatar
        const result = await uploadAvatar(file, 'avatar')
        
        if (result.code === 200 || result.code === 0) {
          // 更新头像
          userInfo.value.avatar = result.data
          showSuccessToast('头像更新成功')
          await fetchUserProfile()
        } else {
          throw new Error(result.message || '上传失败')
        }
      } catch (error) {
        console.error('上传头像失败:', error)
        showToast(getApiErrorMessage(error, '上传失败，请重试'))
      } finally {
        closeToast()
      }
    }
    
    input.click()
  } catch (error) {
    console.error('选择文件失败:', error)
  }
}

// 跳转到管理员页面
const goToAdmin = () => {
  router.push('/admin')
}

// 退出登录
const logout = async () => {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })

    showLoadingToast('退出中...')
    
    await userStore.logout()
    
    showSuccessToast('已退出登录')
    
    router.replace('/login')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
      showToast(getApiErrorMessage(error, '退出登录失败'))
    }
  } finally {
    closeToast()
  }
}

// 页面加载时获取用户信息
onMounted(async () => {
  console.log('页面加载，开始获取用户信息')
  await fetchUserProfile()
})
</script>

<style scoped>
.profile-page {
  background: var(--color-background);
  min-height: 100vh;
  padding-bottom: 80px;
}

/* 个人信息卡片 */
.profile-card {
  position: relative;
  background: white;
  margin-bottom: 12px;
  overflow: hidden;
}

.profile-background {
  height: 200px;
  background-size: cover;
  background-position: center;
  background-color: var(--primary-pink);
  position: relative;
}

.background-overlay {
  display: none;
}

.profile-header {
  position: relative;
  padding: 20px;
  margin-top: -30px;
  display: flex;
  align-items: flex-end;
  gap: 15px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-section .van-image {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: var(--primary-pink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.online-status {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
}

.user-basic-info {
  flex: 1;
  min-width: 0;
}

.user-basic-info h2 {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.age-gender {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.action-buttons {
  flex-shrink: 0;
}

.profile-bio {
  padding: 0 20px 15px;
}

.profile-bio p {
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0 0 15px 0;
}

.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 20px;
}

.tag {
  background: var(--primary-pink-light);
  color: var(--primary-pink);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

/* 详细信息卡片 */
.detail-card {
  background: white;
  margin: 12px 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.detail-section {
  padding: 20px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  color: #666;
}

/* 兴趣爱好 */
.interest-card {
  background: white;
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 20px;
}

.interest-card h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 15px 0;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.interest-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: var(--color-background);
  border-radius: 8px;
}

.interest-icon {
  font-size: 24px;
}

.interest-name {
  font-size: 13px;
  color: var(--color-text);
}

/* 照片墙 */
.photo-wall {
  background: white;
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 20px;
}

.photo-wall h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 15px 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.add-photo-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: var(--color-background);
}

/* 功能菜单 */
.menu-section {
  padding: 0 var(--spacing-md); /* 减少左右内边距，让卡片更宽 */
}

.menu-section .van-cell-group {
  margin-bottom: var(--spacing-lg);
  margin-left: 0; /* 移除左边距 */
  margin-right: 0; /* 移除右边距 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); /* 添加阴影效果 */
  border-radius: 12px; /* 添加圆角 */
  overflow: hidden; /* 确保内容不超出圆角 */
}

.menu-section .van-cell {
  padding: 28px 20px;
  font-size: 16px;
  min-height: 60px;
}

.menu-section .van-cell__title {
  font-weight: 500;
  color: #333;
  font-size: 16px;
}

.menu-section .van-cell__right-icon {
  font-size: 16px;
}

/* 编辑弹窗样式 */
.edit-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: white;
}

.edit-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0;
}

.edit-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 预览卡片 */
.preview-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-background {
  height: 120px;
  background-size: cover;
  background-position: center;
  background-color: var(--primary-pink);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
}

.change-bg-btn {
  position: relative;
  z-index: 2;
  background: rgba(255,255,255,0.9);
  color: #333;
}

.preview-header {
  position: relative;
  padding: 16px;
  margin-top: -20px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.preview-avatar-section {
  position: relative;
  flex-shrink: 0;
}

.preview-avatar-section .van-image {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
}

.edit-avatar-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: var(--primary-pink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.preview-user-info {
  flex: 1;
}

.preview-user-info h4 {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: var(--color-text);
}

.preview-user-info span {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.preview-tags {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-tag {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 182, 193, 0.2);
  color: var(--primary-pink);
  border-radius: 12px;
  font-size: 12px;
}

.preview-bio {
  padding: 0 16px 16px;
}

.preview-bio p {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

/* 头像预览 */
.avatar-preview {
  padding: 20px;
  text-align: center;
}

.avatar-preview .van-image {
  width: 200px;
  height: 200px;
}

.avatar-actions {
  display: flex;
  justify-content: center;
}

/* 照片弹窗 */
.photo-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.photo-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
  margin: 0;
}

.photo-content {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.admin-cell .van-cell__title {
  color: #1989fa !important;
  font-weight: 500;
}

.admin-cell .van-icon {
  color: #1989fa !important;
}

.logout-cell .van-cell__title {
  color: #ff4757 !important;
}

.logout-cell .van-icon {
  color: #ff4757 !important;
}

/* 空字段样式 - 浅色 */
.field-empty :deep(.van-field__control) {
  color: #c8c9cc !important;
}

.field-empty :deep(.van-cell__value) {
  color: #c8c9cc !important;
}

/* 有内容的字段样式 - 黑色 */
.edit-form :deep(.van-field__control) {
  color: #323233 !important;
}

.edit-form :deep(.van-cell__value) {
  color: #323233 !important;
}

/* 确保有内容时显示正常颜色 - 优先级更高 */
.edit-form .van-cell:not(.field-empty) :deep(.van-cell__value) {
  color: #323233 !important;
}

/* 性别字段特殊处理 - 当gender为0或1时不应该是浅色 */
.edit-form .van-field:not(.field-empty) :deep(.van-cell__value) {
  color: #323233 !important;
}

/* 性别选择器样式 */
.gender-selector {
  display: flex;
  gap: 12px;
  margin-left: 0; /* 从8px改为0 */
}

.gender-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 60px;
}

.gender-card:hover {
  border-color: #e0e0e0;
  background: #f5f5f5;
}

.gender-card.active {
  border-color: #1989fa;
  background: linear-gradient(135deg, #1989fa 0%, #64b5f6 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

.gender-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.gender-text {
  font-size: 12px;
  font-weight: 500;
}

.gender-card.active .gender-text {
  color: white;
}

/* 编辑表单样式 */
.edit-form .van-cell-group {
  margin: 16px 8px 24px 8px !important; /* 增加底部间距 */
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  background: white !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.edit-form .van-cell-group + .van-cell-group {
  margin-top: 32px !important; /* 大幅增加间距 */
}

.edit-form .van-cell {
  padding: 24px 28px; /* 更大的内边距 */
  min-height: 72px; /* 更大的最小高度 */
}

.edit-form .van-field {
  padding: 24px 28px;
}

.edit-form .van-cell__title {
  font-size: 17px; /* 增大标题字体 */
  font-weight: 500;
}

.edit-form .van-field__control {
  font-size: 16px; /* 增大输入框字体 */
}

/* 编辑表单卡片间距 */
.edit-form .van-cell-group--inset {
  margin: 16px 16px !important;
}

.edit-form .van-cell-group--inset + .van-cell-group--inset {
  margin-top: 8px !important;
}

@media (max-width: 768px) {
  .interest-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>




