import { isAxiosError } from 'axios'
import type { FeedbackKind } from './feedback.types'

export function getFeedbackKindFromError(error: unknown): FeedbackKind {
  if (isAxiosError(error)) {
    if (!error.response) return 'connection'
    if (error.response.status === 401) return 'session-expired'
    if (error.response.status === 403) return 'permission-denied'
    if (error.response.status === 404) return 'not-found'
  }
  return 'unexpected'
}
