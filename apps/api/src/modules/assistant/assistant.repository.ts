import { databaseService } from '../../infrastructure/database/prisma.service.js'

function titleFrom(message: string) {
  return message.trim().replace(/\s+/g, ' ').slice(0, 120)
}

export const assistantRepository = {
  async saveExchange(input: {
    organizationId: string
    userId: string
    conversationId?: string
    question: string
    answer: string
  }) {
    return databaseService.transaction(async (transaction) => {
      const conversation = input.conversationId
        ? await transaction.assistantConversation.findFirst({
            where: {
              id: input.conversationId,
              userId: input.userId,
              organizationId: input.organizationId,
            },
            select: { id: true },
          })
        : await transaction.assistantConversation.create({
            data: {
              organizationId: input.organizationId,
              userId: input.userId,
              title: titleFrom(input.question),
            },
            select: { id: true },
          })

      if (!conversation) return null
      await transaction.assistantMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: 'USER',
            content: input.question,
          },
          {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: input.answer,
          },
        ],
      })
      await transaction.assistantConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      })
      return conversation.id
    })
  },

  listConversations(userId: string, organizationId: string) {
    return databaseService.measure('assistant.conversations.list', () =>
      databaseService.client.assistantConversation.findMany({
        where: { userId, organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true },
          },
        },
      }),
    )
  },

  getConversation(userId: string, organizationId: string, id: string) {
    return databaseService.measure('assistant.conversation.detail', () =>
      databaseService.client.assistantConversation.findFirst({
        where: { id, userId, organizationId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, role: true, content: true, createdAt: true },
          },
        },
      }),
    )
  },

  async getRecentMessages(
    userId: string,
    organizationId: string,
    conversationId: string,
  ) {
    const conversation =
      await databaseService.client.assistantConversation.findFirst({
        where: { id: conversationId, userId, organizationId },
        select: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { role: true, content: true },
          },
        },
      })
    return conversation ? [...conversation.messages].reverse() : null
  },
}
