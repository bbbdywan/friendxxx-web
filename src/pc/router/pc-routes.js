import PcLayout from '../layout/PcLayout.vue'

const pcRoutes = [
  {
    path: '/pc/login',
    name: 'PcLogin',
    component: () => import('../views/PcLogin.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/pc',
    component: PcLayout,
    children: [
      {
        path: '',
        name: 'PcHome',
        component: () => import('../views/PcHome.vue'),
        meta: { title: '首页', requiresAuth: false }
      },
      {
        path: 'discover',
        name: 'PcDiscover',
        component: () => import('../views/PcDiscover.vue'),
        meta: { title: '发现', requiresAuth: true }
      },
      {
        path: 'chat',
        name: 'PcChat',
        component: () => import('../views/PcChat.vue'),
        meta: { title: '聊天', requiresAuth: true }
      },
      {
        path: 'ai-chat',
        name: 'PcAiChat',
        component: () => import('../views/PcAiChat.vue'),
        meta: { title: 'AI助手', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'PcProfile',
        component: () => import('../views/PcProfile.vue'),
        meta: { title: '我的', requiresAuth: true }
      },
      {
        path: 'user/:id',
        name: 'PcUserProfile',
        component: () => import('../views/PcUserProfile.vue'),
        meta: { title: '用户资料', requiresAuth: true }
      },
      {
        path: 'search',
        name: 'PcSearch',
        component: () => import('../views/PcSearch.vue'),
        meta: { title: '搜索', requiresAuth: false }
      },
      {
        path: 'admin',
        name: 'PcAdmin',
        component: () => import('../views/PcAdmin.vue'),
        meta: { title: '管理中心', requiresAuth: true }
      }
    ]
  }
]

export default pcRoutes
