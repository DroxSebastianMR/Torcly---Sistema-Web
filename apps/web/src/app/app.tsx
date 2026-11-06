import { Toaster } from 'sonner'
import {
  ToastProvider,
  Toaster as NavigationToaster,
} from '@/components/ui/toast'
import { QueryProvider } from './providers/query-provider'
import { AuthProvider } from './providers/auth-provider'
import { AppRouter } from './router/app-router'
import { ThemeProvider } from '@/features/theme/context/theme-provider'
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryProvider>
          <AuthProvider>
            <AppRouter />
            <NavigationToaster />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
