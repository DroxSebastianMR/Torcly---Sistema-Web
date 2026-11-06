import { Megaphone, Sparkles, Wrench, type LucideIcon } from 'lucide-react'
import type { AnnouncementType } from '../types/announcements.types'

export const announcementDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatAnnouncementDate(dateStr: string): string {
  try {
    return announcementDateFormatter.format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function formatRelativeAnnouncementDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `Ayer, ${timeStr}`
    }
    if (diffDays < 7) return `Hace ${diffDays} días`
    return announcementDateFormatter.format(date)
  } catch {
    return dateStr
  }
}

export interface AnnouncementCategoryConfig {
  key: AnnouncementType
  label: string
  icon: LucideIcon
  bg: string
  accent: string
  description: string
}

export function getAnnouncementAppearance(
  type: AnnouncementType,
): AnnouncementCategoryConfig {
  switch (type) {
    case 'UPDATE':
      return {
        key: 'UPDATE',
        label: 'Actualización',
        icon: Sparkles,
        bg: '#E7F6EF', // Verde menta
        accent: '#329B78',
        description: 'Nueva versión o características del SaaS',
      }
    case 'MAINTENANCE':
      return {
        key: 'MAINTENANCE',
        label: 'Mantenimiento',
        icon: Wrench,
        bg: '#FFF0F4', // Rosa suave
        accent: '#CE4779',
        description: 'Ventana de mantenimiento preventivo',
      }
    case 'COMMUNICATION':
    default:
      return {
        key: 'COMMUNICATION',
        label: 'Comunicado',
        icon: Megaphone,
        bg: '#EAF4FD', // Azul cielo
        accent: '#4385C7',
        description: 'Noticia, anuncio o comunicado oficial',
      }
  }
}

export function getEmbeddableVideoUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl) return null
  try {
    const parsed = new URL(rawUrl)
    // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`
      }
    }
    // YouTube short URL: https://youtu.be/VIDEO_ID
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace(/^\//, '')
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`
      }
    }
    // Vimeo: https://vimeo.com/VIDEO_ID
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.replace(/^\//, '')
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`
      }
    }
    // Loom: https://www.loom.com/share/VIDEO_ID
    if (
      parsed.hostname.includes('loom.com') &&
      parsed.pathname.includes('/share/')
    ) {
      return rawUrl.replace('/share/', '/embed/')
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}
