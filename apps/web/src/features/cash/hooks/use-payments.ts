import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { paymentsService } from '../services/payments.service'
import type {
  PaymentCompensateInput,
  PaymentFilters,
  PaymentRegisterInput,
} from '../types/payment.types'

export const paymentKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentFilters) =>
    [...paymentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
}

export function usePayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: ({ signal }) => paymentsService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: ({ signal }) => paymentsService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function usePaymentMutations() {
  const queryClient = useQueryClient()
  const refreshPayments = async () => {
    await queryClient.invalidateQueries({ queryKey: paymentKeys.all })
  }

  return {
    pay: useMutation({
      mutationFn: ({
        saleId,
        input,
      }: {
        saleId: string
        input: PaymentRegisterInput
      }) => paymentsService.pay(saleId, input),
      onMutate: () => ({ toastId: startActionToast('Registrando pago…') }),
      onSuccess: refreshPayments,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    compensate: useMutation({
      mutationFn: ({
        paymentId,
        input,
      }: {
        paymentId: string
        input: PaymentCompensateInput
      }) => paymentsService.compensate(paymentId, input),
      onMutate: () => ({
        toastId: startActionToast('Registrando compensación…'),
      }),
      onSuccess: refreshPayments,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
