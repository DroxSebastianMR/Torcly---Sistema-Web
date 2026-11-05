import { Building2 } from 'lucide-react'
import { paths } from '@/app/router/constants/paths'
import type { NavigationGroup } from '../types/navigation.types'

/** Navegación aislada para el equipo interno de Torcly. */
export const platformNavigation: readonly NavigationGroup[] = [
  {
    id: 'platform',
    label: 'Plataforma Torcly',
    items: [
      {
        id: 'platform-home',
        label: 'Organizaciones',
        icon: Building2,
        path: paths.platform,
        visible: true,
      },
    ],
  },
]
