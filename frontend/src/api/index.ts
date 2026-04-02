import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 秒超时，应对 Render 冷启动
  headers: {
    'Content-Type': 'application/json',
  },
})

// 最大重试次数
const MAX_RETRIES = 2
// 需要重试的状态码
const RETRY_STATUS_CODES = [502, 503]

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器（含自动重试逻辑）
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number
    }

    // 初始化重试计数
    if (config._retryCount === undefined) {
      config._retryCount = 0
    }

    const shouldRetry =
      (config._retryCount < MAX_RETRIES) &&
      // 超时重试
      (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) ||
      // 502/503 重试
      (error.response && RETRY_STATUS_CODES.includes(error.response.status))

    if (shouldRetry) {
      config._retryCount++
      console.warn(
        `[API] 请求重试 (${config._retryCount}/${MAX_RETRIES}):`,
        config.url,
      )
      return apiClient(config)
    }

    // 统一错误处理
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
