import { z } from 'zod'

export const announcementIdSchema = z.object({
  id: z.string().uuid('Identificador de anuncio inválido.'),
})

export const announcementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['UPDATE', 'MAINTENANCE', 'COMMUNICATION']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  unreadOnly: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
  search: z.string().trim().max(100).optional(),
})

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres.')
    .max(200, 'El título no puede superar 200 caracteres.'),
  summary: z
    .string()
    .trim()
    .min(5, 'El resumen debe tener al menos 5 caracteres.')
    .max(500, 'El resumen no puede superar 500 caracteres.'),
  content: z
    .string()
    .trim()
    .min(10, 'El contenido debe tener al menos 10 caracteres.'),
  type: z.enum(['UPDATE', 'MAINTENANCE', 'COMMUNICATION'], {
    error: 'Tipo de anuncio inválido.',
  }),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  versionTag: z.string().trim().max(50).nullable().optional(),
  videoUrl: z
    .string()
    .trim()
    .url('Ingresa una URL válida de video.')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  notifyUsers: z.boolean().default(false),
})

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  summary: z.string().trim().min(5).max(500).optional(),
  content: z.string().trim().min(10).optional(),
  type: z.enum(['UPDATE', 'MAINTENANCE', 'COMMUNICATION']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  versionTag: z.string().trim().max(50).nullable().optional(),
  videoUrl: z
    .string()
    .trim()
    .url('Ingresa una URL válida de video.')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  notifyUsers: z.boolean().optional(),
})

export type AnnouncementIdDto = z.infer<typeof announcementIdSchema>
export type AnnouncementQueryDto = z.infer<typeof announcementQuerySchema>
export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementDto = z.infer<typeof updateAnnouncementSchema>
