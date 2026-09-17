import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/layouts/auth/auth-layout'
import { PublicRoute } from '../guards/public-route'
import { paths } from '../constants/paths'
export const publicRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: paths.login,
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/login-page'))
                .LoginPage,
            }),
          },
          {
            path: paths.forgotPassword,
            lazy: async () => ({
              Component: (
                await import('@/features/auth/pages/forgot-password-page')
              ).ForgotPasswordPage,
            }),
          },
          {
            path: paths.resetPassword,
            lazy: async () => ({
              Component: (
                await import('@/features/auth/pages/reset-password-page')
              ).ResetPasswordPage,
            }),
          },
        ],
      },
    ],
  },
]
