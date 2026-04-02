import apiClient from '@/api'
import type { Category } from '@/types'

export function getCategories() {
  return apiClient.get<unknown, Category[]>('/categories')
}

export function getCategory(id: string) {
  return apiClient.get<unknown, Category>(`/categories/${id}`)
}
