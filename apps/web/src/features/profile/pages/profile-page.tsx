import { useState } from 'react'
import { Bell, KeyRound, UserRound } from 'lucide-react'
import { ErrorState } from '@/components/ui/error-state'
import { useProfile } from '../hooks/use-profile'
import { ProfileInfoForm } from '../components/profile-info-form'
import { NotificationPreferencesForm } from '../components/notification-preferences-form'
import { ChangePasswordForm } from '../components/change-password-form'

type ProfileTab = 'info' | 'notifications' | 'security'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info')
  const { data: profile, isLoading, isError, refetch } = useProfile()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <ErrorState
        title="No se pudo cargar la información de perfil"
        description="Ocurrió un inconveniente al consultar tus datos de usuario."
        action={{
          label: 'Reintentar',
          onClick: () => refetch(),
        }}
      />
    )
  }

  const tabs: Array<{
    id: ProfileTab
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }> = [
    { id: 'info', label: 'Datos personales', icon: UserRound },
    { id: 'notifications', label: 'Preferencias de avisos', icon: Bell },
    { id: 'security', label: 'Seguridad y contraseña', icon: KeyRound },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mi perfil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tu información de cuenta, preferencias de avisos y
          credenciales de acceso seguro.
        </p>
      </div>

      {/* Tabs navigation */}
      <div
        className="flex border-b border-border gap-2"
        role="tablist"
        aria-label="Secciones del perfil"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'info' && <ProfileInfoForm profile={profile} />}
        {activeTab === 'notifications' && (
          <NotificationPreferencesForm profile={profile} />
        )}
        {activeTab === 'security' && <ChangePasswordForm />}
      </div>
    </div>
  )
}
