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
      const token = window.sessionStorage.getItem('ACCESS_TOKEN') || window.localStorage.getItem('ACCESS_TOKEN')
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


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  })

  failedQueue = [];
}

// ... inside the file ...
// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error?.config;

    if (error?.response) {
      const { status, data } = error.response

      if (status === 401 && !originalRequest._retry) {
        console.warn("Caught 401 Unauthorized for request:", originalRequest.url);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          if (isRefreshing) {
            console.log("Already refreshing, queuing request:", originalRequest.url);
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject })
            }).then(token => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return apiClient(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            })
          }

          console.log("Starting token refresh process...");
          originalRequest._retry = true;
          isRefreshing = true;

          const raw = window.sessionStorage.getItem('speakvn_session') || window.localStorage.getItem('speakvn_session')
          const refreshToken = raw ? JSON.parse(raw).refreshToken : window.localStorage.getItem('REFRESH_TOKEN');

          if (!refreshToken) {
            console.error("No refresh token available, forcing logout.");
            // No refresh token available, force logout
            window.sessionStorage.clear()
            window.localStorage.removeItem('ACCESS_TOKEN')
            window.localStorage.removeItem('REFRESH_TOKEN')
            window.localStorage.removeItem('USER_INFO')
            window.localStorage.removeItem('speakvn_session')
            alert("No refresh token available, check console. Usually redirecting to /login here.");
            // window.location.href = '/login'
            return Promise.reject(error);
          }

          try {
            // Can't use authService directly if it imports apiClient (circular dependency)
            // Use axios directly to call the refresh endpoint
            // We include Authorization header just in case backend requires the expired token
            const expiredToken = window.sessionStorage.getItem('ACCESS_TOKEN') || window.localStorage.getItem('ACCESS_TOKEN');
            console.log("Attempting to refresh token with:", refreshToken);

            const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, {
              headers: { Authorization: `Bearer ${expiredToken}` }
            });
            console.log("Refresh response:", res.data);
            const newToken = res.data.data?.accessToken || res.data?.accessToken; // Handle different potential backend structures

            if (newToken) {
              console.log("Refresh successful, getting new token.");
              const isLocal = window.localStorage.getItem('speakvn_session') !== null;
              const storage = isLocal ? window.localStorage : window.sessionStorage;

              if (raw) {
                const sessionData = JSON.parse(raw);
                sessionData.accessToken = newToken;

                const newRefreshToken = res.data.data?.refreshToken || res.data?.refreshToken;
                if (newRefreshToken) {
                  sessionData.refreshToken = newRefreshToken;
                  storage.setItem('REFRESH_TOKEN', newRefreshToken);
                }

                storage.setItem('speakvn_session', JSON.stringify(sessionData));
                storage.setItem('ACCESS_TOKEN', newToken);
              }

              processQueue(null, newToken);
              originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
              return apiClient(originalRequest);
            } else {
              console.error("Refresh successful but no newToken found in response:", res.data);
            }
          } catch (refreshError) {
            console.error("Refresh token failed:", refreshError);
            const status = refreshError.response?.status;
            const data = refreshError.response?.data;
            console.error("Refresh token response status:", status, "data:", data);

            processQueue(refreshError, null);
            window.sessionStorage.clear()
            window.localStorage.removeItem('ACCESS_TOKEN')
            window.localStorage.removeItem('REFRESH_TOKEN')
            window.localStorage.removeItem('USER_INFO')
            window.localStorage.removeItem('speakvn_session')

            // Wait a moment so user can read the console before redirecting
            alert("Refresh token failed, check console. Usually redirecting to /login here.");
            // setTimeout(() => {
            //     window.location.href = '/login'
            // }, 1000);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }

      // Handle the specific validation error format from backend
      if (status === 400 && data?.status === 'error' && data?.errors) {
        console.error("400 Bad Request:", data.errors);
        // Reject with the specific data structure so we can map it in UI
        return Promise.reject({
          message: data.message,
          errorFields: data.errors, // Map { field: message }
        })
      }

      console.error("API Error unhandled by interceptor special cases:", status, data);
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
