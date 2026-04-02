import apiClient from '@/api'
import type { Bot } from '@/types'

export function getBots() {
  return apiClient.get<unknown, Bot[]>('/bots')
}

export function getBot(id: string) {
  return apiClient.get<unknown, Bot>(`/bots/${id}`)
}
