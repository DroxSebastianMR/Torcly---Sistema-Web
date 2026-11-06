import { Outlet } from 'react-router-dom'
import { TorclyLogo } from '@/components/brand/torcly-logo'
import { AuthBrandPanel } from './components/auth-brand-panel'
import { ThemeToggle } from '@/features/theme/components/theme-toggle'

export function AuthLayout() {
  return (
    <main className="grid min-h-svh bg-background text-foreground transition-colors duration-200 lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="relative flex items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-10 2xl:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-56 size-[580px] rounded-full bg-[radial-gradient(circle_at_center,rgb(196_244_229_/_62%),transparent_68%)] dark:bg-[radial-gradient(circle_at_center,rgb(25_163_104_/_14%),transparent_68%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 -left-44 size-[510px] rounded-full bg-[radial-gradient(circle_at_center,rgb(174_239_219_/_48%),transparent_68%)] dark:bg-[radial-gradient(circle_at_center,rgb(25_163_104_/_10%),transparent_68%)]"
        />
        <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
          <ThemeToggle />
        </div>
        <div className="relative z-10 w-full min-w-0 max-w-[460px] rounded-[28px] border border-border bg-card/95 p-6 shadow-[0_28px_70px_rgb(15_67_55_/_13%)] backdrop-blur dark:shadow-[0_28px_70px_rgb(0_0_0_/_24%)] sm:p-9 lg:p-10">
          <div className="mb-8 lg:hidden">
            <TorclyLogo />
          </div>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
