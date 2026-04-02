import apiClient from '@/api'
import type { LevelConfig, UserLevel, ExperienceLog, PaginatedResponse } from '@/types'

export function getLevels() {
  return apiClient.get<unknown, LevelConfig[]>('/gamification/levels')
}

export function getMyLevel() {
  return apiClient.get<unknown, UserLevel>('/gamification/me')
}

export interface GetExpLogsParams {
  page?: number
  limit?: number
}

export function getMyExpLogs(params?: GetExpLogsParams) {
  return apiClient.get<unknown, PaginatedResponse<ExperienceLog>>('/gamification/me/logs', { params })
}
