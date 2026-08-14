<template>
  <div class="admin-page-anime">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="管理中心"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
      class="anime-navbar"
    >
      <template #right>
        <van-icon name="setting-o" size="18" />
      </template>
    </van-nav-bar>

    <!-- Tab 切换 -->
    <van-tabs
      v-model:active="activeTab"
      animated
      swipeable
      class="anime-tabs"
      color="#FFB6C1"
      title-active-color="#FFB6C1"
    >
      <!-- 用户管理 Tab -->
      <van-tab title="用户管理" name="users">
        <div class="tab-content">
          <div class="section-header">
            <h2 class="section-title">
              <span class="title-icon">👥</span>
              用户管理系统
            </h2>
            <van-button
              type="primary"
              size="small"
              round
              class="anime-button"
              @click="showUserDialog = true"
            >
              新增用户
            </van-button>
          </div>

          <!-- 搜索和筛选区域 -->
          <div class="filter-card">
            <van-search
              v-model="userSearch"
              shape="round"
              placeholder="搜索用户名或邮箱..."
              class="anime-search"
            />

            <div class="filter-row">
              <div class="filter-item">
                <span class="filter-label">排序</span>
                <van-dropdown-menu class="anime-dropdown">
                  <van-dropdown-item
                    v-model="userSortType"
                    :options="sortOptions"
                  />
                </van-dropdown-menu>
              </div>

              <div class="filter-item">
                <span class="filter-label">时间筛选</span>
                <div class="time-filter-inline">
                  <van-button
                    size="small"
                    plain
                    @click="showUserStartPicker = true"
                  >
                    {{ userStartTime || '开始' }}
                  </van-button>
                  <span class="time-divider">~</span>
                  <van-button
                    size="small"
                    plain
                    @click="showUserEndPicker = true"
                  >
                    {{ userEndTime || '结束' }}
                  </van-button>
                  <van-button
                    type="primary"
                    size="small"
                    @click="applyUserTimeFilter"
                  >
                    筛选
                  </van-button>
                  <van-button size="small" @click="clearUserTimeFilter">
                    清空
                  </van-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <van-loading v-if="loadingUsers" type="spinner" color="#FFB6C1" vertical class="loading-center">
            加载中...
          </van-loading>

          <!-- 用户卡片列表 -->
          <div class="card-grid" v-else>
            <div
              v-for="user in users"
              :key="user.id"
              class="anime-card user-card"
            >
              <div class="card-header">
                <van-image
                  :src="user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id"
                  round
                  width="50"
                  height="50"
                  fit="cover"
                  class="user-avatar"
                />
                <div class="user-info-main">
                  <h3 class="user-name">{{ user.username || user.userName }}</h3>
                  <p class="user-email">{{ user.email || '未设置邮箱' }}</p>
                </div>
                <van-tag
                  :type="user.userRole === 1 ? 'primary' : 'default'"
                  round
                  class="role-tag"
                >
                  {{ user.userRole === 1 ? 'admin' : 'user' }}
                </van-tag>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">用户ID</span>
                  <span class="info-value">{{ user.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">状态</span>
                  <van-tag
                    :type="user.isDelete === 0 ? 'success' : 'warning'"
                    round
                  >
                    {{ user.isDelete === 0 ? '正常' : '停用' }}
                  </van-tag>
                </div>
                <div class="info-row">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDate(user.createTime) }}</span>
                </div>
              </div>

              <div class="card-actions">
                <van-button
                  type="primary"
                  size="small"
                  plain
                  round
                  @click="editUser(user)"
                >
                  编辑
                </van-button>
                <van-button
                  type="danger"
                  size="small"
                  plain
                  round
                  @click="deleteUser(user)"
                >
                  停用
                </van-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty
            v-if="!loadingUsers && users.length === 0"
            description="暂无用户数据"
            class="anime-empty"
          />

          <!-- 分页 -->
          <div class="pagination-wrapper" v-if="totalPages > 1">
            <div class="simple-pagination">
              <button
                class="page-btn"
                :disabled="currentUserPage <= 1"
                @click="goToPrevPage"
              >&lt;</button>
              <input
                type="number"
                class="page-input"
                v-model.number="pageInputValue"
                @keyup.enter="goToInputPage"
                @blur="goToInputPage"
                min="1"
                :max="totalPages"
              />
              <span class="page-total">/ {{ totalPages }}</span>
              <button
                class="page-btn"
                :disabled="currentUserPage >= totalPages"
                @click="goToNextPage"
              >&gt;</button>
            </div>
          </div>
        </div>
      </van-tab>

      <!-- AI 提示词管理 Tab -->
      <van-tab title="AI提示词" name="prompts">
        <div class="tab-content">
          <div class="section-header">
            <h2 class="section-title">
              <span class="title-icon">🤖</span>
              AI 提示词设置中心
            </h2>
            <van-button
              type="primary"
              size="small"
              round
              class="anime-button"
              @click="showPromptDialog = true"
            >
              新增提示词
            </van-button>
          </div>

          <!-- 搜索和分类区域 -->
          <div class="filter-card">
            <van-search
              v-model="promptSearch"
              shape="round"
              placeholder="搜索提示词名称..."
              class="anime-search"
            />

            <div class="category-filter">
              <span class="filter-label">分类筛选：</span>
              <van-radio-group v-model="promptCategory" direction="horizontal">
                <van-radio name="all">全部</van-radio>
                <van-radio name="chat">聊天</van-radio>
                <van-radio name="code">代码</van-radio>
                <van-radio name="image">图像</van-radio>
                <van-radio name="custom">自定义</van-radio>
              </van-radio-group>
            </div>
          </div>

          <!-- 提示词卡片列表 -->
          <div class="card-grid">
            <div
              v-for="prompt in filteredPrompts"
              :key="prompt.id"
              class="anime-card prompt-card"
              :class="{ expanded: expandedPromptId === prompt.id }"
              @click="togglePromptExpand(prompt.id)"
            >
              <div class="card-header">
                <div class="prompt-title-section">
                  <h3 class="prompt-name">{{ prompt.name }}</h3>
                  <van-tag :type="getCategoryTagType(prompt.category)" round>
                    {{ getCategoryText(prompt.category) }}
                  </van-tag>
                </div>
              </div>

              <div class="card-body">
                <div class="prompt-preview">
                  {{ getPromptPreview(prompt.content) }}
                </div>
                <div v-if="expandedPromptId === prompt.id" class="prompt-full">
                  <div class="prompt-content-box">{{ prompt.content }}</div>
                  <div class="prompt-note" v-if="prompt.note">
                    <strong>备注：</strong>{{ prompt.note }}
                  </div>
                </div>
              </div>

              <div class="card-actions" @click.stop>
                <van-button
                  type="primary"
                  size="small"
                  plain
                  round
                  @click="editPrompt(prompt)"
                >
                  编辑
                </van-button>
                <van-button
                  type="danger"
                  size="small"
                  plain
                  round
                  @click="deletePrompt(prompt)"
                >
                  删除
                </van-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <van-empty
            v-if="filteredPrompts.length === 0"
            description="暂无提示词"
            class="anime-empty"
          />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 用户编辑/新增对话框 -->
    <van-popup
      v-model:show="showUserDialog"
      position="bottom"
      round
      :style="{ height: '75%' }"
      class="anime-popup"
    >
      <div class="dialog-content">
        <h3 class="dialog-title">{{ isEditingUser ? '编辑用户' : '新增用户' }}</h3>

        <van-form @submit="saveUser">
          <van-cell-group inset>
            <van-field
              v-model="userForm.userName"
              label="用户名"
              placeholder="请输入用户名"
              required
            />
            <van-field
              v-model="userForm.email"
              label="邮箱"
              placeholder="请输入邮箱"
              type="email"
              required
            />
            <van-field name="role" label="角色">
              <template #input>
                <van-radio-group v-model="userForm.role" direction="horizontal">
                  <van-radio name="user">普通用户</van-radio>
                  <van-radio name="admin">管理员</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field name="status" label="状态">
              <template #input>
                <van-switch v-model="userForm.statusActive" />
                <span style="margin-left: 8px">
                  {{ userForm.statusActive ? '正常' : '禁用' }}
                </span>
              </template>
            </van-field>
          </van-cell-group>

          <div class="dialog-actions">
            <van-button block type="primary" native-type="submit" round>
              保存
            </van-button>
            <van-button block @click="showUserDialog = false" round>
              取消
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- AI 提示词编辑/新增对话框 -->
    <van-popup
      v-model:show="showPromptDialog"
      position="bottom"
      round
      :style="{ height: '80%' }"
      class="anime-popup"
    >
      <div class="dialog-content">
        <h3 class="dialog-title">{{ isEditingPrompt ? '编辑提示词' : '新增提示词' }}</h3>

        <van-form @submit="savePrompt">
          <van-cell-group inset>
            <van-field
              v-model="promptForm.name"
              label="提示词名称"
              placeholder="请输入名称"
              required
            />
            <van-field name="category" label="适用模块">
              <template #input>
                <van-radio-group v-model="promptForm.category" direction="horizontal">
                  <van-radio name="chat">聊天</van-radio>
                  <van-radio name="code">代码</van-radio>
                  <van-radio name="image">图像</van-radio>
                  <van-radio name="custom">自定义</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model="promptForm.content"
              label="提示词内容"
              type="textarea"
              placeholder="请输入提示词内容"
              rows="5"
              autosize
              required
            />
            <van-field
              v-model="promptForm.note"
              label="备注"
              type="textarea"
              placeholder="选填"
              rows="2"
              autosize
            />
          </van-cell-group>

          <div class="dialog-actions">
            <van-button block type="primary" native-type="submit" round>
              保存
            </van-button>
            <van-button block @click="showPromptDialog = false" round>
              取消
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showUserStartPicker" position="bottom">
      <van-date-picker
        v-model="userStartDate"
        title="选择开始日期"
        @confirm="onUserStartDateConfirm"
        @cancel="showUserStartPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showUserEndPicker" position="bottom">
      <van-date-picker
        v-model="userEndDate"
        title="选择结束日期"
        @confirm="onUserEndDateConfirm"
        @cancel="showUserEndPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminPage' })
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { selectAlluser, deleteuser } from '@/api/user'
import { getApiErrorMessage } from '../utils/error.js'

const router = useRouter()

// ========== 通用状态 ==========
const activeTab = ref('users')
const pageSize = ref(10) // 每页显示 10 个用户

// ========== 用户管理状态 ==========
const userSearch = ref('')
const userSortType = ref('desc')
const sortOptions = [
  { text: '创建时间降序', value: 'desc' },
  { text: '创建时间升序', value: 'asc' },
  { text: '按角色排序', value: 'role' }
]

const showUserStartPicker = ref(false)
const showUserEndPicker = ref(false)
const userStartTime = ref('')
const userEndTime = ref('')
const userStartDate = ref(['2024', '01', '01'])
const userEndDate = ref(['2025', '12', '31'])
const userTimeFilterApplied = ref(false)

const currentUserPage = ref(1)
const pageInputValue = ref(1)
const showUserDialog = ref(false)
const isEditingUser = ref(false)
const loadingUsers = ref(false)

// 用户数据（从后端获取）
const users = ref([])
const totalUsers = ref(0)
const totalPages = ref(0)

const userForm = ref({
  id: null,
  userName: '',
  email: '',
  role: 'user',
  statusActive: true
})

// 用户相关方法

// 加载用户列表
const loadUsers = async () => {
  try {
    loadingUsers.value = true
    const params = {
      pageNum: currentUserPage.value,
      pageSize: pageSize.value,
      username: userSearch.value || '',  // 后端参数：username（不是 keyword）
      // 后端接收 LocalDateTime 类型，使用 ISO 8601 格式
      createTimeBegin: userTimeFilterApplied.value && userStartTime.value ? `${userStartTime.value}T00:00:00` : '',
      createTimeEnd: userTimeFilterApplied.value && userEndTime.value ? `${userEndTime.value}T23:59:59` : ''
    }
    
    console.log('加载用户列表，参数:', params)
    const response = await selectAlluser(params)
    
    if (response.code === 200 && response.data) {
      // 后端返回 PageInfo<User> 格式
      // PageInfo 结构：{ list, total, pageNum, pageSize, pages, ... }
      const pageInfo = response.data
      
      users.value = pageInfo.list || []
      totalUsers.value = parseInt(pageInfo.total) || 0
      totalPages.value = pageInfo.pages || 0
      pageInputValue.value = currentUserPage.value
      
      console.log('用户列表加载成功:', {
        total: totalUsers.value,
        currentPage: pageInfo.pageNum,
        pageSize: pageInfo.pageSize,
        pages: totalPages.value,
        count: users.value.length
      })
    } else {
      showToast(response.message || '加载用户列表失败')
      console.error('加载失败，响应:', response)
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    showToast(getApiErrorMessage(error, '加载用户列表失败，请稍后重试'))
  } finally {
    loadingUsers.value = false
  }
}

// 页码变化时重新加载
const onPageChange = (page) => {
  console.log('页码变化:', page)
  currentUserPage.value = page
  pageInputValue.value = page
  loadUsers()
}

// 上一页
const goToPrevPage = () => {
  if (currentUserPage.value > 1) {
    onPageChange(currentUserPage.value - 1)
  }
}

// 下一页
const goToNextPage = () => {
  if (currentUserPage.value < totalPages.value) {
    onPageChange(currentUserPage.value + 1)
  }
}

// 跳转到输入页码
const goToInputPage = () => {
  let page = pageInputValue.value
  if (!page || page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  if (page !== currentUserPage.value) {
    onPageChange(page)
  } else {
    pageInputValue.value = currentUserPage.value
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return dateStr
  }
}
const goBack = () => router.back()

const onUserStartDateConfirm = (value) => {
  // Vant DatePicker 的 confirm 事件可能直接传递数组，也可能传递对象
  const selectedValues = Array.isArray(value) ? value : (value?.selectedValues || value)
  const [year, month, day] = selectedValues
  userStartTime.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  showUserStartPicker.value = false
}

const onUserEndDateConfirm = (value) => {
  // Vant DatePicker 的 confirm 事件可能直接传递数组，也可能传递对象
  const selectedValues = Array.isArray(value) ? value : (value?.selectedValues || value)
  const [year, month, day] = selectedValues
  userEndTime.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  showUserEndPicker.value = false
}

const applyUserTimeFilter = () => {
  if (!userStartTime.value || !userEndTime.value) {
    showToast('请选择完整的时间区间')
    return
  }
  userTimeFilterApplied.value = true
  currentUserPage.value = 1
  loadUsers()
  showSuccessToast('筛选已应用')
}

const clearUserTimeFilter = () => {
  userStartTime.value = ''
  userEndTime.value = ''
  userTimeFilterApplied.value = false
  currentUserPage.value = 1
  loadUsers()
  showSuccessToast('筛选已清空')
}

const resetUserForm = () => {
  userForm.value = {
    id: null,
    userName: '',
    email: '',
    role: 'user',
    statusActive: true
  }
}

const editUser = (user) => {
  isEditingUser.value = true
  userForm.value = {
    id: user.id,
    userName: user.username || user.userName,
    email: user.email || '',
    role: user.userRole === 1 ? 'admin' : 'user',
    statusActive: user.userStatus === 0
  }
  showUserDialog.value = true
  console.log('编辑用户:', userForm.value)
}

const deleteUser = async (user) => {
  try {
    console.log('点击停用按钮，用户信息:', user)
    
    await showConfirmDialog({
      title: '确认停用',
      message: `确定要停用用户"${user.username || user.userName}"吗？`,
    })
    
    console.log('用户确认停用')
    
    // 从 localStorage 获取当前管理员的 id
    const currentUserStr = localStorage.getItem('userInfo')
    console.log('从 localStorage 获取用户信息:', currentUserStr)
    
    if (!currentUserStr) {
      showToast('请先登录')
      return
    }
    
    const currentUser = JSON.parse(currentUserStr)
    const adminId = currentUser.id
    console.log('解析后的用户对象:', currentUser)
    
    console.log('管理员 ID:', adminId, '被停用用户 ID:', user.id)
    
    // 调用停用用户接口
    console.log('准备调用 deleteuser 接口...')
    const response = await deleteuser(adminId, user.id)
    console.log('停用接口响应:', response)
    
    if (response.code === 200) {
      showSuccessToast('停用成功')
      // 重新加载用户列表
      loadUsers()
    } else {
      showToast(response.message || '停用失败')
    }
  } catch (error) {
    console.error('停用用户异常:', error)
    // 用户取消或接口调用失败
    if (error && error.message && error.message !== 'cancel') {
      showToast(getApiErrorMessage(error, '停用失败，请稍后重试'))
    }
  }
}

const saveUser = () => {
  if (isEditingUser.value) {
    const index = users.value.findIndex(u => u.id === userForm.value.id)
    if (index > -1) {
      users.value[index] = {
        ...users.value[index],
        userName: userForm.value.userName,
        email: userForm.value.email,
        role: userForm.value.role,
        status: userForm.value.statusActive ? 'active' : 'disabled'
      }
      showSuccessToast('更新成功')
    }
  } else {
    const newUser = {
      id: users.value.length + 1,
      userName: userForm.value.userName,
      email: userForm.value.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.value.userName}`,
      role: userForm.value.role,
      status: userForm.value.statusActive ? 'active' : 'disabled',
      createTime: new Date().toISOString().split('T')[0]
    }
    users.value.push(newUser)
    showSuccessToast('添加成功')
  }
  showUserDialog.value = false
  resetUserForm()
  isEditingUser.value = false
}

// ========== AI 提示词管理状态 ==========
const promptSearch = ref('')
const promptCategory = ref('all')
const expandedPromptId = ref(null)
const showPromptDialog = ref(false)
const isEditingPrompt = ref(false)

// Mock 提示词数据
const prompts = ref([
  {
    id: 1,
    name: '友好聊天助手',
    category: 'chat',
    content: '你是一个友好、活泼的聊天助手。用轻松愉快的语气与用户交流，适当使用表情符号，让对话充满活力。',
    note: '适用于日常聊天场景'
  },
  {
    id: 2,
    name: '代码审查专家',
    category: 'code',
    content: '你是一位经验丰富的代码审查专家。审查代码时，关注代码质量、性能优化、安全问题和最佳实践。提供清晰、具体的改进建议。',
    note: '用于代码审查和优化建议'
  },
  {
    id: 3,
    name: '图像描述生成器',
    category: 'image',
    content: '根据用户的需求，生成详细、富有想象力的图像描述。描述应该包含主题、风格、色调、构图等要素，适合用于 AI 绘画工具。',
    note: 'AI 绘画提示词生成'
  },
  {
    id: 4,
    name: '技术文档助手',
    category: 'custom',
    content: '帮助用户撰写清晰、专业的技术文档。包括 API 文档、使用说明、技术方案等。注重逻辑性和可读性。',
    note: '文档撰写辅助'
  }
])

const promptForm = ref({
  id: null,
  name: '',
  category: 'chat',
  content: '',
  note: ''
})

// 提示词相关计算属性
const filteredPrompts = computed(() => {
  let result = [...prompts.value]

  // 搜索
  if (promptSearch.value) {
    const keyword = promptSearch.value.toLowerCase()
    result = result.filter(prompt =>
      prompt.name.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (promptCategory.value !== 'all') {
    result = result.filter(prompt => prompt.category === promptCategory.value)
  }

  return result
})

// 提示词相关方法
const getCategoryText = (category) => {
  const map = {
    chat: '聊天',
    code: '代码',
    image: '图像',
    custom: '自定义'
  }
  return map[category] || category
}

const getCategoryTagType = (category) => {
  const map = {
    chat: 'primary',
    code: 'success',
    image: 'warning',
    custom: 'default'
  }
  return map[category] || 'default'
}

const getPromptPreview = (content) => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

const togglePromptExpand = (id) => {
  expandedPromptId.value = expandedPromptId.value === id ? null : id
}

const resetPromptForm = () => {
  promptForm.value = {
    id: null,
    name: '',
    category: 'chat',
    content: '',
    note: ''
  }
}

const editPrompt = (prompt) => {
  isEditingPrompt.value = true
  promptForm.value = { ...prompt }
  showPromptDialog.value = true
}

const deletePrompt = async (prompt) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除提示词"${prompt.name}"吗？`,
    })
    const index = prompts.value.findIndex(p => p.id === prompt.id)
    if (index > -1) {
      prompts.value.splice(index, 1)
      showSuccessToast('删除成功')
    }
  } catch (error) {
    // 用户取消
  }
}

const savePrompt = () => {
  if (isEditingPrompt.value) {
    const index = prompts.value.findIndex(p => p.id === promptForm.value.id)
    if (index > -1) {
      prompts.value[index] = { ...promptForm.value }
      showSuccessToast('更新成功')
    }
  } else {
    const newPrompt = {
      ...promptForm.value,
      id: prompts.value.length + 1
    }
    prompts.value.push(newPrompt)
    showSuccessToast('添加成功')
  }
  showPromptDialog.value = false
  resetPromptForm()
  isEditingPrompt.value = false
}

// ========== 生命周期和监听 ==========

// 组件挂载时加载用户数据
onMounted(() => {
  loadUsers()
})

// 监听搜索关键词变化
watch(userSearch, () => {
  currentUserPage.value = 1
  loadUsers()
})

// 监听排序类型变化
watch(userSortType, () => {
  currentUserPage.value = 1
  loadUsers()
})
</script>

<style scoped>
/* ========== 基础布局 ========== */
.admin-page-anime {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F5 0%, #FFF9F0 50%, #FFFFFF 100%);
  position: relative;
  padding-bottom: 20px;
}

/* ========== 导航栏 ========== */
.anime-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.anime-navbar :deep(.van-nav-bar__title) {
  color: #333;
  font-weight: 600;
  font-size: 18px;
}

.anime-navbar :deep(.van-icon) {
  color: #333;
}

/* ========== Tab 样式 ========== */
.anime-tabs {
  position: relative;
  z-index: 5;
  background: transparent;
}

.anime-tabs :deep(.van-tabs__wrap) {
  background: rgba(255, 255, 255, 0.95);
}

.anime-tabs :deep(.van-tab) {
  font-weight: 500;
  font-size: 15px;
}

.anime-tabs :deep(.van-tabs__line) {
  background: #FFB6C1;
  height: 3px;
  border-radius: 3px;
}

/* ========== 内容区域 ========== */
.tab-content {
  padding: 16px;
  position: relative;
  z-index: 5;
}

/* ========== 区块头部 ========== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #FFB6C1;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.anime-button {
  background: #FFB6C1;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
}

.anime-button:active {
  opacity: 0.8;
}

/* ========== 筛选卡片 ========== */
.filter-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.anime-search {
  margin-bottom: 12px;
}

.anime-search :deep(.van-search__content) {
  background: #f7f8fa;
  border-radius: 20px;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #646566;
}

.anime-dropdown {
  flex: 1;
}

.time-filter-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-divider {
  color: #969799;
  margin: 0 4px;
}

.category-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* ========== 卡片网格 ========== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 动漫风格卡片 ========== */
.anime-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.anime-card:active {
  background: rgba(250, 250, 250, 0.95);
}

/* ========== 用户卡片 ========== */
.user-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-avatar {
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info-main {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 13px;
  color: #969799;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-tag {
  flex-shrink: 0;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: #646566;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #323233;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* ========== 提示词卡片 ========== */
.prompt-card {
  cursor: pointer;
}

.prompt-card.expanded {
  grid-column: 1 / -1;
}

.prompt-title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.prompt-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
}

.prompt-preview {
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
  margin-bottom: 12px;
}

.prompt-full {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.prompt-content-box {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  color: #323233;
  line-height: 1.8;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.prompt-note {
  font-size: 13px;
  color: #969799;
  font-style: italic;
}

.prompt-note strong {
  color: #646566;
  font-style: normal;
}

/* ========== 空状态 ========== */
.anime-empty {
  margin-top: 60px;
}

/* ========== 加载状态 ========== */
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.simple-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 8px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  background: #fff;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-btn:active:not(:disabled) {
  background: #f5f5f5;
}

.page-input {
  width: 48px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  background: #fff;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  outline: none;
  -moz-appearance: textfield;
  appearance: textfield;
}

.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.page-input:focus {
  border-color: #FFB6C1;
}

.page-total {
  font-size: 15px;
  color: #666;
  font-weight: 400;
  white-space: nowrap;
}

/* ========== 对话框 ========== */
.anime-popup {
  background: rgba(255, 255, 255, 0.98);
}

.dialog-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: #FFB6C1;
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

/* ========== Vant 组件覆盖 ========== */
:deep(.van-cell-group--inset) {
  margin: 16px 0;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.van-button--round) {
  border-radius: 20px;
}

:deep(.van-button--primary) {
  background: #FFB6C1;
  border: none;
}

:deep(.van-tag--round) {
  border-radius: 12px;
}

:deep(.van-radio__icon--checked .van-icon) {
  background: #FFB6C1;
  border-color: #FFB6C1;
}
</style>
