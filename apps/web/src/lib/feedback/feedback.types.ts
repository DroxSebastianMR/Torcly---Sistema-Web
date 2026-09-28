import type { LucideIcon } from 'lucide-react'

export type FeedbackKind =
  | 'connection'
  | 'session-expired'
  | 'permission-denied'
  | 'not-found'
  | 'unexpected'

export interface FeedbackPreset {
  title: string
  description: string
  icon: LucideIcon
}

export interface FeedbackAction {
  label: string
  onClick: () => void
}
