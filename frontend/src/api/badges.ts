import apiClient from '@/api'
import type { Badge } from '@/types'

export function getAllBadges() {
  return apiClient.get<unknown, Badge[]>('/badges')
}

export function getMyBadges() {
  return apiClient.get<unknown, Badge[]>('/badges/me')
}
