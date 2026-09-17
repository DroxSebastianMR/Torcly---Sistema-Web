import { Toaster } from 'sonner'
import { QueryProvider } from './providers/query-provider'
import { AuthProvider } from './providers/auth-provider'
import { AppRouter } from './router/app-router'
export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryProvider>
  )
}
