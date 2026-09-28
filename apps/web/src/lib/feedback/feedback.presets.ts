import { CircleAlert, LogIn, SearchX, ShieldX, WifiOff } from 'lucide-react'
import type { FeedbackKind, FeedbackPreset } from './feedback.types'

export const feedbackPresets: Record<FeedbackKind, FeedbackPreset> = {
  connection: {
    title: 'Sin conexión con Torcly',
    description:
      'No pudimos conectar con el servidor. Revisa tu conexión a internet y vuelve a intentarlo.',
    icon: WifiOff,
  },
  'session-expired': {
    title: 'Tu sesión venció',
    description:
      'Tus credenciales ya no son válidas. Inicia sesión nuevamente para continuar.',
    icon: LogIn,
  },
  'permission-denied': {
    title: 'Acceso restringido',
    description:
      'Tu usuario no tiene permiso para ver esta sección. Solicita acceso a un administrador si crees que es un error.',
    icon: ShieldX,
  },
  'not-found': {
    title: 'Página no encontrada',
    description:
      'La dirección que buscas no existe o cambió. Vuelve al inicio para continuar con tus tareas.',
    icon: SearchX,
  },
  unexpected: {
    title: 'Algo salió mal',
    description:
      'Ocurrió un error inesperado. Vuelve a intentarlo y, si persiste, recarga la página.',
    icon: CircleAlert,
  },
}

export function getFeedbackPreset(kind: FeedbackKind): FeedbackPreset {
  return feedbackPresets[kind]
}
