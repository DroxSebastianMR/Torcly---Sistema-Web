import type { RequestHandler } from 'express'
import {
  assistantChatSchema,
  assistantConversationParamsSchema,
} from './assistant.schemas.js'
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

export const listAssistantConversations: RequestHandler = async (
  request,
  response,
) => {
  response.json(await assistantService.listConversations(request.auth!.id))
}

export const getAssistantConversation: RequestHandler = async (
  request,
  response,
) => {
  const { id } = assistantConversationParamsSchema.parse(request.params)
  response.json(await assistantService.getConversation(request.auth!.id, id))
}
