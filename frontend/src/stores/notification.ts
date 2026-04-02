import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getNotifications,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  getUnreadCount as fetchUnreadCountApi,
  deleteNotification as deleteNotificationApi,
} from '@/api/notifications'
import type { Notification } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  // Actions
  async function fetchNotifications(page = 1, limit = 20) {
    isLoading.value = true
    try {
      const res = await getNotifications({ page, limit })
      notifications.value = res.data
    } catch {
      // 静默处理错误
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await fetchUnreadCountApi()
      unreadCount.value = res.count
    } catch {
      // 静默处理错误
    }
  }

  async function markAsRead(id: string) {
    try {
      await markAsReadApi(id)
      const notification = notifications.value.find((n) => n.id === id)
      if (notification) {
        notification.isRead = true
      }
      // 更新未读数
      if (unreadCount.value > 0) {
        unreadCount.value--
      }
    } catch {
      // 静默处理错误
    }
  }

  async function markAllAsRead() {
    try {
      await markAllAsReadApi()
      notifications.value.forEach((n) => {
        n.isRead = true
      })
      unreadCount.value = 0
    } catch {
      // 静默处理错误
    }
  }

  async function deleteNotification(id: string) {
    try {
      await deleteNotificationApi(id)
      const index = notifications.value.findIndex((n) => n.id === id)
      if (index !== -1) {
        const removed = notifications.value.splice(index, 1)[0]
        if (removed && !removed.isRead && unreadCount.value > 0) {
          unreadCount.value--
        }
      }
    } catch {
      // 静默处理错误
    }
  }

  function startPolling() {
    if (pollingTimer) return
    fetchUnreadCount()
    pollingTimer = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  }
})
