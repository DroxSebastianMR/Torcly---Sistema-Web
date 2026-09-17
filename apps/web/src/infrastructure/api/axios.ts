import axios from 'axios'
import { env } from '@/app/config/env'
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
