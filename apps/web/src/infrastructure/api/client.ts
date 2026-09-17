import { http } from './axios'
export const api = {
  async get<T>(url: string, signal?: AbortSignal) {
    return (await http.get<T>(url, { signal })).data
  },
  async post<T>(url: string, body?: unknown) {
    return (await http.post<T>(url, body)).data
  },
}
