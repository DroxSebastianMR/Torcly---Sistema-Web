import axios, { isAxiosError } from 'axios'
import { env } from '@/app/config/env'
import { endpoints } from './endpoints'
import { notifySessionExpired } from './session-events'

export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  // Un Web Service de Render puede necesitar varios segundos para reactivarse.
  // El límite anterior cortaba la comprobación de sesión antes de que la API
  // terminara de iniciar y mostraba un falso error de conexión.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

const sessionProbePaths = [
  endpoints.auth.me,
  endpoints.auth.login,
  endpoints.auth.logout,
] as const

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isSessionProbe = sessionProbePaths.some((path) =>
        url.startsWith(path),
      )
      if (!isSessionProbe) notifySessionExpired()
    }
    return Promise.reject(error)
  },
)
