import { env } from '@/app/config/env'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/auth-context'

export function DemoAccess() {
  const { enterDemo } = useAuth()

  if (!env.demo) return null

  return (
    <div className="mt-6 border-t pt-5">
      <Button
        type="button"
        className="w-full"
        variant="outline"
        onClick={enterDemo}
      >
        Explorar demostración
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Solo desarrollo. Sin datos ni autenticación real.
      </p>
    </div>
  )
}
