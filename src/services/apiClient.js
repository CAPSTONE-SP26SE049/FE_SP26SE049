import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8082/api/v1'

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
    if (error?.response) {
      const { status, data } = error.response

      if (status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.sessionStorage.clear()
          window.location.href = '/login'
        }
      }

      // Handle the specific validation error format from backend
      if (status === 400 && data?.status === 'error' && data?.errors) {
        // Reject with the specific data structure so we can map it in UI
        return Promise.reject({
          message: data.message,
          errorFields: data.errors, // Map { field: message }
        })
      }

      // Return unified error structured response
      return Promise.reject({
        message: data?.message || 'Something went wrong',
        status: status,
      })
    }

    return Promise.reject(error)
  },
)

export default apiClient
