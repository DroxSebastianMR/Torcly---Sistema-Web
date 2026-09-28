import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
      onSuccess: refreshAppointments,
    }),
    reschedule: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: AppointmentRescheduleInput
      }) => appointmentsService.reschedule(id, input),
      onSuccess: refreshAppointments,
    }),
    cancel: useMutation({
      mutationFn: (id: string) => appointmentsService.cancel(id),
      onSuccess: refreshAppointments,
    }),
  }
}
