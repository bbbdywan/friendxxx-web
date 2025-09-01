import { ref } from 'vue'

export function useEmotionalFeedback() {
  const isShaking = ref(false)
  const isBouncing = ref(false)
  const showEasterEgg = ref(false)

  // 震动反馈
  const shake = (element) => {
    if (isShaking.value) return
    
    isShaking.value = true
    
    if (element) {
      element.classList.add('shake')
      
      // 触觉反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      
      setTimeout(() => {
        element.classList.remove('shake')
        isShaking.value = false
      }, 500)
    }
  }

  // 成功弹跳
  const bounce = (element) => {
    if (isBouncing.value) return
    
    isBouncing.value = true
    
    if (element) {
      element.classList.add('bounce-success')
      
      setTimeout(() => {
        element.classList.remove('bounce-success')
        isBouncing.value = false
      }, 600)
    }
  }

  // 长按彩蛋
  const handleLongPress = (element, callback) => {
    let pressTimer = null
    let isPressed = false
    
    const startPress = (e) => {
      isPressed = true
      pressTimer = setTimeout(() => {
        if (isPressed) {
          showEasterEgg.value = true
          createEmojiExplosion(element, e)
          if (callback) callback()
          
          // 触觉反馈
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200])
          }
        }
      }, 1000) // 1秒长按
    }
    
    const endPress = () => {
      isPressed = false
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }
    
    element.addEventListener('mousedown', startPress)
    element.addEventListener('touchstart', startPress)
    element.addEventListener('mouseup', endPress)
    element.addEventListener('mouseleave', endPress)
    element.addEventListener('touchend', endPress)
    element.addEventListener('touchcancel', endPress)
    
    return () => {
      element.removeEventListener('mousedown', startPress)
      element.removeEventListener('touchstart', startPress)
      element.removeEventListener('mouseup', endPress)
      element.removeEventListener('mouseleave', endPress)
      element.removeEventListener('touchend', endPress)
      element.removeEventListener('touchcancel', endPress)
    }
  }

  // 表情符号爆炸效果
  const createEmojiExplosion = (element, event) => {
    const emojis = ['🎉', '✨', '💫', '🌟', '💖', '🎊', '🦄', '🌈']
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    for (let i = 0; i < 12; i++) {
      const emoji = document.createElement('div')
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      emoji.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        font-size: 20px;
        pointer-events: none;
        z-index: 9999;
        animation: emojiExplosion 1.5s ease-out forwards;
        --angle: ${(360 / 12) * i}deg;
        --distance: ${100 + Math.random() * 50}px;
      `
      
      document.body.appendChild(emoji)
      
      setTimeout(() => emoji.remove(), 1500)
    }
  }

  // 错误提示
  const showError = (message, element) => {
    shake(element)
    
    // 创建错误提示
    const errorTip = document.createElement('div')
    errorTip.textContent = message
    errorTip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 71, 87, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 9999;
      animation: errorFadeIn 0.3s ease-out;
    `
    
    document.body.appendChild(errorTip)
    
    setTimeout(() => {
      errorTip.style.animation = 'errorFadeOut 0.3s ease-in forwards'
      setTimeout(() => errorTip.remove(), 300)
    }, 2000)
  }

  // 成功提示
  const showSuccess = (message, element) => {
    bounce(element)
    
    // 创建成功提示
    const successTip = document.createElement('div')
    successTip.textContent = message
    successTip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 9999;
      animation: successFadeIn 0.3s ease-out;
    `
    
    document.body.appendChild(successTip)
    
    setTimeout(() => {
      successTip.style.animation = 'successFadeOut 0.3s ease-in forwards'
      setTimeout(() => successTip.remove(), 300)
    }, 2000)
  }

  return {
    isShaking,
    isBouncing,
    showEasterEgg,
    shake,
    bounce,
    handleLongPress,
    showError,
    showSuccess
  }
}

// 添加CSS动画
const style = document.createElement('style')
style.textContent = `
  @keyframes emojiExplosion {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1);
      opacity: 0;
    }
  }
  
  @keyframes errorFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  @keyframes errorFadeOut {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
  
  @keyframes successFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  @keyframes successFadeOut {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
`
document.head.appendChild(style)