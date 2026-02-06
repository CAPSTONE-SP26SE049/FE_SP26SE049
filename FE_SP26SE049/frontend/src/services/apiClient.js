import axios from 'axios'

// Toggle dễ dàng giữa Real API và Mock Mode
// Đổi sang true khi backend sẵn sàng
const USE_REAL_API = false

const baseURL =
  import.meta.env.VITE_API_URL ||
  (USE_REAL_API ? 'https://api.speakvn.com' : 'https://mock.api.speakvn.local')

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
})

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = window.sessionStorage.getItem('ACCESS_TOKEN')
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers = config.headers ?? {}
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    // Trả về response.data trực tiếp để code ở component gọn hơn
    return response.data
  },
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient

