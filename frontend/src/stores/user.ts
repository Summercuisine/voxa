import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import * as authApi from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)
  const username = computed(() => currentUser.value?.username ?? '')
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  // Actions
  function setToken(newToken: string | null) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  function setUser(user: User | null) {
    currentUser.value = user
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    setToken(res.access_token)
    setUser(res.user)
    return res
  }

  async function register(username: string, email: string, password: string) {
    const res = await authApi.register(username, email, password)
    setToken(res.access_token)
    setUser(res.user)
    return res
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  async function fetchProfile() {
    try {
      const user = await authApi.getProfile()
      setUser(user)
      return user
    } catch {
      logout()
      throw new Error('Failed to fetch profile')
    }
  }

  return {
    currentUser,
    token,
    isLoggedIn,
    username,
    isAdmin,
    setToken,
    setUser,
    login,
    register,
    logout,
    fetchProfile,
  }
})
