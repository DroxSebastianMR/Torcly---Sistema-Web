import { useMutation } from '@tanstack/react-query'
import { assistantService } from '../services/assistant.service'

export const useAssistant = () =>
  useMutation({ mutationFn: assistantService.ask })
