<template>
  <div class="location-test">
    <van-nav-bar title="定位测试" left-arrow @click-left="$router.back()" />
    
    <div class="test-content">
      <van-cell-group>
        <van-cell title="定位状态" :value="isLocating ? '定位中...' : '空闲'" />
        <van-cell title="权限状态" :value="locationPermission" />
        <van-cell title="纬度" :value="currentLocation.latitude || '未获取'" />
        <van-cell title="经度" :value="currentLocation.longitude || '未获取'" />
        <van-cell title="地址" :value="currentLocation.address || '未获取'" />
        <van-cell title="精度" :value="currentLocation.accuracy ? `${currentLocation.accuracy}m` : '未获取'" />
        <van-cell title="更新时间" :value="currentLocation.timestamp ? formatTime(currentLocation.timestamp) : '未获取'" />
      </van-cell-group>

      <div class="test-buttons">
        <van-button 
          type="primary" 
          block 
          :loading="isLocating"
          @click="testLocation"
        >
          测试定位
        </van-button>
        
        <van-button 
          type="default" 
          block 
          @click="testDistance"
          :disabled="!currentLocation.latitude"
        >
          测试距离计算
        </van-button>
      </div>

      <div v-if="testResults.length" class="test-results">
        <h3>测试结果</h3>
        <div v-for="(result, index) in testResults" :key="index" class="result-item">
          <div class="result-time">{{ formatTime(result.time) }}</div>
          <div class="result-content">{{ result.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLocation } from '@/composables/useLocation'
import { showToast } from 'vant'

const {
  isLocating,
  locationPermission,
  currentLocation,
  getCurrentLocation,
  calculateUserDistance
} = useLocation()

const testResults = ref([])

const addTestResult = (content) => {
  testResults.value.unshift({
    time: new Date(),
    content
  })
}

const testLocation = async () => {
  try {
    addTestResult('开始定位测试...')
    const position = await getCurrentLocation({ updateServer: false })
    addTestResult(`定位成功: ${position.latitude}, ${position.longitude}`)
    addTestResult(`地址: ${position.address}`)
  } catch (error) {
    addTestResult(`定位失败: ${error.message}`)
  }
}

const testDistance = () => {
  // 测试距离计算 - 使用一个固定的坐标点
  const testLat = 39.9042
  const testLng = 116.4074 // 北京天安门
  
  const distance = calculateUserDistance(testLat, testLng)
  if (distance !== null) {
    addTestResult(`与北京天安门距离: ${distance}km`)
    showToast(`距离: ${distance}km`)
  } else {
    addTestResult('距离计算失败: 当前位置未获取')
    showToast('请先获取当前位置')
  }
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}
</script>

<style scoped>
.location-test {
  height: 100vh;
  background: #f7f8fa;
}

.test-content {
  padding: 16px;
}

.test-buttons {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-results {
  margin-top: 20px;
}

.test-results h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.result-item {
  background: white;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 3px solid #1989fa;
}

.result-time {
  font-size: 12px;
  color: #969799;
  margin-bottom: 4px;
}

.result-content {
  font-size: 14px;
  color: #323233;
}
</style>