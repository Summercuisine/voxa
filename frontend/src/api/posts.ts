import apiClient from '@/api'
import type { Post, PostListItem, PaginatedResponse } from '@/types'

export interface GetPostsParams {
  page?: number
  limit?: number
  categoryId?: string
  tag?: string
  search?: string
  sort?: 'latest' | 'popular' | 'commented'
}

export function getPosts(params?: GetPostsParams) {
  return apiClient.get<unknown, PaginatedResponse<PostListItem>>('/posts', { params })
}

export function getPost(id: string) {
  return apiClient.get<unknown, Post>(`/posts/${id}`)
}

export interface CreatePostData {
  title: string
  content: string
  categoryId?: string
  tags?: string[]
}

export function createPost(data: CreatePostData) {
  return apiClient.post<unknown, Post>('/posts', data)
}

export interface UpdatePostData {
  title?: string
  content?: string
  categoryId?: string
  tags?: string[]
}

export function updatePost(id: string, data: UpdatePostData) {
  return apiClient.patch<unknown, Post>(`/posts/${id}`, data)
}

export function deletePost(id: string) {
  return apiClient.delete<unknown, void>(`/posts/${id}`)
}

export function likePost(id: string) {
  return apiClient.post<unknown, void>(`/posts/${id}/likes`)
}

export function unlikePost(id: string) {
  return apiClient.delete<unknown, void>(`/posts/${id}/likes`)
}

export function favoritePost(id: string) {
  return apiClient.post<unknown, void>(`/posts/${id}/favorites`)
}

export function unfavoritePost(id: string) {
  return apiClient.delete<unknown, void>(`/posts/${id}/favorites`)
}
