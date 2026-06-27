<template>
  <div class="claude-chat">
    <!-- Header -->
    <div class="chat-header">
      <van-icon name="arrow-left" size="20" @click="$router.back()" />
      <div class="header-center">
        <div class="claude-avatar-small">
          <span>C</span>
        </div>
        <div class="header-info">
          <span class="title">Claude AI</span>
          <span class="status-tag">{{ statusMap[status] }}</span>
        </div>
      </div>
      <van-icon name="delete-o" size="20" color="#999" @click="handleClear" />
    </div>

    <!-- Messages -->
    <div class="messages" ref="msgList">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">C</div>
        <p>连接成功后即可对话</p>
      </div>

      <div v-for="(msg, idx) in messages" :key="idx" class="message-wrapper">
        <!-- 时间分隔 -->
        <div v-if="shouldShowTime(msg, idx)" class="time-divider">
          <span>{{ formatMessageTime(msg.timestamp) }}</span>
        </div>

        <div class="message-item" :class="msg.role === 'user' ? 'message-sent' : 'message-received'">
          <!-- 对方头像 (Claude) -->
          <div class="message-avatar" v-if="msg.role === 'claude' || msg.role === 'error'">
            <div class="avatar-circle claude-avatar">C</div>
          </div>

          <!-- 消息内容 -->
          <div class="message-content">
            <div
              class="message-bubble text-message"
              :class="{
                'streaming': msg.streaming,
                'error-bubble': msg.role === 'error'
              }"
            >
              <div class="bubble-content">{{ msg.text }}</div>
              <span v-if="msg.streaming" class="typing-dot">...</span>
            </div>
          </div>

          <!-- 我的头像 -->
          <div class="message-avatar" v-if="msg.role === 'user'">
            <van-image
              :src="userAvatar"
              fit="cover"
              round
              width="44"
              height="44"
              error-icon="user-o"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-area">
      <div class="input-toolbar">
        <div class="input-wrapper">
          <van-field
            v-model="inputText"
            placeholder="输入消息..."
            :disabled="status !== 'connected'"
            @keydown.enter="handleSend"
            rows="1"
            autosize
            type="textarea"
          />
          <van-icon
            v-if="inputText.trim()"
            name="send"
            size="22"
            color="var(--van-primary-color)"
            @click="handleSend"
            class="send-icon"
          />
          <van-icon
            v-else
            name="audio"
            size="22"
            color="#ccc"
            class="send-icon"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { showDialog, showToast } from 'vant'
import { useClaudeChat } from '@/composables/useClaudeChat'
import { useUserStore } from '@/stores/user'

const msgList = ref(null)
const statusMap = { connecting: '连接中...', connected: '在线', disconnected: '重连中...' }
const { status, messages, send, clearMessages } = useClaudeChat()
const inputText = ref('')
const userStore = useUserStore()

const userAvatar = computed(() => {
  return userStore.userInfo?.avatarUrl || userStore.userInfo?.avatar || 'https://picsum.photos/44/44?random=me'
})

function handleSend() {
  const text = inputText.value.trim()
  if (!text || status.value !== 'connected') return
  send(text)
  inputText.value = ''
}

function handleClear() {
  if (messages.value.length === 0) {
    showToast('没有对话记录')
    return
  }
  showDialog({
    title: '清空对话',
    message: '确定清空所有对话记录吗？',
    showCancelButton: true
  }).then(() => {
    clearMessages()
    showToast('已清空')
  }).catch(() => {})
}

function shouldShowTime(msg, idx) {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  if (!prev?.timestamp || !msg.timestamp) return false
  return (msg.timestamp - prev.timestamp) > 5 * 60 * 1000
}

function formatMessageTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return time
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天 ' + time
  return `${d.getMonth() + 1}/${d.getDate()} ` + time
}

watch(messages, async () => {
  await nextTick()
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
}, { deep: true })
</script>

<style scoped>
.claude-chat {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  z-index: 10;
  gap: 12px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.claude-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-info .title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.status-tag {
  font-size: 11px;
  color: #999;
}

/* Messages */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.empty-state {
  margin: 40px auto;
  text-align: center;
  color: #999;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto 12px;
}

.empty-state p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* Wrapper & time */
.message-wrapper {
  margin-bottom: 4px;
}

.time-divider {
  text-align: center;
  margin: 16px 0;
}

.time-divider span {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.06);
  color: #999;
  font-size: 12px;
  border-radius: 10px;
}

/* Message item */
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 16px;
  animation: msgIn 0.3s ease;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.claude-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

/* Bubble */
.message-content {
  max-width: 75%;
}

.message-sent .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.text-message {
  position: relative;
  padding: 12px 16px;
  line-height: 1.6;
  font-size: 15px;
  word-break: break-word;
  border-radius: 18px 18px 8px 18px;
}

/* Claude bubble */
.message-received .text-message {
  background: #fff;
  color: #333;
  border-radius: 18px 18px 18px 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.message-received .text-message::before {
  content: '';
  position: absolute;
  left: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border: 7px solid transparent;
  border-right: 7px solid #fff;
}

/* User bubble */
.message-sent .text-message {
  background: linear-gradient(135deg, #ffe0e8, #ffcad6);
  color: #333;
  border-radius: 18px 18px 6px 18px;
}

.message-sent .text-message::before {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 10px;
  width: 0;
  height: 0;
  border: 7px solid transparent;
  border-left: 7px solid #ffcad6;
}

/* Error bubble */
.error-bubble {
  background: rgba(255, 107, 154, 0.08) !important;
  border: 1px solid rgba(255, 107, 154, 0.15) !important;
  color: #e94560 !important;
  font-size: 13px !important;
  text-align: center;
  border-radius: 12px !important;
  max-width: 85% !important;
}

.error-bubble::before {
  display: none !important;
}

.message-received .error-bubble {
  margin: 0 auto;
}

/* Streaming */
.text-message.streaming {
  border-left: 3px solid #667eea;
}

.typing-dot {
  display: inline;
  animation: blink 0.8s infinite;
  color: #667eea;
  font-weight: bold;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

/* Input */
.input-area {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #eee;
  padding: 10px 14px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 10;
}

.input-toolbar {
  display: flex;
  align-items: center;
  width: 100%;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border-radius: 22px;
  padding: 4px 14px;
  min-height: 42px;
}

.input-wrapper :deep(.van-field) {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0;
}

.input-wrapper :deep(.van-field__control) {
  background: transparent;
  border: none;
  font-size: 15px;
  resize: none;
  outline: none;
}

.send-icon {
  flex-shrink: 0;
  margin-left: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.send-icon:active {
  transform: scale(0.9);
}

/* Scrollbar */
.messages::-webkit-scrollbar {
  width: 4px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}
</style>
