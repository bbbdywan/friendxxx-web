import { ref, computed, onMounted, watch } from 'vue'

const currentTheme = ref('auto')
const systemTheme = ref('light')
const currentTime = ref(new Date())

// 特殊节日配置
const specialDays = {
  '02-14': 'valentine', // 情人节
  '12-25': 'christmas', // 圣诞节
  '01-01': 'newyear'    // 新年
}

export function useTheme() {
  // 检测系统主题
  const detectSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      systemTheme.value = 'dark'
    } else {
      systemTheme.value = 'light'
    }
  }

  // 根据时间判断主题
  const getTimeBasedTheme = () => {
    const hour = currentTime.value.getHours()
    return (hour >= 6 && hour < 18) ? 'light' : 'dark'
  }

  // 检查特殊节日
  const getSpecialTheme = () => {
    const today = currentTime.value
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return specialDays[monthDay] || null
  }

  // 计算最终主题
  const finalTheme = computed(() => {
    const specialTheme = getSpecialTheme()
    if (specialTheme) return specialTheme

    if (currentTheme.value === 'auto') {
      return getTimeBasedTheme()
    }
    if (currentTheme.value === 'system') {
      return systemTheme.value
    }
    return currentTheme.value
  })

  // 应用主题
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    
    // 特殊节日效果
    if (theme === 'valentine') {
      createHeartRain()
    }
  }

  // 情人节爱心雨效果
  const createHeartRain = () => {
    const heartContainer = document.createElement('div')
    heartContainer.className = 'heart-rain'
    document.body.appendChild(heartContainer)

    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const heart = document.createElement('div')
        heart.className = 'falling-heart'
        heart.textContent = ['💖', '💕', '💗', '💝'][Math.floor(Math.random() * 4)]
        heart.style.left = Math.random() * 100 + '%'
        heart.style.animationDelay = Math.random() * 2 + 's'
        heart.style.animationDuration = (Math.random() * 3 + 2) + 's'
        heartContainer.appendChild(heart)

        setTimeout(() => heart.remove(), 5000)
      }, i * 200)
    }

    setTimeout(() => heartContainer.remove(), 10000)
  }

  // 设置主题
  const setTheme = (theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
  }

  // 初始化
  onMounted(() => {
    // 从本地存储读取主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      currentTheme.value = savedTheme
    }

    detectSystemTheme()
    
    // 监听系统主题变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectSystemTheme)
    }

    // 每分钟更新时间
    const timer = setInterval(() => {
      currentTime.value = new Date()
    }, 60000)

    return () => clearInterval(timer)
  })

  // 监听主题变化
  watch(finalTheme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: true })

  return {
    currentTheme,
    finalTheme,
    setTheme,
    getSpecialTheme
  }
}