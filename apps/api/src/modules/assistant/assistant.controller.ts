import type { RequestHandler } from 'express'
import { assistantChatSchema } from './assistant.schemas.js'
import { assistantService } from './assistant.service.js'

export const askAssistant: RequestHandler = async (request, response) => {
  const input = assistantChatSchema.parse(request.body)
  response.json(
    await assistantService.ask(
      { ...input, from: input.from ?? null, to: input.to ?? null },
      {
        id: request.auth!.id,
        permissions: request.auth!.permissions,
      },
    ),
  )
}
