import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { resetSchema } from '../forms/auth.schema'
import { authService } from '../services/auth.service'
import { paths } from '@/app/router/constants/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
  })
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Nueva contraseña</h1>
      {!token ? (
        <p role="alert">
          El enlace no contiene un token válido. Solicita una nueva
          recuperación.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async ({ password }) => {
            try {
              await authService.resetPassword(password, token)
              toast.success('Contraseña actualizada')
              navigate(paths.login, { replace: true })
            } catch {
              toast.error(
                'No se pudo cambiar la contraseña. El enlace puede haber expirado.',
              )
            }
          })}
        >
          <label htmlFor="password" className="block text-sm">
            Nueva contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <p role="alert">{errors.password.message}</p>}
          <label htmlFor="confirmPassword" className="block text-sm">
            Confirmar contraseña
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p role="alert">{errors.confirmPassword.message}</p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            Guardar contraseña
          </Button>
        </form>
      )}
      <Link className="mt-6 block text-sm text-primary" to={paths.login}>
        Volver al inicio de sesión
      </Link>
    </>
  )
}
