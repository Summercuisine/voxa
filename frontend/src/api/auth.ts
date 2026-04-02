import apiClient from '@/api'
import type { AuthResponse, User } from '@/types'

export function login(email: string, password: string) {
  return apiClient.post<unknown, AuthResponse>('/auth/login', { email, password })
}

export function register(username: string, email: string, password: string) {
  return apiClient.post<unknown, AuthResponse>('/auth/register', {
    username,
    email,
    password,
  })
}

export function getProfile() {
  return apiClient.get<unknown, User>('/auth/profile')
}
