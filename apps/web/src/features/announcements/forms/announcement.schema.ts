import { z } from 'zod'
import type {
  AnnouncementItem,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcements.types'

export const announcementFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(200, 'El título no puede superar los 200 caracteres.'),
    summary: z
      .string()
      .trim()
      .min(5, 'El resumen debe tener al menos 5 caracteres.')
      .max(500, 'El resumen no puede superar los 500 caracteres.'),
    content: z
      .string()
      .trim()
      .min(10, 'El contenido debe tener al menos 10 caracteres.'),
    type: z.enum(['UPDATE', 'MAINTENANCE', 'COMMUNICATION'], {
      error: 'Selecciona un tipo de anuncio válido.',
    }),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED'], {
      error: 'Selecciona un estado válido.',
    }),
    versionTag: z
      .string()
      .trim()
      .max(50, 'La versión no puede superar los 50 caracteres.')
      .optional()
      .or(z.literal('')),
    videoUrl: z
      .string()
      .trim()
      .url('Ingresa una URL válida de video (ej. YouTube o Loom).')
      .optional()
      .or(z.literal('')),
    startsAt: z.string().optional().or(z.literal('')),
    endsAt: z.string().optional().or(z.literal('')),
    notifyUsers: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.type === 'MAINTENANCE' && data.startsAt && data.endsAt) {
        return (
          new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime()
        )
      }
      return true
    },
    {
      message: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endsAt'],
    },
  )

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

export const emptyAnnouncement: AnnouncementFormValues = {
  title: '',
  summary: '',
  content: '',
  type: 'UPDATE',
  status: 'PUBLISHED',
  versionTag: '',
  videoUrl: '',
  startsAt: '',
  endsAt: '',
  notifyUsers: true,
}

export function mapAnnouncementToFormValues(
  item: AnnouncementItem,
): AnnouncementFormValues {
  return {
    title: item.title,
    summary: item.summary,
    content: item.content,
    type: item.type,
    status: item.status,
    versionTag: item.versionTag ?? '',
    videoUrl: item.videoUrl ?? '',
    startsAt: item.startsAt ? item.startsAt.slice(0, 16) : '',
    endsAt: item.endsAt ? item.endsAt.slice(0, 16) : '',
    notifyUsers: false,
  }
}

export function mapFormValuesToCreatePayload(
  values: AnnouncementFormValues,
): CreateAnnouncementPayload {
  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    content: values.content.trim(),
    type: values.type,
    status: values.status,
    versionTag:
      values.type === 'UPDATE' && values.versionTag?.trim()
        ? values.versionTag.trim()
        : null,
    videoUrl: values.videoUrl?.trim() || null,
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    notifyUsers: values.notifyUsers,
  }
}

export function mapFormValuesToUpdatePayload(
  values: AnnouncementFormValues,
): UpdateAnnouncementPayload {
  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    content: values.content.trim(),
    type: values.type,
    status: values.status,
    versionTag:
      values.type === 'UPDATE' && values.versionTag?.trim()
        ? values.versionTag.trim()
        : null,
    videoUrl: values.videoUrl?.trim() || null,
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    notifyUsers: values.notifyUsers,
  }
}
