import { createRouter, createWebHistory } from 'vue-router'
import pcRoutes from '../pc/router/pc-routes.js'
import HomePage from '../views/HomePage.vue'
import DiscoverPage from '../views/DiscoverPage.vue'
import ChatPage from '../views/ChatPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import NewProfilePage from '../views/NewProfilePage.vue'
import ChatDetail from '../views/ChatDetail.vue'
import UserProfile from '../views/UserProfile.vue'
import LoginPage from '../views/LoginPage.vue'
import AiChatPage from '../views/AiChatPage.vue'
import ApiTestPage from '../views/ApiTestPage.vue'
import DebugPage from '../views/DebugPage.vue'
import TestPage from '../views/TestPage.vue'
import SimpleTest from '../views/SimpleTest.vue'
import LoginDebug from '../views/LoginDebug.vue'
import LoginTest from '../views/LoginTest.vue'
import UserApiTest from '../views/UserApiTest.vue'
import RecommendDebug from '../views/RecommendDebug.vue'
import ChatTest from '../views/ChatTest.vue'
import ChatDebug from '../views/ChatDebug.vue'
import MessageSendTest from '../views/MessageSendTest.vue'
import AdminPage from '../views/AdminPage.vue'
import InteractionsPage from '../views/InteractionsPage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: {
      title: '登录',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: '首页',
      showTabBar: true,
      requiresAuth: false // 临时取消登录要求
    }
  },
  {
    path: '/discover',
    name: 'Discover',
    component: DiscoverPage,
    meta: {
      title: '发现',
      showTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatPage,
    meta: {
      title: '聊天',
      showTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: NewProfilePage,
    meta: {
      title: '我的',
      showTabBar: true,
      requiresAuth: true
    }
  },
  {
    path: '/profile-old',
    name: 'ProfileOld',
    component: ProfilePage,
    meta: {
      title: '个人资料(旧版)',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/chat/:id',
    name: 'ChatDetail',
    component: ChatDetail,
    meta: {
      title: '聊天详情',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: UserProfile,
    meta: {
      title: '用户资料',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: ApiTestPage,
    meta: {
      title: 'API测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/debug',
    name: 'Debug',
    component: DebugPage,
    meta: {
      title: '调试页面',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/test',
    name: 'Test',
    component: TestPage,
    meta: {
      title: '测试页面',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/simple',
    name: 'Simple',
    component: SimpleTest,
    meta: {
      title: '简单测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/login-debug',
    name: 'LoginDebug',
    component: LoginDebug,
    meta: {
      title: '登录调试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/login-test',
    name: 'LoginTest',
    component: LoginTest,
    meta: {
      title: '登录测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/user-api-test',
    name: 'UserApiTest',
    component: UserApiTest,
    meta: {
      title: '用户API测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/recommend-debug',
    name: 'RecommendDebug',
    component: RecommendDebug,
    meta: {
      title: '推荐用户调试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/chat-test',
    name: 'ChatTest',
    component: ChatTest,
    meta: {
      title: '聊天功能测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/chat-debug',
    name: 'ChatDebug',
    component: ChatDebug,
    meta: {
      title: '聊天显示调试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/message-send-test',
    name: 'MessageSendTest',
    component: MessageSendTest,
    meta: {
      title: '消息发送测试',
      showTabBar: false,
      requiresAuth: false
    }
  },
  {
    path: '/post',
    name: 'PostPage',
    component: () => import('../views/PostPage.vue'),
    meta: {
      title: '发布动态',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/tags-edit',
    name: 'TagsEdit',
    component: () => import('../views/TagsEditPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ai-chat',
    name: 'AiChat',
    component: AiChatPage,
    meta: {
      title: 'AI助手',
      showTabBar: false,  // 隐藏底部导航栏
      requiresAuth: true
    }
  },
  {
    path: '/my-moments',
    name: 'MyMoments',
    component: () => import('../views/MyMomentsPage.vue'),
    meta: { title: '我的动态' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
    meta: {
      title: '搜索'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: {
      title: '管理中心',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/interactions',
    name: 'Interactions',
    component: InteractionsPage,
    meta: {
      title: '互动消息',
      showTabBar: false,
      requiresAuth: true
    }
  },
  {
    path: '/prompt',
    name: 'Prompt',
    component: () => import('../views/PromptPage.vue'),
    meta: {
      title: 'AI提示词设置',
      showTabBar: false,
      requiresAuth: true
    }
  }
]

// 屏幕宽度阈值：大于 768px 视为 PC 端
const PC_BREAKPOINT = 768

function isPC() {
  return window.innerWidth > PC_BREAKPOINT
}

// 移动端路由 <-> PC端路由 映射
const mobileToPcMap = {
  '/': '/pc',
  '/login': '/pc/login',
  '/discover': '/pc/discover',
  '/chat': '/pc/chat',
  '/profile': '/pc/profile',
  '/ai-chat': '/pc/ai-chat',
  '/search': '/pc/search',
  '/admin': '/pc/admin'
}

const pcToMobileMap = Object.fromEntries(
  Object.entries(mobileToPcMap).map(([m, p]) => [p, m])
)

// 动态路由映射（带参数）
function getMappedRoute(path, toPC) {
  if (toPC) {
    // 移动端 -> PC端
    if (mobileToPcMap[path]) return mobileToPcMap[path]
    // /chat/:id -> /pc/chat (PC端聊天是内嵌的)
    if (path.startsWith('/chat/')) return '/pc/chat'
    // /user/:id -> /pc/user/:id
    if (path.startsWith('/user/')) return '/pc' + path
    return null
  } else {
    // PC端 -> 移动端
    if (pcToMobileMap[path]) return pcToMobileMap[path]
    // /pc/user/:id -> /user/:id
    if (path.startsWith('/pc/user/')) return path.replace('/pc', '')
    return null
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [...routes, ...pcRoutes]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 心事小屋`
  }

  const isPcDevice = isPC()
  const isPcRoute = to.path.startsWith('/pc')

  // 自动重定向：PC设备访问移动端路由 -> 跳PC端，移动设备访问PC路由 -> 跳移动端
  // 不处理 debug/test 等开发路由
  const isDevRoute = ['/debug', '/test', '/simple', '/login-debug', '/login-test', '/api-test', '/user-api-test', '/recommend-debug', '/chat-test', '/chat-debug', '/message-send-test'].includes(to.path)

  if (!isDevRoute) {
    // PC 设备不再自动跳转到 /pc 路由，统一使用移动端布局（手机外壳模式）
    // 仅保留：移动设备访问 PC 路由时跳回移动端
    if (!isPcDevice && isPcRoute) {
      const mapped = getMappedRoute(to.path, false)
      if (mapped) {
        next({ path: mapped, query: to.query, replace: true })
        return
      }
    }
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth !== false) {
    const { useUserStore } = await import('../stores/user.js')
    const userStore = useUserStore()

    const isLoggedIn = await userStore.checkLoginStatus()

    if (!isLoggedIn) {
      next({
        path: isPcRoute ? '/pc/login' : '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 如果已登录且访问登录页，跳转到首页
  if (to.path === '/login' || to.path === '/pc/login') {
    const { useUserStore } = await import('../stores/user.js')
    const userStore = useUserStore()

    if (userStore.userInfo) {
      next(isPcRoute ? '/pc' : '/')
      return
    }
  }

  next()
})

export default router








