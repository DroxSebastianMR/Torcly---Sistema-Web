import { http } from './axios'
import { demoApi } from './demo-api'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const api = {
  async get<T>(url: string, signal?: AbortSignal) {
    if (isDemoMode) return demoApi.get(url) as T
    return (await http.get<T>(url, { signal })).data
  },
  async post<T>(url: string, body?: unknown) {
    if (isDemoMode) return demoApi.post(url, body) as T
    return (await http.post<T>(url, body)).data
  },
  async put<T>(url: string, body?: unknown) {
    if (isDemoMode) return demoApi.put(url, body) as T
    return (await http.put<T>(url, body)).data
  },
  async patch<T>(url: string, body?: unknown) {
    if (isDemoMode) return demoApi.patch(url, body) as T
    return (await http.patch<T>(url, body)).data
  },
}
