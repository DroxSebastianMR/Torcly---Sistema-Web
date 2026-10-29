import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { appointmentsService } from '../services/appointments.service'
import type {
  AppointmentFilters,
  AppointmentInput,
  AppointmentRescheduleInput,
} from '../types/appointments.types'

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
}

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: ({ signal }) => appointmentsService.list(filters, signal),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: ({ signal }) => appointmentsService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient()
  const refreshAppointments = () =>
    queryClient.invalidateQueries({ queryKey: appointmentKeys.all })

  return {
    create: useMutation({
      mutationFn: (input: AppointmentInput) =>
        appointmentsService.create(input),
      onMutate: () => ({ toastId: startActionToast('Agendando cita…') }),
      onSuccess: refreshAppointments,
      onSettled: (_data, _error, _input, context) =>
        finishActionToast(context?.toastId),
    }),
    reschedule: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: AppointmentRescheduleInput
      }) => appointmentsService.reschedule(id, input),
      onMutate: () => ({ toastId: startActionToast('Reprogramando cita…') }),
      onSuccess: refreshAppointments,
      onSettled: (_data, _error, _input, context) =>
        finishActionToast(context?.toastId),
    }),
    cancel: useMutation({
      mutationFn: (id: string) => appointmentsService.cancel(id),
      onMutate: () => ({ toastId: startActionToast('Cancelando cita…') }),
      onSuccess: refreshAppointments,
      onSettled: (_data, _error, _input, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
