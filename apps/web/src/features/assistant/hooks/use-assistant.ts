import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assistantService } from '../services/assistant.service'

export const useAssistant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assistantService.ask,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['assistant', 'conversations'],
      })
    },
  })
}

export const useAssistantConversations = () =>
  useQuery({
    queryKey: ['assistant', 'conversations'],
    queryFn: assistantService.listConversations,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

export const useAssistantConversation = (id: string | null) =>
  useQuery({
    queryKey: ['assistant', 'conversations', id],
    queryFn: () => assistantService.getConversation(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
