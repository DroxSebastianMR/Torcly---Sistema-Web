import { toast } from 'sonner'

type ToastId = string | number
type ToastWithProgress = {
  loading?: (message: string) => ToastId
  dismiss?: (id?: ToastId) => void
}

const progressToast = toast as unknown as ToastWithProgress

/**
 * Muestra una única notificación durante una mutación. El componente que
 * inició la acción conserva la responsabilidad del mensaje final de éxito o
 * error, por lo que no se duplican los avisos ni se acoplan los hooks a la UI.
 */
export function startActionToast(message: string) {
  return progressToast.loading?.(message)
}

export function finishActionToast(toastId: string | number | undefined) {
  if (toastId !== undefined) progressToast.dismiss?.(toastId)
}
