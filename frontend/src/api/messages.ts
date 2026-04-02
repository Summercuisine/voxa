import apiClient from '@/api'
import type { Conversation, Message, PaginatedResponse } from '@/types'

export interface GetConversationsParams {
  page?: number
  limit?: number
  search?: string
}

export function getConversations(params?: GetConversationsParams) {
  return apiClient.get<unknown, PaginatedResponse<Conversation>>('/messages/conversations', { params })
}

export function createConversation(recipientId: string) {
  return apiClient.post<unknown, Conversation>('/messages/conversations', { recipientId })
}

export interface GetMessagesParams {
  page?: number
  limit?: number
}

export function getMessages(conversationId: string, params?: GetMessagesParams) {
  return apiClient.get<unknown, PaginatedResponse<Message>>(`/messages/conversations/${conversationId}/messages`, { params })
}

export function sendMessage(conversationId: string, content: string) {
  return apiClient.post<unknown, Message>(`/messages/conversations/${conversationId}/messages`, { content })
}

export function markAsRead(conversationId: string) {
  return apiClient.patch<unknown, void>(`/messages/conversations/${conversationId}/read`)
}

export function getUnreadCount() {
  return apiClient.get<unknown, { count: number }>('/messages/unread-count')
}

export function deleteConversation(conversationId: string) {
  return apiClient.delete<unknown, void>(`/messages/conversations/${conversationId}`)
}
