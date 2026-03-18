<template>
  <div class="pc-profile-page">
    <!-- 左列：个人资料卡片 -->
    <div class="profile-left">
      <div class="profile-card">
        <!-- 背景图区域 -->
        <div
          class="profile-background"
          :style="{ backgroundImage: userInfo.background ? `url(${userInfo.background})` : undefined }"
          @click="changeBackground"
        >
          <div class="background-overlay"></div>
          <span class="change-bg-tip">更换背景</span>
        </div>

        <!-- 头像 -->
        <div class="avatar-wrapper">
          <el-image
            :src="userInfo.avatar || 'https://picsum.photos/120/120?random=1'"
            fit="cover"
            class="avatar-img"
            @click="changeAvatar"
          />
        </div>

        <!-- 用户名、年龄、性别 -->
        <div class="user-basic">
          <h2 class="user-name">{{ userInfo.userName || '用户' }}</h2>
          <div class="user-meta">
            <span>{{ userInfo.age || '未设置' }}岁</span>
            <span class="meta-dot">·</span>
            <span>{{ getGenderText(userInfo.gender) }}</span>
          </div>
        </div>

        <!-- 个性签名 -->
        <div class="user-signature">
          <p>{{ userInfo.signature || '这个人很懒，什么都没有留下...' }}</p>
        </div>

        <!-- 标签 -->
        <div class="user-tags" v-if="userTags.length > 0">
          <el-tag
            v-for="tag in userTags"
            :key="tag"
            round
            class="user-tag"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 详细信息 -->
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
    </div>

    <!-- 右列：编辑表单 -->
    <div class="profile-right">
      <div class="edit-card">
        <h3 class="section-title">编辑资料</h3>

        <el-form :model="editForm" label-width="100px" class="profile-form">
          <el-form-item label="昵称">
            <el-input v-model="editForm.userName" placeholder="请输入昵称" />
          </el-form-item>

          <el-form-item label="年龄">
            <el-input v-model="editForm.age" type="number" placeholder="请输入年龄" />
          </el-form-item>

          <el-form-item label="性别">
            <el-radio-group v-model="editForm.gender">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="0">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="身高">
            <el-input v-model="editForm.height" type="number" placeholder="请输入身高(cm)" />
          </el-form-item>

          <el-form-item label="学历">
            <el-input v-model="editForm.education" placeholder="请输入学历" />
          </el-form-item>

          <el-form-item label="星座">
            <el-input v-model="editForm.zodiac" placeholder="请输入星座" />
          </el-form-item>

          <el-form-item label="家乡">
            <el-input v-model="editForm.hometown" placeholder="请输入家乡" />
          </el-form-item>

          <el-form-item label="职业">
            <el-input v-model="editForm.profession" placeholder="请输入职业" />
          </el-form-item>

          <el-form-item label="个性签名">
            <el-input
              v-model="editForm.signature"
              type="textarea"
              :rows="3"
              placeholder="介绍一下自己吧..."
            />
          </el-form-item>

          <el-form-item label="个性标签">
            <span class="tags-link" @click="editTags">编辑标签</span>
          </el-form-item>

          <el-form-item label="感情状态">
            <el-select v-model="editForm.relationshipStatus" placeholder="请选择感情状态">
              <el-option label="单身" :value="0" />
              <el-option label="恋爱中" :value="1" />
              <el-option label="已婚" :value="2" />
              <el-option label="离异" :value="3" />
              <el-option label="保密" :value="4" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="save-btn" @click="saveProfile">保存资料</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { getUserProfile, updateUser, uploadAvatar } from '@/api/user.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

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
  height: '未填写',
  profession: '未填写',
  education: '未填写',
  constellation: '未填写',
  hometown: '未填写',
  relationshipStatus: 0
})

// 编辑表单
const editForm = ref({
  userName: '',
  age: null,
  gender: null,
  signature: '',
  height: null,
  profession: '',
  education: '',
  hometown: '',
  zodiac: '',
  relationshipStatus: 0
})

// 计算属性：解析用户标签
const userTags = computed(() => {
  if (!userInfo.value.tags) return []
  try {
    return JSON.parse(userInfo.value.tags)
  } catch {
    return []
  }
})

// 性别文本
const getGenderText = (gender) => {
  if (gender === 0) return '女'
  if (gender === 1) return '男'
  return '未设置'
}

// 感情状态文本
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

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    const response = await getUserProfile()

    if (response.code === 200 || response.code === 0) {
      const data = response.data

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
        constellation: data.zodiac || '未填写',
        hometown: data.hometown || '未填写',
        relationshipStatus: Number(data.relationshipStatus) || 0
      }

      // 初始化编辑表单
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
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 保存用户资料
const saveProfile = async () => {
  try {
    // 优先从 store 取，fallback 到 localStorage
    const userId = userStore.userInfo?.id || userInfo.value.id || JSON.parse(localStorage.getItem('userInfo') || '{}').id

    if (!userId) {
      ElMessage.error('用户ID不存在，请重新登录')
      return
    }

    const updateParams = {
      id: parseInt(userId),
      username: editForm.value.userName || null,
      age: editForm.value.age ? parseInt(editForm.value.age) : null,
      gender: editForm.value.gender !== null && editForm.value.gender !== undefined
        ? parseInt(editForm.value.gender) : null,
      signature: editForm.value.signature || null,
      height: editForm.value.height ? parseInt(editForm.value.height) : null,
      profession: editForm.value.profession || null,
      education: editForm.value.education || null,
      hometown: editForm.value.hometown || null,
      zodiac: editForm.value.zodiac || null,
      relationship_status: editForm.value.relationshipStatus !== null && editForm.value.relationshipStatus !== undefined
        ? parseInt(editForm.value.relationshipStatus) : 0
    }

    const result = await updateUser(updateParams)

    if (result.code === 200 || result.code === 0) {
      ElMessage.success('保存成功')
      await fetchUserProfile()
      // 同步更新 localStorage 和 store 中的用户信息
      const currentStored = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const updated = {
        ...currentStored,
        id: userId,
        username: editForm.value.userName,
        userName: editForm.value.userName,
        age: editForm.value.age,
        gender: editForm.value.gender,
        signature: editForm.value.signature
      }
      localStorage.setItem('userInfo', JSON.stringify(updated))
      userStore.setUserInfo(updated)
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请重试')
  }
}

// 更换头像
const changeAvatar = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const result = await uploadAvatar(file, 'avatar')

      if (result.code === 200 || result.code === 0) {
        userInfo.value.avatar = result.data
        ElMessage.success('头像更新成功')
        await fetchUserProfile()
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      console.error('上传头像失败:', error)
      ElMessage.error(error.message || '上传失败，请重试')
    }
  }

  input.click()
}

// 更换背景
const changeBackground = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const result = await uploadAvatar(file, 'background')

      if (result.code === 200 || result.code === 0) {
        userInfo.value.background = result.data
        ElMessage.success('背景图更新成功')
        await fetchUserProfile()
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      console.error('上传背景图失败:', error)
      ElMessage.error(error.message || '上传失败，请重试')
    }
  }

  input.click()
}

// 编辑标签跳转
const editTags = () => {
  const tags = userTags.value || []
  router.push({
    path: '/tags-edit',
    query: {
      tags: JSON.stringify(tags)
    }
  })
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.pc-profile-page {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: #f5f5f5;
}

/* ===== 左列：个人资料卡片 ===== */
.profile-left {
  width: 400px;
  flex-shrink: 0;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 背景图区域 */
.profile-background {
  height: 200px;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  background-size: cover;
  background-position: center;
  position: relative;
  cursor: pointer;
}

.profile-background .background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
  transition: background 0.3s;
}

.profile-background:hover .background-overlay {
  background: rgba(0, 0, 0, 0.35);
}

.change-bg-tip {
  position: absolute;
  bottom: 12px;
  right: 12px;
  color: #fff;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 12px;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-background:hover .change-bg-tip {
  opacity: 1;
}

/* 头像 */
.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-top: -50px;
  position: relative;
  z-index: 1;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.3s;
}

.avatar-img:hover {
  transform: scale(1.05);
}

/* 用户基本信息 */
.user-basic {
  text-align: center;
  padding: 16px 20px 0;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.user-meta {
  font-size: 15px;
  color: #888;
}

.meta-dot {
  margin: 0 6px;
}

/* 个性签名 */
.user-signature {
  padding: 12px 24px 0;
  text-align: center;
}

.user-signature p {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

/* 标签 */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px;
  justify-content: center;
}

.user-tag {
  background: rgba(255, 107, 157, 0.1) !important;
  color: #ff6b9d !important;
  border-color: rgba(255, 107, 157, 0.3) !important;
  font-size: 13px;
}

/* 详细信息 */
.detail-section {
  padding: 8px 24px 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

/* ===== 右列：编辑表单 ===== */
.profile-right {
  flex: 1;
  min-width: 0;
}

.edit-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 28px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* 表单样式 */
.profile-form :deep(.el-form-item__label) {
  width: 100px;
  font-weight: 500;
  color: #555;
}

.profile-form :deep(.el-input__wrapper),
.profile-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.profile-form :deep(.el-select) {
  width: 100%;
}

/* 标签编辑链接 */
.tags-link {
  color: #ff6b9d;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.tags-link:hover {
  color: #e0557e;
  text-decoration: underline;
}

/* 保存按钮 */
.save-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff6b9d, #c084fc) !important;
  color: #fff !important;
  transition: opacity 0.3s;
}

.save-btn:hover {
  opacity: 0.9;
}

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .pc-profile-page {
    flex-direction: column;
  }

  .profile-left {
    width: 100%;
  }
}
</style>
