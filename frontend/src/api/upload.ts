import axios from 'axios'

const uploadClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
})

uploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

uploadClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export interface UploadImageResponse {
  url: string
}

export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadClient.post<unknown, UploadImageResponse>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
