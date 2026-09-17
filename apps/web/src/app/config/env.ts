import { z } from 'zod'
const schema = z.object({
  apiUrl: z.union([z.url(), z.literal('/api/v1')]),
  demo: z.boolean(),
})
export const env = schema.parse({
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  demo: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO === 'true',
})
