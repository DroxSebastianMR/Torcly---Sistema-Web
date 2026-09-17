import { Outlet } from 'react-router-dom'
import { TorclyLogo } from '@/components/brand/torcly-logo'
import { AuthBrandPanel } from './components/auth-brand-panel'

export function AuthLayout() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-6 2xl:py-12">
        <div className="w-full min-w-0 max-w-sm lg:max-w-[350px] 2xl:max-w-sm">
          <div className="mb-8 lg:hidden">
            <TorclyLogo />
          </div>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
