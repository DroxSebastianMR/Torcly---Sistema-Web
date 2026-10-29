import { z } from 'zod'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD.')
  .nullable()
  .optional()

export const assistantChatSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(3, 'Escribe una consulta de al menos 3 caracteres.')
      .max(800, 'La consulta no puede superar 800 caracteres.'),
    from: date,
    to: date,
    conversationId: z.string().uuid().optional(),
  })
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'La fecha final no puede ser anterior a la inicial.',
      })
    }
  })

export const assistantConversationParamsSchema = z.object({
  id: z.string().uuid(),
})

export type AssistantChatDto = z.infer<typeof assistantChatSchema>
