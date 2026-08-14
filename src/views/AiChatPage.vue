<template>
  <div class="ai-chat-page">
    <div class="header">
      <van-icon name="arrow-left" @click="$router.back()" />
      <div class="header-title">
        <img v-if="character?.avatarUrl" :src="character.avatarUrl" class="header-avatar" alt="" />
        <h1>{{ character?.name || 'AI 助手' }}</h1>
        <van-tag v-if="isStreaming" type="primary" size="small">输入中</van-tag>
      </div>
      <van-icon name="plus" aria-label="新开会话" @click="confirmClear" />
    </div>

    <!-- 角色选择（未创建会话时） -->
    <div v-if="!conversationId" class="role-picker">
      <div class="role-grid">
        <div
          v-for="c in characters"
          :key="c.id"
          class="role-card"
          @click="startConversation(c.id)"
        >
          <div class="role-avatar">
            <van-image
              round
              width="60"
              height="60"
              fit="cover"
              :src="c.avatarUrl || defaultAvatar"
              @error="onAvatarError($event, c)"
            />
          </div>
          <div class="role-name">{{ c.name }}</div>
        </div>
      </div>
      <van-empty v-if="characters.length === 0" description="暂无可用的 AI 角色" />
    </div>

    <!-- 聊天区域 -->
    <div v-else class="chat-container" ref="chatContent" @scroll="onScroll">
      <div class="load-more" v-if="hasMore && !loadingHistory">
        <van-button size="mini" plain @click="loadOlder">加载更早的消息</van-button>
      </div>

      <div
        v-for="(group, gIdx) in renderedGroups"
        :key="gIdx"
        class="turn-group"
      >
        <div
          v-for="m in group"
          :key="m.id"
          class="message-wrapper"
          :class="{ 'user-wrapper': m.isUser, 'ai-wrapper': !m.isUser }"
        >
          <img v-if="!m.isUser" :src="character?.avatarUrl || defaultAvatar" class="avatar ai-avatar" alt="AI" />
          <div class="message" :class="{ user: m.isUser, ai: !m.isUser }">
            <template v-if="m.status === 'partial' && !m.isStreaming">
              <span class="partial-mark">[已中断]</span>
            </template>
            {{ m.content }}
            <span v-if="m.isStreaming" class="cursor">|</span>
          </div>
          <img v-if="m.isUser" :src="userStore.userInfo?.avatar || defaultUserAvatar" class="avatar user-avatar" alt="用户" />
        </div>
      </div>

      <div v-if="isStreaming && messages.length > 0 && !currentStreaming" class="typing">
        <span>AI 正在思考</span>
        <div class="dots"><div></div><div></div><div></div></div>
      </div>
    </div>

    <!-- 回到底部 -->
    <div v-if="showBackToBottom" class="back-to-bottom" @click="forceScrollToBottom">
      <van-icon name="down" size="16" />
    </div>

    <!-- 输入区域 -->
    <div v-if="conversationId" class="input-area">
      <input
        v-model="inputText"
        @keyup.enter="handleSend"
        placeholder="输入消息..."
        :disabled="isStreaming"
        maxlength="4000"
      />
      <button
        v-if="!isStreaming"
        @click="handleSend"
        :disabled="!inputText.trim() || loadingHistory"
      >
        发送
      </button>
      <button v-else class="stop-btn" @click="stopStream">停止</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { showToast, showDialog } from 'vant'
import {
  listCharacters, createConversation, listConversations, getConversation,
  listMessages, sendMessageSse
} from '../api/ai.js'
import { useUserStore } from '../stores/user.js'
import { getApiErrorMessage } from '../utils/error.js'

const userStore = useUserStore()
const defaultAvatar = '/aiimage.jpg'
const defaultUserAvatar = 'https://picsum.photos/40/40?random=me'

const characters = ref([])
const character = ref(null)
const conversationId = ref('')
const messages = ref([])
const inputText = ref('')
const isStreaming = ref(false)
const loadingHistory = ref(false)
const hasMore = ref(false)
const showBackToBottom = ref(false)
const autoScrollEnabled = ref(true)
const chatContent = ref(null)

let abortController = null
let currentClientMessageId = null
let nextCursor = ''
let scrollRaf = null

function throttleScroll() {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null
    scrollToBottom()
  })
}

const currentStreaming = computed(() =>
  messages.value.some(m => m.isStreaming)
)

/**
 * 将消息按轮次分组：assistant 消息若 turnId 相同则归为一组（紧凑气泡），
 * user 消息各自一组。
 */
const renderedGroups = computed(() => {
  const groups = []
  let currentGroup = null
  let currentTurn = null
  for (const m of messages.value) {
    if (m.isUser) {
      currentGroup = null
      currentTurn = null
      groups.push([m])
      continue
    }
    // assistant 消息：同 turn 归组
    if (m.turnId && m.turnId === currentTurn && currentGroup) {
      currentGroup.push(m)
    } else {
      currentGroup = [m]
      currentTurn = m.turnId
      groups.push(currentGroup)
    }
  }
  return groups
})

function onAvatarError(event, c) {
  const el = event?.target
  if (el) {
    el.src = defaultAvatar
  }
}

async function loadCharacters() {
  const res = await listCharacters()
  if (res.code === 200) characters.value = res.data || []
}

async function restoreSession() {
  const saved = localStorage.getItem('aiSession')
  if (!saved) return false
  let cid
  try {
    ;({ conversationId: cid } = JSON.parse(saved))
  } catch {
    return false
  }
  try {
    const pageRes = await listMessages(cid, '', 30)
    if (pageRes.code !== 200) {
      if (pageRes.code === 404) {
        // 会话不存在：清理本地 session
        localStorage.removeItem('aiSession')
        showToast('原会话已失效，请重新选择角色')
        return false
      }
      showToast(pageRes.message || '恢复会话失败')
      return false
    }
    const { items = [], nextCursor: nc = '', hasMore: hm = false } = pageRes.data || {}
    conversationId.value = cid
    nextCursor = nc || ''
    hasMore.value = hm
    try {
      const detailRes = await getConversation(cid)
      if (detailRes.code === 200 && detailRes.data) {
        character.value = {
          id: detailRes.data.characterId,
          name: detailRes.data.characterName || 'AI 助手',
          avatarUrl: detailRes.data.characterAvatarUrl || ''
        }
      }
    } catch (e) {
      if (e?.status === 404 || e?.code === 404) {
        localStorage.removeItem('aiSession')
        showToast('原会话已失效，请重新选择角色')
        return false
      }
      // 网络/其他错误：保留 session，继续用本地兜底
      const convs = await listConversations(1, 1)
      const conv = (convs.data || []).find(c => c.id === cid)
      if (conv) character.value = { id: conv.characterId, name: 'AI 助手' }
    }
    messages.value = (items || []).map(vo => ({
      id: vo.id,
      content: vo.content || '',
      isUser: vo.role === 'user',
      status: vo.status || 'completed',
      isStreaming: false,
      turnId: vo.turnId,
      timestamp: vo.createTime
    }))
    await scrollToBottom()
    return true
  } catch (e) {
    // 网络失败：保留 session，不强制清空
    if (e?.status !== 404 && e?.code !== 404) {
      showToast(getApiErrorMessage(e, '恢复会话失败'))
    }
    return false
  }
}

async function startConversation(characterId) {
  try {
    const res = await createConversation(characterId)
    if (res.code !== 200) {
      showToast(res.message || '创建会话失败')
      return
    }
    conversationId.value = res.data.id
    character.value = characters.value.find(c => c.id === characterId)
    messages.value = []
    nextCursor = ''
    hasMore.value = false
    localStorage.setItem('aiSession', JSON.stringify({ conversationId: conversationId.value }))
    showToast('已创建新会话')
  } catch (e) {
    showToast(getApiErrorMessage(e, '创建会话失败'))
  }
}

async function loadOlder() {
  if (loadingHistory.value || !nextCursor) return
  loadingHistory.value = true
  try {
    const res = await listMessages(conversationId.value, nextCursor, 30)
    if (res.code === 200 && res.data) {
      const { items = [], nextCursor: nc = '', hasMore: hm = false } = res.data
      const older = (items || []).map(vo => ({
        id: vo.id,
        content: vo.content || '',
        isUser: vo.role === 'user',
        status: vo.status || 'completed',
        isStreaming: false,
        turnId: vo.turnId,
        timestamp: vo.createTime
      }))
      const existingIds = new Set(messages.value.map(m => m.id))
      messages.value = [...older.filter(m => !existingIds.has(m.id)), ...messages.value]
      nextCursor = nc || ''
      hasMore.value = hm
    } else {
      nextCursor = ''
      hasMore.value = false
    }
  } catch (e) {
    showToast(getApiErrorMessage(e, '加载失败'))
  } finally {
    loadingHistory.value = false
  }
}

function onScroll() {
  const el = chatContent.value
  if (!el) return
  if (el.scrollTop < 40) {
    loadOlder()
  }
  // 用户上滑（离开底部 60px）→ 暂停自动滚动并显示回到底部
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  autoScrollEnabled.value = atBottom
  showBackToBottom.value = !atBottom
}

async function handleSend() {
  const content = inputText.value.trim()
  if (!content || isStreaming.value) return

  const clientMessageId = crypto.randomUUID ? crypto.randomUUID() : `mid-${Date.now()}-${Math.random().toString(16).slice(2)}`
  currentClientMessageId = clientMessageId

  messages.value.push({
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    content,
    isUser: true,
    status: 'completed',
    timestamp: new Date().toISOString()
  })
  inputText.value = ''
  isStreaming.value = true
  await scrollToBottom()

  abortController = new AbortController()
  const token = localStorage.getItem('accessToken')
  const msgByIndex = new Map()

  try {
    await sendMessageSse({
      conversationId: conversationId.value,
      content,
      clientMessageId,
      token,
      signal: abortController.signal,
      onMessageStart: (data) => {
        // 新气泡开始
        let aiMsg = msgByIndex.get(data.index)
        if (!aiMsg) {
          aiMsg = reactive({
            id: data.messageId || `stream-${Date.now()}-${data.index}`,
            content: '',
            isUser: false,
            status: 'generating',
            isStreaming: true,
            turnId: data.turnId,
            timestamp: new Date().toISOString()
          })
          messages.value.push(aiMsg)
          msgByIndex.set(data.index, aiMsg)
        }
      },
      onMessageDelta: (data) => {
        let aiMsg = msgByIndex.get(data.index)
        if (!aiMsg) {
          aiMsg = reactive({
            id: data.messageId || `stream-${Date.now()}-${data.index}`,
            content: '',
            isUser: false,
            status: 'generating',
            isStreaming: true,
            turnId: data.turnId,
            timestamp: new Date().toISOString()
          })
          messages.value.push(aiMsg)
          msgByIndex.set(data.index, aiMsg)
        }
        aiMsg.content += (data.content || '')
        if (data.messageId) aiMsg.id = data.messageId
        throttleScroll()
      },
      onMessageEnd: (data) => {
        const aiMsg = msgByIndex.get(data.index)
        if (aiMsg) {
          aiMsg.isStreaming = false
          aiMsg.status = data.status || 'completed'
          if (data.messageId) aiMsg.id = data.messageId
          if (!aiMsg.content) aiMsg.content = '（未返回内容）'
        }
      },
      onUsage: () => {},
      onDone: (data) => {
        // 只结束本轮生成的消息，不触碰历史消息
        for (const m of msgByIndex.values()) {
          m.isStreaming = false
          m.status = m.content ? 'completed' : 'failed'
        }
      },
      onError: (err) => {
        for (const m of msgByIndex.values()) {
          m.isStreaming = false
          m.status = m.content ? 'partial' : 'failed'
        }
        showToast(getApiErrorMessage(err, '生成失败'))
      }
    })
  } catch (e) {
    const isAbort = e?.name === 'AbortError' || e?.isAborted?.()
    if (isAbort) {
      for (const m of msgByIndex.values()) {
        m.isStreaming = false
        m.status = m.content ? 'partial' : 'cancelled'
      }
    } else if (e?.status === 409 || e?.code === 409) {
      showToast('会话状态冲突，请刷新')
    } else if (e?.status === 429 || e?.code === 429) {
      showToast('有对话正在生成中，请稍候')
    } else if (e?.isAuthError?.()) {
      await userStore.checkLoginStatus()
    } else {
      for (const m of msgByIndex.values()) {
        m.isStreaming = false
        m.status = m.content ? 'partial' : 'failed'
      }
      showToast(getApiErrorMessage(e, '生成失败'))
    }
  } finally {
    isStreaming.value = false
    currentClientMessageId = null
    abortController = null
    msgByIndex.clear()
    await scrollToBottom()
  }
}

function stopStream() {
  if (abortController) {
    abortController.abort()
  }
}

async function confirmClear() {
  try {
    await showDialog({
      title: '新建会话',
      message: '开始新的对话？当前会话记录仍保留在服务端。',
      showCancelButton: true,
      confirmButtonText: '新开对话',
      cancelButtonText: '取消'
    })
    conversationId.value = ''
    character.value = null
    messages.value = []
    nextCursor = ''
    hasMore.value = false
    localStorage.removeItem('aiSession')
  } catch {
    // 用户取消
  }
}

async function scrollToBottom() {
  await nextTick()
  const el = chatContent.value
  if (el && autoScrollEnabled.value) {
    el.scrollTop = el.scrollHeight
  }
}

function forceScrollToBottom() {
  const el = chatContent.value
  if (el) {
    el.scrollTop = el.scrollHeight
    autoScrollEnabled.value = true
    showBackToBottom.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadCharacters(), restoreSession()])
  } catch {
    // 忽略
  }
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
  if (scrollRaf) {
    cancelAnimationFrame(scrollRaf)
    scrollRaf = null
  }
})
</script>

<style scoped>
.ai-chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #eee;
}
.header-title { display: flex; align-items: center; gap: 8px; }
.header-title h1 { font-size: 18px; font-weight: 500; margin: 0; }
.header-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
.header .van-icon { font-size: 20px; color: #666; cursor: pointer; }

.role-picker {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 16px 12px;
  max-width: 420px;
  margin: 0 auto;
}
.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 16px;
  padding: 16px 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.1s ease;
  user-select: none;
}
.role-card:active { transform: scale(0.96); }
.role-avatar { width: 60px; height: 60px; }
.role-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  text-align: center;
}

.chat-container {
  position: relative;
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.load-more { text-align: center; margin-bottom: 12px; }
.back-to-bottom {
  position: absolute;
  right: 16px;
  bottom: 84px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #666;
}

/* 同一轮多气泡：紧凑间距；不同轮：宽松间距 */
.turn-group { margin-bottom: 16px; }
.turn-group .message-wrapper { margin-bottom: 6px; }
.turn-group .message-wrapper:first-child { margin-top: 0; }
.turn-group .message-wrapper:last-child { margin-bottom: 0; }

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.message-wrapper.user-wrapper { justify-content: flex-end; }
.message-wrapper.ai-wrapper { justify-content: flex-start; }

.avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.ai-avatar { border: 2px solid #e0e0e0; }
.user-avatar { border: 2px solid #007AFF; }

.message {
  max-width: 65%;
  padding: 16px 20px;
  border-radius: 22px;
  line-height: 1.4;
  word-wrap: break-word;
  font-size: 16px;
  white-space: pre-wrap;
}
.message.user { background: #007AFF; color: white; border-bottom-right-radius: 6px; }
.message.ai { background: white; color: #333; border-bottom-left-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.partial-mark { color: #e6a23c; font-size: 12px; margin-right: 4px; }
.cursor { animation: blink 1s infinite; }

.typing { display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; background: white; padding: 16px 20px; border-radius: 22px; border-bottom-left-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.dots { display: flex; gap: 4px; }
.dots div { width: 6px; height: 6px; border-radius: 50%; background: #999; animation: pulse 1.4s infinite ease-in-out; }
.dots div:nth-child(2) { animation-delay: 0.2s; }
.dots div:nth-child(3) { animation-delay: 0.4s; }

.input-area { display: flex; gap: 12px; padding: 16px; background: white; border-top: 1px solid #eee; }
.input-area input { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 16px; }
.input-area button { padding: 12px 20px; background: #007AFF; color: white; border: none; border-radius: 20px; cursor: pointer; }
.input-area button:disabled { background: #ccc; cursor: not-allowed; }
.input-area .stop-btn { background: #e6a23c; }

@keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
@keyframes pulse { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
</style>
