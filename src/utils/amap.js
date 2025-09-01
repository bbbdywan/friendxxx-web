import AMapLoader from '@amap/amap-jsapi-loader'

class AmapService {
  constructor() {
    this.map = null
    this.geolocation = null
    this.apiKey = '0799518a8aa14f4a73798c949ac03849'
  }

  // 初始化高德地图
  async init() {
    try {
      const AMap = await AMapLoader.load({
        key: this.apiKey,
        version: '2.0',
        plugins: ['AMap.Geolocation', 'AMap.Geocoder']
      })
      
      this.AMap = AMap
      this.geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        convert: true,
        showButton: false,
        buttonPosition: 'LB',
        showMarker: false,
        showCircle: false,
        panToLocation: false,
        zoomToAccuracy: false
      })
      
      return AMap
    } catch (error) {
      console.error('高德地图初始化失败:', error)
      throw error
    }
  }

  // 获取当前位置
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.geolocation) {
        reject(new Error('定位服务未初始化'))
        return
      }

      this.geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
          const position = {
            latitude: result.position.lat,
            longitude: result.position.lng,
            accuracy: result.accuracy,
            address: result.formattedAddress || '',
            province: result.addressComponent?.province || '',
            city: result.addressComponent?.city || '',
            district: result.addressComponent?.district || ''
          }
          resolve(position)
        } else {
          reject(new Error(result.message || '定位失败'))
        }
      })
    })
  }

  // 计算两点间距离(km)
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!this.AMap) return 0
    
    const point1 = new this.AMap.LngLat(lng1, lat1)
    const point2 = new this.AMap.LngLat(lng2, lat2)
    return Math.round(point1.distance(point2) / 1000 * 100) / 100
  }

  // 地理编码 - 地址转坐标
  async geocode(address) {
    if (!this.AMap) await this.init()
    
    return new Promise((resolve, reject) => {
      const geocoder = new this.AMap.Geocoder()
      geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location
          resolve({
            latitude: location.lat,
            longitude: location.lng
          })
        } else {
          reject(new Error('地址解析失败'))
        }
      })
    })
  }

  // 逆地理编码 - 坐标转地址
  async reverseGeocode(latitude, longitude) {
    if (!this.AMap) await this.init()
    
    return new Promise((resolve, reject) => {
      const geocoder = new this.AMap.Geocoder()
      const lnglat = new this.AMap.LngLat(longitude, latitude)
      
      geocoder.getAddress(lnglat, (status, result) => {
        if (status === 'complete' && result.regeocode) {
          resolve({
            address: result.regeocode.formattedAddress,
            province: result.regeocode.addressComponent.province,
            city: result.regeocode.addressComponent.city,
            district: result.regeocode.addressComponent.district
          })
        } else {
          reject(new Error('地址解析失败'))
        }
      })
    })
  }
}

export default new AmapService()