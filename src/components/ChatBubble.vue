<template>
  <div 
    class="chat-bubble-container"
    :class="{ 'bubble-sent': isSent, 'bubble-received': !isSent }"
  >
    <!-- 用户头像 -->
    <div v-if="!isSent" class="bubble-avatar">
      <van-image
        :src="message.avatar"
        :alt="message.senderName"
        fit="cover"
        round
        width="32"
        height="32"
      >
        <template #error>
          <div class="avatar-placeholder">🐰</div>
        </template>
      </van-image>
    </div>
    
    <!-- 消息气泡 -->
    <div class="bubble-wrapper">
      <!-- 消息状态指示器 -->
      <div v-if="isSent" class="message-status">
        <van-icon 
          v-if="message.status === 'sending'" 
          name="clock-o" 
          size="12" 
          color="#999"
          class="status-icon rotating"
        />
        <van-icon 
          v-else-if="message.status === 'sent'" 
          name="success" 
          size="12" 
          color="#999"
          class="status-icon"
        />
        <van-icon 
          v-else-if="message.status === 'read'" 
          name="success" 
          size="12" 
          color="var(--van-primary-color)"
          class="status-icon"
        />
      </div>
      
      <div
        class="chat-bubble"
        :class="bubbleClass"
        @click="handleBubbleClick"
        @dblclick="handleDoubleClick"
        @contextmenu.prevent="handleLongPress"
      >
        <!-- 文本消息 -->
        <div v-if="message.type === 'text'" class="bubble-text">
          {{ message.content }}
        </div>
        
        <!-- 图片消息 -->
        <div v-else-if="message.type === 'image'" class="bubble-image">
          <van-image
            :src="message.content"
            fit="cover"
            :width="imageSize.width"
            :height="imageSize.height"
            radius="8"
            @click="previewImage"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
          </van-image>
        </div>
        
        <!-- 表情包消息 -->
        <div v-else-if="message.type === 'emoji'" class="bubble-emoji">
          <div class="emoji-large">{{ message.content }}</div>
        </div>
        
        <!-- 语音消息 -->
        <div v-else-if="message.type === 'voice'" class="bubble-voice">
          <van-button
            :icon="isPlaying ? 'pause' : 'play'"
            type="primary"
            size="mini"
            round
            @click="toggleVoice"
          />
          <div class="voice-duration">{{ message.duration }}s</div>
          <div class="voice-waves">
            <div 
              v-for="i in 5" 
              :key="i"
              class="wave-bar"
              :class="{ 'wave-active': isPlaying }"
              :style="{ animationDelay: i * 0.1 + 's' }"
            ></div>
          </div>
        </div>
        
        <!-- 礼物消息 -->
        <div v-else-if="message.type === 'gift'" class="bubble-gift">
          <div class="gift-icon">{{ message.giftEmoji }}</div>
          <div class="gift-text">{{ message.content }}</div>
          <div class="gift-sparkles">
            <div 
              v-for="i in 6" 
              :key="i"
              class="sparkle"
              :style="{ animationDelay: i * 0.2 + 's' }"
            >
              ✨
            </div>
          </div>
        </div>
        
        <!-- 消息时间 -->
        <div class="bubble-time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>
    
    <!-- 消息反应 -->
    <div v-if="message.reactions && message.reactions.length" class="bubble-reactions">
      <van-tag
        v-for="reaction in message.reactions"
        :key="reaction.emoji"
        size="mini"
        round
        class="reaction-tag"
        @click="handleReaction(reaction)"
      >
        {{ reaction.emoji }} {{ reaction.count }}
      </van-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showImagePreview } from 'vant'

const props = defineProps({
  message: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      type: 'text',
      content: 'Hello! 🌸',
      timestamp: Date.now(),
      isSent: false,
      senderName: '小甜心',
      avatar: 'https://picsum.photos/64/64?random=1',
      status: 'read',
      reactions: []
    })
  }
})

const emit = defineEmits(['reaction', 'longPress', 'doubleClick'])

const isPlaying = ref(false)

// 判断是否为发送的消息
const isSent = computed(() => props.message.isSent)

// 气泡样式类
const bubbleClass = computed(() => ({
  'bubble-sent-style': isSent.value,
  'bubble-received-style': !isSent.value,
  'bubble-gift-style': props.message.type === 'gift',
  'bubble-emoji-style': props.message.type === 'emoji'
}))

// 图片尺寸计算
const imageSize = computed(() => {
  const maxWidth = 200
  const maxHeight = 200
  // 这里可以根据实际图片尺寸计算
  return { width: maxWidth, height: maxHeight }
})

// 手势处理函数
const handleDoubleClick = () => {
  // 双击点赞
  handleQuickReaction('❤️')
  emit('doubleClick', props.message)
}

const handleLongPress = () => {
  // 长按显示更多选项
  emit('longPress', props.message)
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  
  return date.toLocaleDateString()
}

// 处理气泡点击
const handleBubbleClick = () => {
  if (props.message.type === 'voice') {
    toggleVoice()
  }
}

// 预览图片
const previewImage = () => {
  showImagePreview([props.message.content])
}

// 切换语音播放
const toggleVoice = () => {
  isPlaying.value = !isPlaying.value
  // 这里可以添加实际的语音播放逻辑
  
  if (isPlaying.value) {
    setTimeout(() => {
      isPlaying.value = false
    }, props.message.duration * 1000)
  }
}

// 快速反应
const handleQuickReaction = (emoji) => {
  // 创建点赞动画
  createReactionAnimation(emoji)
  emit('reaction', { messageId: props.message.id, emoji })
}

// 处理反应点击
const handleReaction = (reaction) => {
  emit('reaction', { messageId: props.message.id, emoji: reaction.emoji })
}

// 创建反应动画
const createReactionAnimation = (emoji) => {
  const bubble = document.querySelector('.chat-bubble')
  if (!bubble) return
  
  const reaction = document.createElement('div')
  reaction.textContent = emoji
  reaction.className = 'reaction-animation'
  reaction.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    pointer-events: none;
    z-index: 10;
    animation: reactionPop 1s ease-out forwards;
  `
  
  bubble.appendChild(reaction)
  
  setTimeout(() => reaction.remove(), 1000)
}
</script>

<style scoped>
/* 放大头像 */
.bubble-avatar .van-image {
  width: 52px !important;
  height: 52px !important;
}

.avatar-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--van-gray-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* 放大气泡 */
.chat-bubble {
  position: relative;
  padding: 16px 20px;
  border-radius: 18px;
  max-width: 100%;
  word-wrap: break-word;
  transition: all var(--van-duration-base) var(--van-ease-out);
  cursor: pointer;
  font-size: 16px;
  line-height: 1.5;
}

/* 调整气泡容器间距 */
.chat-bubble-container {
  display: flex;
  margin: 10px 16px;
  position: relative;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 75%;
}

.bubble-sent .bubble-wrapper {
  align-items: flex-end;
}

.message-status {
  margin-bottom: 4px;
  height: 16px;
}

.status-icon.rotating {
  animation: rotate 1s linear infinite;
}

.chat-bubble:hover {
  transform: scale(1.02);
}

.bubble-sent-style {
  background: linear-gradient(135deg, var(--van-primary-color), #FF69B4);
  color: white;
  border-bottom-right-radius: 6px;
}

.bubble-received-style {
  background: white;
  color: var(--van-text-color);
  border: 1px solid var(--van-border-color);
  border-bottom-left-radius: 6px;
  box-shadow: var(--van-shadow-1);
}

.bubble-gift-style {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  animation: cute-pulse 2s ease-in-out infinite;
}

.bubble-emoji-style {
  background: transparent;
  padding: 8px;
}

.bubble-text {
  line-height: 1.4;
  font-size: 14px;
}

.bubble-image {
  border-radius: 8px;
  overflow: hidden;
}

.bubble-emoji {
  text-align: center;
}

.emoji-large {
  font-size: 48px;
  animation: cute-bounce 0.6s ease-out;
}

.bubble-voice {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.voice-duration {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.voice-waves {
  display: flex;
  gap: 2px;
  align-items: center;
}

.wave-bar {
  width: 3px;
  height: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.wave-active {
  animation: waveAnimation 1s ease-in-out infinite;
}

.bubble-gift {
  text-align: center;
  position: relative;
  overflow: hidden;
}

.gift-icon {
  font-size: 32px;
  margin-bottom: 4px;
  animation: cute-wiggle 2s ease-in-out infinite;
}

.gift-text {
  font-size: 12px;
  font-weight: 600;
}

.gift-sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 12px;
  animation: sparkleFloat 3s ease-in-out infinite;
}

.sparkle:nth-child(1) { top: 10%; left: 10%; }
.sparkle:nth-child(2) { top: 20%; right: 15%; }
.sparkle:nth-child(3) { bottom: 30%; left: 20%; }
.sparkle:nth-child(4) { bottom: 20%; right: 10%; }
.sparkle:nth-child(5) { top: 50%; left: 5%; }
.sparkle:nth-child(6) { top: 40%; right: 5%; }

.bubble-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  text-align: right;
}

.bubble-received-style .bubble-time {
  color: var(--van-text-color-3);
}

.bubble-reactions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.reaction-tag {
  cursor: pointer;
  transition: all var(--van-duration-fast) var(--van-ease-out);
}

.reaction-tag:hover {
  transform: scale(1.1);
}

/* 动画定义 */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes waveAnimation {
  0%, 100% { height: 12px; }
  50% { height: 20px; }
}

@keyframes sparkleFloat {
  0%, 100% { 
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: translateY(-5px) scale(1.2);
    opacity: 1;
  }
}

@keyframes reactionPop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8) translateY(-30px);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bubble-wrapper {
    max-width: 85%;
  }
  
  .chat-bubble {
    padding: 10px 14px;
  }
  
  .emoji-large {
    font-size: 36px;
  }
}
</style>
