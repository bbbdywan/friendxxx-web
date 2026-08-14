import { App as CapacitorApp } from '@capacitor/app'
import { showToast } from 'vant'

const EXIT_ROUTES = new Set(['/', '/login'])
const EXIT_CONFIRM_INTERVAL = 2000

export function setupNativeBackNavigation(router) {
  let lastExitRequestAt = 0

  return CapacitorApp.addListener('backButton', () => {
    const currentPath = router.currentRoute.value.path
    const historyState = router.options.history.state

    if (!EXIT_ROUTES.has(currentPath)) {
      if (historyState?.back) {
        router.back()
      } else {
        router.replace('/')
      }
      return
    }

    const now = Date.now()
    if (now - lastExitRequestAt <= EXIT_CONFIRM_INTERVAL) {
      CapacitorApp.exitApp()
      return
    }

    lastExitRequestAt = now
    showToast('再返回一次退出应用')
  })
}
