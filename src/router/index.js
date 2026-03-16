import { createRouter, createWebHistory } from 'vue-router'
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 心事小屋`
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth !== false) {
    const { useUserStore } = await import('../stores/user.js')
    const userStore = useUserStore()

    // 通过API检查登录状态，而不是检查token
    const isLoggedIn = await userStore.checkLoginStatus()

    if (!isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 如果已登录且访问登录页，跳转到首页
  if (to.path === '/login') {
    const { useUserStore } = await import('../stores/user.js')
    const userStore = useUserStore()

    // 检查是否有用户信息，而不是token
    if (userStore.userInfo) {
      next('/')
      return
    }
  }

  next()
})

export default router








