<template>
  <div class="websocket-status" v-if="showStatus">
    <div class="status-indicator" :class="{ 'connected': userStore.wsConnected }">
      <div class="status-dot"></div>
      <span class="status-text">
        {{ userStore.wsConnected ? 'WebSocket已连接' : 'WebSocket未连接' }}
      </span>
      <span class="user-id" v-if="userStore.userInfo">
        (用户ID: {{ userStore.userInfo.id }})
      </span>
    </div>
    
    <!-- 操作按钮 -->
    <div class="status-actions" v-if="showActions">
      <van-button 
        size="mini" 
        type="primary" 
        @click="reconnect"
        :loading="reconnecting"
        :disabled="userStore.wsConnected"
      >
        重连
      </van-button>
      
      <van-button 
        size="mini" 
        @click="disconnect"
        :disabled="!userStore.wsConnected"
      >
        断开
      </van-button>
      
      <van-button 
        size="mini" 
        @click="toggleStatus"
      >
        {{ showStatus ? '隐藏' : '显示' }}
      </van-button>
    </div>
  </div>
  
  <!-- 悬浮按钮（当状态隐藏时显示） -->
  <div class="floating-toggle" v-else @click="toggleStatus">
    <div class="floating-dot" :class="{ 'connected': userStore.wsConnected }"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user.js'
import { showToast } from 'vant'

const userStore = useUserStore()

// 响应式数据
const showStatus = ref(false)
const showActions = ref(false)
const reconnecting = ref(false)

// 切换状态显示
const toggleStatus = () => {
  showStatus.value = !showStatus.value
}

// 重新连接
const reconnect = async () => {
  try {
    reconnecting.value = true
    await userStore.connectWebSocket()
    showToast({
      type: 'success',
      message: 'WebSocket重连成功'
    })
  } catch (error) {
    showToast({
      type: 'fail',
      message: 'WebSocket重连失败'
    })
  } finally {
    reconnecting.value = false
  }
}

// 断开连接
const disconnect = async () => {
  try {
    await userStore.disconnectWebSocket()
    showToast('WebSocket连接已断开')
  } catch (error) {
    showToast({
      type: 'fail',
      message: '断开连接失败'
    })
  }
}

// 双击显示操作按钮
const handleDoubleClick = () => {
  showActions.value = !showActions.value
}
</script>

<style scoped>
.websocket-status {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  font-size: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.status-indicator:hover {
  opacity: 0.8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ee0a24;
  animation: pulse 2s infinite;
}

.status-indicator.connected .status-dot {
  background: #07c160;
}

.status-text {
  font-weight: 500;
  color: #333;
}

.user-id {
  color: #666;
  font-size: 11px;
}

.status-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.floating-toggle {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.floating-toggle:hover {
  transform: scale(1.1);
}

.floating-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ee0a24;
  animation: pulse 2s infinite;
}

.floating-dot.connected {
  background: #07c160;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .websocket-status {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .status-text {
    color: #fff;
  }
  
  .user-id {
    color: #ccc;
  }
  
  .status-actions {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .floating-toggle {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
