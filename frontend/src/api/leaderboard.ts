import apiClient from '@/api'
import type { LeaderboardEntry, PaginatedResponse } from '@/types'

export interface GetLeaderboardParams {
  page?: number
  limit?: number
}

export function getByLevel(params?: GetLeaderboardParams) {
  return apiClient.get<unknown, PaginatedResponse<LeaderboardEntry>>('/leaderboard/level', { params })
}

export function getByPosts(params?: GetLeaderboardParams) {
  return apiClient.get<unknown, PaginatedResponse<LeaderboardEntry>>('/leaderboard/posts', { params })
}

export function getByLikes(params?: GetLeaderboardParams) {
  return apiClient.get<unknown, PaginatedResponse<LeaderboardEntry>>('/leaderboard/likes', { params })
}

export function getByComments(params?: GetLeaderboardParams) {
  return apiClient.get<unknown, PaginatedResponse<LeaderboardEntry>>('/leaderboard/comments', { params })
}
