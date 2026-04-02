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
    path: '/post/create',
    name: 'post-create',
    component: () => import('@/views/CreatePostView.vue'),
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
