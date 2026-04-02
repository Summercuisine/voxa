import apiClient from '@/api'
import type { Notification, PaginatedResponse } from '@/types'

export interface GetNotificationsParams {
  page?: number
  limit?: number
}

export function getNotifications(params?: GetNotificationsParams) {
  return apiClient.get<unknown, PaginatedResponse<Notification>>('/notifications', { params })
}

export function markAsRead(id: string) {
  return apiClient.patch<unknown, void>(`/notifications/${id}/read`)
}

export function markAllAsRead() {
  return apiClient.patch<unknown, void>('/notifications/read-all')
}

export function getUnreadCount() {
  return apiClient.get<unknown, { count: number }>('/notifications/unread-count')
}

export function deleteNotification(id: string) {
  return apiClient.delete<unknown, void>(`/notifications/${id}`)
}
