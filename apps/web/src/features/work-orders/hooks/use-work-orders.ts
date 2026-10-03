import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workOrdersService } from '../services/work-orders.service'
import type {
  WorkOrderActivityInput,
  WorkOrderBudgetInput,
  WorkOrderConsumptionInput,
  WorkOrderDecisionInput,
  WorkOrderDeliveryInput,
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

export function useWorkOrderCatalog() {
  return useQuery({
    queryKey: workOrderKeys.catalog,
    queryFn: ({ signal }) => workOrdersService.catalog(signal),
    select: (response) => response.data,
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
      onSuccess: refresh,
    }),
    updateDiagnosis: useMutation({
      mutationFn: ({ id, diagnosis }: { id: string; diagnosis: string }) =>
        workOrdersService.updateDiagnosis(id, diagnosis),
      onSuccess: refresh,
    }),
    saveBudget: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderBudgetInput
      }) => workOrdersService.saveBudget(id, input),
      onSuccess: refresh,
    }),
    sendBudget: useMutation({
      mutationFn: (id: string) => workOrdersService.sendBudget(id),
      onSuccess: refresh,
    }),
    decide: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderDecisionInput
      }) => workOrdersService.decide(id, input),
      onSuccess: refresh,
    }),
    assignTechnician: useMutation({
      mutationFn: ({
        id,
        technicianId,
      }: {
        id: string
        technicianId: string | null
      }) => workOrdersService.assignTechnician(id, technicianId),
      onSuccess: refresh,
    }),
    startExecution: useMutation({
      mutationFn: (id: string) => workOrdersService.startExecution(id),
      onSuccess: refresh,
    }),
    createActivity: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderActivityInput
      }) => workOrdersService.createActivity(id, input),
      onSuccess: refresh,
    }),
    completeActivity: useMutation({
      mutationFn: ({ id, activityId }: { id: string; activityId: string }) =>
        workOrdersService.completeActivity(id, activityId),
      onSuccess: refresh,
    }),
    consume: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderConsumptionInput
      }) => workOrdersService.consume(id, input),
      onSuccess: refresh,
    }),
    returnProducts: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderReturnInput
      }) => workOrdersService.returnProducts(id, input),
      onSuccess: refresh,
    }),
    finalize: useMutation({
      mutationFn: (id: string) => workOrdersService.finalize(id),
      onSuccess: refresh,
    }),
    deliver: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: WorkOrderDeliveryInput
      }) => workOrdersService.deliver(id, input),
      onSuccess: refresh,
    }),
  }
}
