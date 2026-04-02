import apiClient from '@/api'
import type { DashboardStats, AdminUser, BotStat, PaginatedResponse } from '@/types'

export function getDashboard() {
  return apiClient.get<unknown, DashboardStats>('/admin/dashboard')
}

export function getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
  return apiClient.get<unknown, PaginatedResponse<AdminUser>>('/admin/users', { params })
}

export function updateUser(id: string, data: { role?: string; isActive?: boolean }) {
  return apiClient.patch<unknown, AdminUser>(`/admin/users/${id}`, data)
}

export function deleteUser(id: string) {
  return apiClient.delete<unknown, void>(`/admin/users/${id}`)
}

export function getPosts(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return apiClient.get<unknown, PaginatedResponse<AdminUser>>('/admin/posts', { params })
}

export function deletePost(id: string) {
  return apiClient.delete<unknown, void>(`/admin/posts/${id}`)
}

export function getBotStats() {
  return apiClient.get<unknown, BotStat[]>('/admin/bot-stats')
}
