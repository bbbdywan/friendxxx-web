import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginPage.vue'), meta: { title: '登录', showTabBar: false, requiresAuth: false } },
  { path: '/', name: 'Home', component: () => import('../views/HomePage.vue'), meta: { title: '首页', showTabBar: true, requiresAuth: false } },
  { path: '/discover', name: 'Discover', component: () => import('../views/DiscoverPage.vue'), meta: { title: '发现', showTabBar: true, requiresAuth: true } },
  { path: '/chat', name: 'Chat', component: () => import('../views/ChatPage.vue'), meta: { title: '聊天', showTabBar: true, requiresAuth: true } },
  { path: '/chat/:id', name: 'ChatDetail', component: () => import('../views/ChatDetail.vue'), meta: { title: '聊天详情', showTabBar: false, requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/NewProfilePage.vue'), meta: { title: '我的', showTabBar: true, requiresAuth: true } },
  { path: '/user/:id', name: 'UserProfile', component: () => import('../views/UserProfile.vue'), meta: { title: '用户资料', showTabBar: false, requiresAuth: true } },
  { path: '/post', name: 'PostPage', component: () => import('../views/PostPage.vue'), meta: { title: '发布动态', showTabBar: false, requiresAuth: true } },
  { path: '/tags-edit', name: 'TagsEdit', component: () => import('../views/TagsEditPage.vue'), meta: { title: '编辑标签', requiresAuth: true } },
  { path: '/ai-chat', name: 'AiChat', component: () => import('../views/AiChatPage.vue'), meta: { title: 'AI助手', showTabBar: false, requiresAuth: true } },
  { path: '/my-moments', name: 'MyMoments', component: () => import('../views/MyMomentsPage.vue'), meta: { title: '我的动态', requiresAuth: true } },
  { path: '/search', name: 'Search', component: () => import('../views/SearchPage.vue'), meta: { title: '搜索', showTabBar: false, requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: () => import('../views/AdminPage.vue'), meta: { title: '管理中心', showTabBar: false, requiresAuth: true, requiresAdmin: true } },
  { path: '/ai-admin', name: 'AiCharacterAdmin', component: () => import('../views/AiCharacterAdminPage.vue'), meta: { title: 'AI 人设管理', showTabBar: false, requiresAuth: true, requiresAdmin: true } },
  { path: '/interactions', name: 'Interactions', component: () => import('../views/InteractionsPage.vue'), meta: { title: '互动消息', showTabBar: false, requiresAuth: true } },
  { path: '/prompt', name: 'Prompt', component: () => import('../views/PromptPage.vue'), meta: { title: 'AI提示词设置', showTabBar: false, requiresAuth: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  if (to.meta.title) document.title = `${to.meta.title} - 心事小屋`

  const { useUserStore } = await import('../stores/user.js')
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false) {
    try {
      const ok = await userStore.checkLoginStatus()
      if (!ok) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
      // 管理员页面：前端提前拦截普通用户（后端 403 仍是最终防线）
      if (to.meta.requiresAdmin) {
        const role = Number(userStore.userInfo?.userRole)
        if (role !== 1) {
          return { path: '/', query: { noPerm: '1' } }
        }
      }
    } catch (e) {
      // 非 401 错误（403/404/500/网络）：保持当前登录状态，不强制跳登录
      console.warn('登录状态校验失败（非认证错误），保持登录:', e?.message)
    }
  }
  if (to.path === '/login' && userStore.userInfo) return '/'
})

export default router
