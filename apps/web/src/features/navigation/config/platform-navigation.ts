import { Building2, CreditCard, Megaphone } from 'lucide-react'
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
        end: true,
      },
      {
        id: 'platform-subscriptions',
        label: 'Suscripciones',
        icon: CreditCard,
        path: paths.platformSubscriptions,
        visible: true,
        end: true,
      },
      {
        id: 'platform-announcements',
        label: 'Anuncios SaaS',
        icon: Megaphone,
        path: paths.platformAnnouncements,
        visible: true,
        end: true,
      },
    ],
  },
]
