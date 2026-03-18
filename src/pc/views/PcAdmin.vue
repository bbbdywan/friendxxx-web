<template>
  <div class="pc-admin">
    <div class="page-header">
      <h2>管理中心</h2>
      <p>用户管理与系统配置</p>
    </div>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <div class="filter-bar">
          <el-input v-model="userSearch" placeholder="搜索用户名..." prefix-icon="Search" clearable style="width: 260px" />
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 300px"
          />
          <el-button type="primary" class="pink-btn" @click="loadUsers">筛选</el-button>
          <el-button @click="clearFilter">清空</el-button>
        </div>

        <el-table :data="users" v-loading="loadingUsers" stripe style="width: 100%" border>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="36" :src="row.avatarUrl">{{ (row.username || '用')[0] }}</el-avatar>
            </template>
          </el-table-column>
          <el-table-column label="用户名" min-width="120">
            <template #default="{ row }">{{ row.username || row.userName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="160">
            <template #default="{ row }">{{ row.email || '未设置' }}</template>
          </el-table-column>
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.userRole === 3 ? 'primary' : 'info'" round size="small">
                {{ row.userRole === 3 ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isDelete === 0 ? 'success' : 'warning'" round size="small">
                {{ row.isDelete === 0 ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="120">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="editUser(row)">编辑</el-button>
              <el-button type="danger" text size="small" @click="deleteUser(row)">停用</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentUserPage"
            :page-size="pageSize"
            :total="totalUsers"
            layout="total, prev, pager, next, jumper"
            @current-change="onPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- AI 提示词管理 -->
      <el-tab-pane label="AI提示词" name="prompts">
        <div class="filter-bar">
          <el-input v-model="promptSearch" placeholder="搜索提示词名称..." prefix-icon="Search" clearable style="width: 260px" />
          <el-radio-group v-model="promptCategory">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="chat">聊天</el-radio-button>
            <el-radio-button value="code">代码</el-radio-button>
            <el-radio-button value="image">图像</el-radio-button>
            <el-radio-button value="custom">自定义</el-radio-button>
          </el-radio-group>
          <el-button type="primary" class="pink-btn" @click="showPromptDialog = true">新增提示词</el-button>
        </div>

        <div class="prompt-grid">
          <el-card v-for="prompt in filteredPrompts" :key="prompt.id" class="prompt-card" shadow="hover">
            <template #header>
              <div class="prompt-header">
                <span class="prompt-name">{{ prompt.name }}</span>
                <el-tag :type="getCategoryTagType(prompt.category)" round size="small">
                  {{ getCategoryText(prompt.category) }}
                </el-tag>
              </div>
            </template>
            <p class="prompt-content">{{ prompt.content }}</p>
            <p class="prompt-note" v-if="prompt.note">备注：{{ prompt.note }}</p>
            <div class="prompt-actions">
              <el-button type="primary" text size="small" @click="editPrompt(prompt)">编辑</el-button>
              <el-button type="danger" text size="small" @click="deletePrompt(prompt)">删除</el-button>
            </div>
          </el-card>
        </div>

        <el-empty v-if="filteredPrompts.length === 0" description="暂无提示词" />
      </el-tab-pane>
    </el-tabs>

    <!-- 用户编辑对话框 -->
    <el-dialog v-model="showUserDialog" :title="isEditingUser ? '编辑用户' : '新增用户'" width="500">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="userForm.role">
            <el-radio value="user">普通用户</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.statusActive" active-text="正常" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUserDialog = false">取消</el-button>
        <el-button type="primary" class="pink-btn" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- 提示词编辑对话框 -->
    <el-dialog v-model="showPromptDialog" :title="isEditingPrompt ? '编辑提示词' : '新增提示词'" width="600">
      <el-form :model="promptForm" label-width="100px">
        <el-form-item label="提示词名称">
          <el-input v-model="promptForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="适用模块">
          <el-radio-group v-model="promptForm.category">
            <el-radio value="chat">聊天</el-radio>
            <el-radio value="code">代码</el-radio>
            <el-radio value="image">图像</el-radio>
            <el-radio value="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提示词内容">
          <el-input v-model="promptForm.content" type="textarea" :rows="5" placeholder="请输入提示词内容" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="promptForm.note" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPromptDialog = false">取消</el-button>
        <el-button type="primary" class="pink-btn" @click="savePrompt">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { selectAlluser, deleteuser } from '@/api/user.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeTab = ref('users')
const pageSize = ref(10)

// 用户管理
const userSearch = ref('')
const dateRange = ref(null)
const currentUserPage = ref(1)
const loadingUsers = ref(false)
const users = ref([])
const totalUsers = ref(0)
const totalPages = ref(0)
const showUserDialog = ref(false)
const isEditingUser = ref(false)

const userForm = ref({
  id: null,
  userName: '',
  email: '',
  role: 'user',
  statusActive: true
})

const loadUsers = async () => {
  try {
    loadingUsers.value = true
    const params = {
      pageNum: currentUserPage.value,
      pageSize: pageSize.value,
      username: userSearch.value || ''
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.createTimeBegin = `${dateRange.value[0]}T00:00:00`
      params.createTimeEnd = `${dateRange.value[1]}T23:59:59`
    }
    const response = await selectAlluser(params)
    if (response.code === 200 && response.data) {
      const pageInfo = response.data
      users.value = pageInfo.list || []
      totalUsers.value = parseInt(pageInfo.total) || 0
      totalPages.value = pageInfo.pages || 0
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loadingUsers.value = false
  }
}

const onPageChange = (page) => {
  currentUserPage.value = page
  loadUsers()
}

const clearFilter = () => {
  userSearch.value = ''
  dateRange.value = null
  currentUserPage.value = 1
  loadUsers()
}

const editUser = (user) => {
  isEditingUser.value = true
  userForm.value = {
    id: user.id,
    userName: user.username || user.userName,
    email: user.email || '',
    role: user.userRole === 3 ? 'admin' : 'user',
    statusActive: user.isDelete === 0
  }
  showUserDialog.value = true
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要停用用户"${user.username || user.userName}"吗？`, '确认停用', { type: 'warning' })
    const currentUserStr = localStorage.getItem('userInfo')
    if (!currentUserStr) {
      ElMessage.warning('请先登录')
      return
    }
    const currentUser = JSON.parse(currentUserStr)
    const response = await deleteuser(currentUser.id, user.id)
    if (response.code === 200) {
      ElMessage.success('停用成功')
      loadUsers()
    } else {
      ElMessage.error(response.message || '停用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const saveUser = () => {
  ElMessage.success(isEditingUser.value ? '更新成功' : '添加成功')
  showUserDialog.value = false
  isEditingUser.value = false
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

// AI 提示词
const promptSearch = ref('')
const promptCategory = ref('all')
const showPromptDialog = ref(false)
const isEditingPrompt = ref(false)

const prompts = ref([
  { id: 1, name: '友好聊天助手', category: 'chat', content: '你是一个友好、活泼的聊天助手。用轻松愉快的语气与用户交流，适当使用表情符号，让对话充满活力。', note: '适用于日常聊天场景' },
  { id: 2, name: '代码审查专家', category: 'code', content: '你是一位经验丰富的代码审查专家。审查代码时，关注代码质量、性能优化、安全问题和最佳实践。提供清晰、具体的改进建议。', note: '用于代码审查和优化建议' },
  { id: 3, name: '图像描述生成器', category: 'image', content: '根据用户的需求，生成详细、富有想象力的图像描述。描述应该包含主题、风格、色调、构图等要素，适合用于 AI 绘画工具。', note: 'AI 绘画提示词生成' },
  { id: 4, name: '技术文档助手', category: 'custom', content: '帮助用户撰写清晰、专业的技术文档。包括 API 文档、使用说明、技术方案等。注重逻辑性和可读性。', note: '文档撰写辅助' }
])

const promptForm = ref({ id: null, name: '', category: 'chat', content: '', note: '' })

const filteredPrompts = computed(() => {
  let result = [...prompts.value]
  if (promptSearch.value) {
    result = result.filter(p => p.name.includes(promptSearch.value))
  }
  if (promptCategory.value !== 'all') {
    result = result.filter(p => p.category === promptCategory.value)
  }
  return result
})

const getCategoryText = (cat) => ({ chat: '聊天', code: '代码', image: '图像', custom: '自定义' }[cat] || cat)
const getCategoryTagType = (cat) => ({ chat: 'primary', code: 'success', image: 'warning', custom: 'info' }[cat] || 'info')

const editPrompt = (prompt) => {
  isEditingPrompt.value = true
  promptForm.value = { ...prompt }
  showPromptDialog.value = true
}

const deletePrompt = async (prompt) => {
  try {
    await ElMessageBox.confirm(`确定要删除"${prompt.name}"吗？`, '确认删除', { type: 'warning' })
    prompts.value = prompts.value.filter(p => p.id !== prompt.id)
    ElMessage.success('删除成功')
  } catch {}
}

const savePrompt = () => {
  if (isEditingPrompt.value) {
    const idx = prompts.value.findIndex(p => p.id === promptForm.value.id)
    if (idx > -1) prompts.value[idx] = { ...promptForm.value }
  } else {
    prompts.value.push({ ...promptForm.value, id: Date.now() })
  }
  ElMessage.success(isEditingPrompt.value ? '更新成功' : '添加成功')
  showPromptDialog.value = false
  isEditingPrompt.value = false
  promptForm.value = { id: null, name: '', category: 'chat', content: '', note: '' }
}

watch(userSearch, () => {
  currentUserPage.value = 1
  loadUsers()
})

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.pc-admin {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.page-header p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.admin-tabs :deep(.el-tabs__active-bar) {
  background: #ff6b9d;
}

.admin-tabs :deep(.el-tabs__item.is-active) {
  color: #ff6b9d;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pink-btn {
  background: linear-gradient(135deg, #ff6b9d, #c084fc) !important;
  border: none !important;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 提示词网格 */
.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.prompt-card {
  border-radius: 12px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.prompt-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-note {
  font-size: 13px;
  color: #999;
  margin: 0 0 12px;
  font-style: italic;
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: white;
}

:deep(.el-pagination .is-active) {
  background: #ff6b9d !important;
}
</style>
