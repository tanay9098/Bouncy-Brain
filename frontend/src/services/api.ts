import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        localStorage.setItem('accessToken', data.accessToken)
        err.config.headers.Authorization = `Bearer ${data.accessToken}`
        return api.request(err.config)
      } catch {
        localStorage.removeItem('accessToken')
        window.location.href = '/auth'
      }
    }
    return Promise.reject(err)
  }
)

export default api
