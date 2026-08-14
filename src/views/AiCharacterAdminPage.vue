<template>
  <div class="admin-page">
    <van-nav-bar title="AI 人设管理" left-arrow @click-left="$router.back()" />
    <div class="admin-body">
      <van-cell-group inset title="角色列表">
        <van-cell
          v-for="c in characters"
          :key="c.id"
          :title="c.name"
          :label="`线上版本 v${c.activeVersionNo ?? '-'}${c.hasDraft ? ' · 有草稿' : ''}`"
          center
          clickable
          @click="openEditor(c.id)"
        >
          <template #icon>
            <van-image round width="40" height="40" :src="c.avatarUrl || '/aiimage.jpg'" style="margin-right: 12px" />
          </template>
          <template #right-icon>
            <van-tag :type="c.enabled === 1 ? 'success' : 'default'">
              {{ c.enabled === 1 ? '启用' : '停用' }}
            </van-tag>
          </template>
        </van-cell>
        <van-empty v-if="characters.length === 0" description="暂无角色" />
      </van-cell-group>

      <div class="admin-actions">
        <van-button type="primary" block round @click="createNew">新建角色</van-button>
        <van-button plain block round style="margin-top: 12px" @click="backToChat">返回 AI 聊天</van-button>
      </div>
    </div>

    <!-- 编辑器弹窗 -->
    <van-popup
      v-model:show="editorVisible"
      position="right"
      :style="{ width: 'min(720px, 100%)', height: '100%' }"
      closeable
    >
      <AiCharacterEditor
        v-if="editorVisible"
        :character-id="editingId"
        :is-new="isNew"
        @close="editorVisible = false"
        @created="onCreated"
        @saved="refreshList"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { adminListCharacters } from '../api/aiAdmin.js'
import { useUserStore } from '../stores/user.js'
import AiCharacterEditor from '../components/AiCharacterEditor.vue'
import { useRouter } from 'vue-router'
import { getApiErrorMessage } from '../utils/error.js'

const router = useRouter()
const userStore = useUserStore()
const characters = ref([])
const editorVisible = ref(false)
const editingId = ref(null)
const isNew = ref(false)

async function refreshList() {
  try {
    const res = await adminListCharacters()
    if (res.code === 200) {
      characters.value = res.data || []
    } else {
      showToast(res.message || '加载失败')
    }
  } catch (e) {
    showToast(getApiErrorMessage(e, '无权限或加载失败'))
  }
}

function openEditor(id) {
  editingId.value = id
  isNew.value = false
  editorVisible.value = true
}

function createNew() {
  editingId.value = null
  isNew.value = true
  editorVisible.value = true
}

function onCreated(id) {
  editingId.value = id
  isNew.value = false
}

function backToChat() {
  router.push('/ai-chat')
}

onMounted(refreshList)
</script>

<style scoped>
.admin-page { min-height: 100%; background: #f5f5f5; }
.admin-body { padding: 16px 0 40px; }
.admin-actions { margin: 24px 16px; }
</style>
