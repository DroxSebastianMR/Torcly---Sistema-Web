import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { paths } from '@/app/router/constants/paths'
import { loginSchema } from '@/features/auth/forms/auth.schema'
import { useAuth } from '@/features/auth/hooks/auth-context'
import type { LoginInput } from '@/features/auth/types/auth.types'

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const togglePassword = () => setShowPassword((visible) => !visible)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const submitCredentials = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch {
      toast.error(
        'No se pudo iniciar sesión. Revisa tus credenciales y la conexión.',
      )
      return
    }

    const from: unknown = location.state?.from
    const destination =
      typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
        ? from
        : paths.dashboard

    await navigate(destination, { replace: true })
  })

  return {
    register,
    onSubmit: submitCredentials,
    errors,
    isSubmitting,
    showPassword,
    togglePassword,
  }
}
