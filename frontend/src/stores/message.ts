import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadCount as fetchUnreadCountApi } from '@/api/messages'

export const useMessageStore = defineStore('message', () => {
  // State
  const unreadCount = ref(0)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  // Actions
  async function fetchUnreadCount() {
    try {
      const res = await fetchUnreadCountApi()
      unreadCount.value = res.count
    } catch {
      // 静默处理错误
    }
  }

  function incrementUnread() {
    unreadCount.value++
  }

  function clearUnread() {
    unreadCount.value = 0
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
    unreadCount,
    fetchUnreadCount,
    incrementUnread,
    clearUnread,
    startPolling,
    stopPolling,
  }
})
