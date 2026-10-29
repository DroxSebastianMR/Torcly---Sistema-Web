import { Toast } from '@base-ui/react/toast'
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Info,
  LoaderCircle,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { toast } from './toast-manager'

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading'

const iconByType: Record<ToastType, ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  info: Info,
  warning: CircleAlert,
  error: CircleX,
  loading: LoaderCircle,
}

const styleByType: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  loading: 'border-primary/25 bg-card text-foreground',
}

function isToastType(value: string | undefined): value is ToastType {
  return Boolean(value && value in iconByType)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toast} limit={3}>
      {children}
    </Toast.Provider>
  )
}

export function Toaster() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label="Notificaciones"
        className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 outline-none"
      >
        {toasts.map((item) => {
          const type = isToastType(item.type) ? item.type : 'info'
          const Icon = iconByType[type]
          return (
            <Toast.Root
              key={item.id}
              toast={item}
              swipeDirection="right"
              className={`rounded-xl border p-4 shadow-lg transition data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0 ${styleByType[type]}`}
            >
              <Toast.Content className="flex items-start gap-3">
                <Icon
                  aria-hidden
                  className={`mt-0.5 size-5 shrink-0 ${type === 'loading' ? 'animate-spin text-primary' : ''}`}
                />
                <div className="min-w-0 flex-1">
                  <Toast.Title className="text-sm font-semibold" />
                  <Toast.Description className="mt-0.5 text-sm text-muted-foreground" />
                </div>
                <Toast.Close
                  aria-label="Cerrar notificación"
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X aria-hidden className="size-4" />
                </Toast.Close>
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
