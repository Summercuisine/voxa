import apiClient from '@/api'
import type { LikeStatus, PaginatedResponse } from '@/types'

export function togglePostLike(postId: string) {
  return apiClient.post<unknown, void>(`/posts/${postId}/like`)
}

export function toggleCommentLike(commentId: string) {
  return apiClient.post<unknown, void>(`/comments/${commentId}/like`)
}

export function toggleBookmark(postId: string) {
  return apiClient.post<unknown, void>(`/posts/${postId}/bookmark`)
}

export function getPostLikes(postId: string) {
  return apiClient.get<unknown, PaginatedResponse<unknown>>(`/posts/${postId}/likes`)
}

export function getMyBookmarks(params?: { page?: number; limit?: number }) {
  return apiClient.get<unknown, PaginatedResponse<unknown>>('/users/me/bookmarks', { params })
}

export function getLikeStatus(postId: string) {
  return apiClient.get<unknown, LikeStatus>(`/posts/${postId}/like-status`)
}
