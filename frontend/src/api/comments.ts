import apiClient from '@/api'
import type { Comment, PaginatedResponse } from '@/types'

export interface GetCommentsParams {
  page?: number
  limit?: number
}

export function getComments(postId: string, params?: GetCommentsParams) {
  return apiClient.get<unknown, PaginatedResponse<Comment>>(`/posts/${postId}/comments`, {
    params,
  })
}

export interface CreateCommentData {
  content: string
  parentId?: string
}

export function createComment(postId: string, data: CreateCommentData) {
  return apiClient.post<unknown, Comment>(`/posts/${postId}/comments`, data)
}

export interface UpdateCommentData {
  content: string
}

export function updateComment(id: string, data: UpdateCommentData) {
  return apiClient.patch<unknown, Comment>(`/comments/${id}`, data)
}

export function deleteComment(id: string) {
  return apiClient.delete<unknown, void>(`/comments/${id}`)
}
