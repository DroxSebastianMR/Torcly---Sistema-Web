import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/toast-manager'
import { paths } from '@/app/router/constants/paths'
import { loginSchema } from '@/features/auth/forms/auth.schema'
import { useAuth } from '@/features/auth/hooks/auth-context'
import type { LoginInput } from '@/features/auth/types/auth.types'
import { getLoginFeedback } from '../utils/login-feedback'

const rememberedIdentifierKey = 'torcly.remembered-identifier'

function getRememberedIdentifier() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(rememberedIdentifierKey) ?? ''
}

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberIdentifier, setRememberIdentifier] = useState(true)
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
    defaultValues: { identifier: getRememberedIdentifier(), password: '' },
  })

  const submitCredentials = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      const feedback = getLoginFeedback(error)
      toast.add({
        type: 'error',
        ...feedback,
      })
      return
    }

    if (rememberIdentifier) {
      window.localStorage.setItem(
        rememberedIdentifierKey,
        values.identifier.trim(),
      )
    } else {
      window.localStorage.removeItem(rememberedIdentifierKey)
    }

    toast.add({
      type: 'success',
      title: 'Sesión iniciada correctamente',
      description: 'Bienvenido a tu espacio de trabajo.',
      timeout: 4_000,
    })

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
    rememberIdentifier,
    setRememberIdentifier,
  }
}
