import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/AuthCallbackView.vue'),
  },
  {
    path: '/post/create',
    name: 'post-create',
    component: () => import('@/views/CreatePostView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/post/:id',
    name: 'post-detail',
    component: () => import('@/views/PostDetailView.vue'),
    props: true,
  },
  {
    path: '/category/:id',
    name: 'category',
    component: () => import('@/views/CategoryView.vue'),
    props: true,
  },
  {
    path: '/user/:id',
    name: 'user-profile',
    component: () => import('@/views/UserProfileView.vue'),
    props: true,
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/messages',
    name: 'messages',
    component: () => import('@/views/MessagesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/messages/:id',
    name: 'chat',
    component: () => import('@/views/MessagesView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookmarks',
    name: 'bookmarks',
    component: () => import('@/views/BookmarksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bots',
    name: 'bots',
    component: () => import('@/views/BotsView.vue'),
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
  },
  {
    path: '/badges',
    name: 'badges',
    component: () => import('@/views/BadgesView.vue'),
  },
  {
    path: '/bots/:id',
    name: 'bot-detail',
    component: () => import('@/views/BotDetailView.vue'),
    props: true,
  },
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'users', component: () => import('@/views/admin/UsersView.vue') },
      { path: 'posts', component: () => import('@/views/admin/PostsView.vue') },
      { path: 'bots', component: () => import('@/views/admin/BotStatsView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')

  // 检查是否需要登录
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    // 如果没有 token，跳转登录
    if (!token) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    // 简单检查：如果有 token 但无法确认管理员身份，放行让页面自行处理
    // 实际项目中可以在 store 中缓存用户角色
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role !== 'ADMIN') {
          next({ path: '/' })
          return
        }
      }
    } catch {
      // 解析失败，放行让页面自行处理
    }
  }

  next()
})

export default router
