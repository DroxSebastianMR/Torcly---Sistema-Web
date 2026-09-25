import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/app/app-layout'
import { ProtectedRoute } from '../guards/protected-route'
import { PermissionRoute } from '../guards/permission-route'
import { paths } from '../constants/paths'
export const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <PermissionRoute permission="dashboard:read" />,
            children: [
              {
                path: paths.dashboard,
                lazy: async () => ({
                  Component: (
                    await import('@/features/dashboard/pages/dashboard-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="products:read" />,
            children: [
              {
                path: paths.products,
                lazy: async () => ({
                  Component: (
                    await import('@/features/products/pages/products-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="barcodes:read" />,
            children: [
              {
                path: paths.barcodes,
                lazy: async () => ({
                  Component: (
                    await import('@/features/barcodes/pages/barcodes-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="inventory:read" />,
            children: [
              {
                path: paths.inventory,
                lazy: async () => ({
                  Component: (
                    await import('@/features/inventory/pages/inventory-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="purchases:read" />,
            children: [
              {
                path: paths.purchases,
                lazy: async () => ({
                  Component: (
                    await import('@/features/purchases/pages/purchases-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="sales:read" />,
            children: [
              {
                path: paths.sales,
                lazy: async () => ({
                  Component: (await import('@/features/sales/pages/sales-page'))
                    .default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="customers:read" />,
            children: [
              {
                path: paths.customers,
                lazy: async () => ({
                  Component: (
                    await import('@/features/customers/pages/customers-page')
                  ).default,
                }),
              },
              {
                path: paths.customerDetail,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/customers/pages/customer-detail-page'
                    )
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="vehicles:read" />,
            children: [
              {
                path: paths.vehicles,
                lazy: async () => ({
                  Component: (
                    await import('@/features/vehicles/pages/vehicles-page')
                  ).default,
                }),
              },
              {
                path: paths.vehicleDetail,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/vehicles/pages/vehicle-detail-page'
                    )
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="cash:read" />,
            children: [
              {
                path: paths.cash,
                lazy: async () => ({
                  Component: (await import('@/features/cash/pages/cash-page'))
                    .default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="users:read" />,
            children: [
              {
                path: paths.users,
                lazy: async () => ({
                  Component: (await import('@/features/users/pages/users-page'))
                    .default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="notifications:read" />,
            children: [
              {
                path: paths.notifications,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/notifications/pages/notifications-page'
                    )
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="profile:read" />,
            children: [
              {
                path: paths.profile,
                lazy: async () => ({
                  Component: (
                    await import('@/features/profile/pages/profile-page')
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="reports:read" />,
            children: [
              {
                path: paths.reports,
                lazy: async () => ({
                  Component: (
                    await import('@/features/reports/pages/reports-page')
                  ).default,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
]
