import { ref, reactive } from 'vue'
import { showToast, showDialog } from 'vant'
import amapService from '@/utils/amap'
import { updateLocation } from '@/api/user'
import { useUserStore } from '@/stores/user'

export function useLocation() {
  const userStore = useUserStore()
  const isLocating = ref(false)
  const locationPermission = ref('prompt') // 'granted', 'denied', 'prompt'
  
  const currentLocation = reactive({
    latitude: null,
    longitude: null,
    address: '',
    accuracy: 0,
    timestamp: null
  })

  // 检查定位权限
  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      showToast('您的设备不支持定位功能')
      return false
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      locationPermission.value = permission.state
      return permission.state === 'granted'
    } catch (error) {
      console.log('权限检查失败，使用默认方式')
      return true
    }
  }

  // 请求定位权限
  const requestLocationPermission = async () => {
    const hasPermission = await checkLocationPermission()
    
    if (!hasPermission && locationPermission.value === 'denied') {
      const result = await showDialog({
        title: '需要定位权限',
        message: '为了为您推荐附近的用户，需要获取您的位置信息。请在设置中开启定位权限。',
        confirmButtonText: '去设置',
        cancelButtonText: '取消'
      }).catch(() => false)
      
      if (result) {
        // 引导用户去设置页面
        showToast('请在设置中开启定位权限')
      }
      return false
    }
    
    return true
  }

  // 获取当前位置
  const getCurrentLocation = async (options = {}) => {
    const { 
      showLoading = true, 
      updateServer = true,
      timeout = 10000 
    } = options

    try {
      if (showLoading) {
        isLocating.value = true
      }

      // 检查权限
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        throw new Error('定位权限被拒绝')
      }

      // 初始化高德地图
      await amapService.init()

      // 获取位置
      const position = await amapService.getCurrentPosition()
      
      // 更新本地状态
      Object.assign(currentLocation, {
        ...position,
        timestamp: new Date()
      })

      // 更新服务器
      if (updateServer && userStore.userInfo?.id) {
        await updateLocation({
          latitude: position.latitude,
          longitude: position.longitude,
          address: position.address
        })
        
        // 更新用户store中的位置信息
        userStore.updateUserLocation(position)
      }

      showToast('定位成功')
      return position

    } catch (error) {
      console.error('定位失败:', error)
      
      let errorMessage = '定位失败'
      if (error.message.includes('权限')) {
        errorMessage = '定位权限被拒绝'
      } else if (error.message.includes('超时')) {
        errorMessage = '定位超时，请检查网络'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络错误，请检查网络连接'
      }
      
      showToast(errorMessage)
      throw error
    } finally {
      if (showLoading) {
        isLocating.value = false
      }
    }
  }

  // 计算与其他用户的距离
  const calculateUserDistance = (userLatitude, userLongitude) => {
    if (!currentLocation.latitude || !currentLocation.longitude) {
      return null
    }
    
    return amapService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      userLatitude,
      userLongitude
    )
  }

  // 获取附近位置列表（用于发布动态时选择位置）
  const getNearbyLocations = async () => {
    try {
      if (!currentLocation.latitude || !currentLocation.longitude) {
        await getCurrentLocation({ showLoading: false })
      }

      // 这里可以调用高德地图的POI搜索API获取附近地点
      // 暂时返回模拟数据
      return [
        {
          id: 1,
          name: currentLocation.address || '当前位置',
          address: currentLocation.address || '',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      ]
    } catch (error) {
      console.error('获取附近位置失败:', error)
      return []
    }
  }

  return {
    isLocating,
    locationPermission,
    currentLocation,
    checkLocationPermission,
    requestLocationPermission,
    getCurrentLocation,
    calculateUserDistance,
    getNearbyLocations
  }
}