<template>
  <div class="prompt-page">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="AI提示词设置"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    />

    <!-- 当前激活提示词 -->
    <div class="active-section" v-if="activePrompt">
      <div class="section-title">当前使用</div>
      <div class="active-card">
        <div class="active-card-header">
          <span class="active-title">{{ activePrompt.title || '未命名' }}</span>
          <span class="active-badge">使用中</span>
        </div>
        <p class="active-content">{{ activePrompt.content }}</p>
      </div>
    </div>
    <div class="active-section" v-else>
      <div class="section-title">当前使用</div>
      <div class="empty-active">
        <van-icon name="info-o" size="18" />
        <span>暂未设置，使用系统默认提示词</span>
      </div>
    </div>

    <!-- 提示词列表 -->
    <div class="list-section">
      <div class="section-title">我的提示词</div>

      <van-loading v-if="loading" class="list-loading" />

      <div v-else-if="promptList.length === 0" class="empty-list">
        <van-empty description="暂无提示词，点击右下角添加" />
      </div>

      <div v-else class="prompt-list">
        <div
          v-for="item in promptList"
          :key="item.id"
          class="prompt-card"
          :class="{ 'is-active': item.isActive === 1 }"
        >
          <div class="prompt-card-header">
            <span class="prompt-title">{{ item.title || '未命名' }}</span>
            <div class="prompt-actions">
              <van-tag v-if="item.isActive === 1" type="success" size="small">使用中</van-tag>
              <van-button
                v-else
                size="mini"
                round
                plain
                type="primary"
                @click="handleSetActive(item.id)"
              >启用</van-button>
              <van-icon name="edit" class="action-icon" @click="openEdit(item)" />
              <van-icon name="delete-o" class="action-icon delete-icon" @click="handleDelete(item.id)" />
            </div>
          </div>
          <p class="prompt-content">{{ item.content }}</p>
          <div class="prompt-time">{{ formatTime(item.updateTime) }}</div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <van-popup
      v-model:show="showEditPopup"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="edit-popup">
        <div class="edit-popup-header">
          <van-button text @click="showEditPopup = false">取消</van-button>
          <h3>{{ editForm.id ? '编辑提示词' : '新建提示词' }}</h3>
          <van-button type="primary" text @click="handleSave" :loading="saving">保存</van-button>
        </div>
        <div class="edit-popup-body">
          <van-field
            v-model="editForm.title"
            label="标题"
            placeholder="给提示词起个名字（选填）"
            clearable
          />
          <van-field
            v-model="editForm.content"
            label="内容"
            type="textarea"
            placeholder="输入AI人设提示词，例如：你是一个温柔的女生朋友..."
            rows="8"
            autosize
            maxlength="2000"
            show-word-limit
          />
          <van-cell title="保存后立即启用">
            <template #right-icon>
              <van-switch v-model="editForm.setActive" size="22" />
            </template>
          </van-cell>
        </div>
      </div>
    </van-popup>

    <!-- 新建按钮 -->
    <van-button
      class="fab-btn"
      round
      type="primary"
      icon="plus"
      @click="openCreate"
    >新建提示词</van-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showSuccessToast } from 'vant'
import {
  getPromptList,
  getActivePrompt,
  savePrompt,
  setActivePrompt,
  deletePrompt
} from '../api/prompt.js'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const promptList = ref([])
const activePrompt = ref(null)
const showEditPopup = ref(false)

const editForm = ref({
  id: null,
  title: '',
  content: '',
  setActive: false
})

const fetchData = async () => {
  loading.value = true
  try {
    const [listRes, activeRes] = await Promise.all([
      getPromptList(),
      getActivePrompt()
    ])
    if (listRes.code === 200) promptList.value = listRes.data || []
    if (activeRes.code === 200) activePrompt.value = activeRes.data
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editForm.value = { id: null, title: '', content: '', setActive: false }
  showEditPopup.value = true
}

const openEdit = (item) => {
  editForm.value = { id: item.id, title: item.title || '', content: item.content, setActive: item.isActive === 1 }
  showEditPopup.value = true
}

const handleSave = async () => {
  if (!editForm.value.content.trim()) {
    showToast('提示词内容不能为空')
    return
  }
  saving.value = true
  try {
    const res = await savePrompt({
      id: editForm.value.id || undefined,
      title: editForm.value.title,
      content: editForm.value.content
    })
    if (res.code === 200) {
      // 如果勾选了"立即启用"，保存成功后再调用激活接口
      if (editForm.value.setActive) {
        // 新建时需要从列表里找到刚保存的 id；编辑时直接用 editForm.id
        if (editForm.value.id) {
          await setActivePrompt(editForm.value.id)
        } else {
          // 重新拉列表，找标题+内容匹配的最新一条
          const listRes = await getPromptList()
          if (listRes.code === 200 && listRes.data?.length) {
            const newest = listRes.data[listRes.data.length - 1]
            await setActivePrompt(newest.id)
          }
        }
      }
      showSuccessToast('保存成功')
      showEditPopup.value = false
      await fetchData()
    } else {
      showToast(res.message || '保存失败')
    }
  } catch (e) {
    showToast('保存失败')
  } finally {
    saving.value = false
  }
}

const handleSetActive = async (id) => {
  try {
    const res = await setActivePrompt(id)
    if (res.code === 200) {
      showSuccessToast('已设为当前使用')
      await fetchData()
    } else {
      showToast(res.message || '设置失败')
    }
  } catch (e) {
    showToast('设置失败')
  }
}

const handleDelete = async (id) => {
  try {
    await showConfirmDialog({
      title: '删除提示词',
      message: '确定删除这条提示词吗？',
      confirmButtonText: '删除',
      confirmButtonColor: '#ff4757',
      cancelButtonText: '取消'
    })
    const res = await deletePrompt(id)
    if (res.code === 200) {
      showSuccessToast('已删除')
      await fetchData()
    } else {
      showToast(res.message || '删除失败')
    }
  } catch (e) {
    // 取消操作不处理
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(fetchData)
</script>

<style scoped>
.prompt-page {
  min-height: 100vh;
  background: var(--color-background, #f8f8f8);
  padding-bottom: 100px;
}

.section-title {
  font-size: 13px;
  color: #999;
  padding: 16px 16px 8px;
}

/* 当前激活区 */
.active-section {
  margin-bottom: 4px;
}

.active-card {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-left: 4px solid var(--primary-pink, #ff6b8a);
}

.active-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.active-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.active-badge {
  background: var(--primary-pink, #ff6b8a);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.active-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-active {
  margin: 0 16px;
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* 列表区 */
.list-section {
  margin-top: 8px;
}

.list-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.empty-list {
  padding: 40px 0;
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

.prompt-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}

.prompt-card.is-active {
  border-left: 4px solid var(--primary-pink, #ff6b8a);
}

.prompt-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.prompt-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-icon {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 2px;
}

.delete-icon {
  color: #ff4757;
}

.prompt-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-time {
  font-size: 12px;
  color: #bbb;
  text-align: right;
}

/* 新建悬浮按钮 */
.fab-btn {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 28px;
  height: 46px;
  box-shadow: 0 4px 16px rgba(255, 107, 138, 0.4);
  z-index: 100;
}

/* 编辑弹窗 */
.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.edit-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.edit-popup-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.edit-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}
</style>
