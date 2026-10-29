import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { paymentKeys } from '@/features/cash/hooks/use-payments'
import { saleKeys } from '@/features/sales/hooks/use-sales'
import { workOrdersService } from '../services/work-orders.service'
import type {
  WorkOrderActivityInput,
  WorkOrderBudgetInput,
  WorkOrderConsumptionInput,
  WorkOrderDecisionInput,
  WorkOrderDeliveryInput,
  WorkOrderFinalizeInput,
  WorkOrderFilters,
  WorkOrderReturnInput,
} from '../types/work-orders.types'

const baseKey = ['work-orders'] as const

export const workOrderKeys = {
  all: baseKey,
  list: (filters: WorkOrderFilters) => [...baseKey, 'list', filters] as const,
  detail: (id: string) => [...baseKey, 'detail', id] as const,
  catalog: [...baseKey, 'catalog'] as const,
  execution: (id: string) => [...baseKey, 'execution', id] as const,
}

export function useWorkOrders(filters: WorkOrderFilters) {
  return useQuery({
    queryKey: workOrderKeys.list(filters),
    queryFn: ({ signal }) => workOrdersService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: ({ signal }) => workOrdersService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useWorkOrderCatalog(enabled = true) {
  return useQuery({
    queryKey: workOrderKeys.catalog,
    queryFn: ({ signal }) => workOrdersService.catalog(signal),
    select: (response) => response.data,
    enabled,
  })
}

export function useWorkOrderExecution(
  id: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: workOrderKeys.execution(id),
    queryFn: ({ signal }) => workOrdersService.execution(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id) && options.enabled !== false,
  })
}

export function useWorkOrdersMutations() {
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: workOrderKeys.all })

  return {
    createFromAppointment: useMutation({
      mutationFn: (appointmentId: string) =>
        workOrdersService.createFromAppointment(appointmentId),
      onMutate: () => ({
        toastId: startActionToast('Creando orden de taller…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateDiagnosis: useMutation({
      mutationFn: ({ id, diagnosis }: { id: string; diagnosis: string }) =>
        workOrdersService.updateDiagnosis(id, diagnosis),
      onMutate: () => ({
        toastId: startActionToast('Registrando diagnóstico…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    saveBudget: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderBudgetInput
      }) => workOrdersService.saveBudget(id, input),
      onMutate: () => ({ toastId: startActionToast('Guardando presupuesto…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    sendBudget: useMutation({
      mutationFn: (id: string) => workOrdersService.sendBudget(id),
      onMutate: () => ({ toastId: startActionToast('Enviando presupuesto…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    decide: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderDecisionInput
      }) => workOrdersService.decide(id, input),
      onMutate: () => ({ toastId: startActionToast('Registrando decisión…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    assignTechnician: useMutation({
      mutationFn: ({
        id,
        technicianId,
      }: {
        id: string
        technicianId: string | null
      }) => workOrdersService.assignTechnician(id, technicianId),
      onMutate: () => ({ toastId: startActionToast('Asignando técnico…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    startExecution: useMutation({
      mutationFn: (id: string) => workOrdersService.startExecution(id),
      onMutate: () => ({ toastId: startActionToast('Iniciando ejecución…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    createActivity: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderActivityInput
      }) => workOrdersService.createActivity(id, input),
      onMutate: () => ({ toastId: startActionToast('Registrando actividad…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    completeActivity: useMutation({
      mutationFn: ({ id, activityId }: { id: string; activityId: string }) =>
        workOrdersService.completeActivity(id, activityId),
      onMutate: () => ({ toastId: startActionToast('Completando actividad…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    consume: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderConsumptionInput
      }) => workOrdersService.consume(id, input),
      onMutate: () => ({ toastId: startActionToast('Registrando consumo…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    returnProducts: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderReturnInput
      }) => workOrdersService.returnProducts(id, input),
      onMutate: () => ({
        toastId: startActionToast('Registrando devolución…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    finalize: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderFinalizeInput
      }) => workOrdersService.finalize(id, input),
      onMutate: () => ({ toastId: startActionToast('Finalizando orden…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    deliver: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderDeliveryInput
      }) => workOrdersService.deliver(id, input),
      onMutate: () => ({ toastId: startActionToast('Registrando entrega…') }),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
          queryClient.invalidateQueries({ queryKey: saleKeys.all }),
          queryClient.invalidateQueries({ queryKey: paymentKeys.all }),
        ])
      },
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
