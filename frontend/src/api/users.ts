import apiClient from '@/api'
import type { User, PostListItem, PaginatedResponse } from '@/types'

export function getUser(id: string) {
  return apiClient.get<unknown, User>(`/users/${id}`)
}

export interface UpdateUserData {
  username?: string
  bio?: string
  avatar?: string
}

export function updateUser(id: string, data: UpdateUserData) {
  return apiClient.patch<unknown, User>(`/users/${id}`, data)
}

export interface GetUserPostsParams {
  page?: number
  limit?: number
}

export function getUserPosts(id: string, params?: GetUserPostsParams) {
  return apiClient.get<unknown, PaginatedResponse<PostListItem>>(`/users/${id}/posts`, {
    params,
  })
}
