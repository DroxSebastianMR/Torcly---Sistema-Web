import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  recoverySchema,
  type RecoveryFormValues,
} from '@/features/auth/forms/auth.schema'
import { authService } from '@/features/auth/services/auth.service'

export function useRecoveryForm() {
  const [isSent, setIsSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { identifier: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root')
    try {
      await authService.forgotPassword(values)
      setIsSent(true)
    } catch {
      setError('root.server', {
        message:
          'No se pudo procesar la solicitud. Revisa tu conexión e inténtalo nuevamente.',
      })
    }
  })

  return { register, onSubmit, errors, isSubmitting, isSent }
}
