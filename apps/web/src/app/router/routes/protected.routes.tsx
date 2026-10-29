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
            element: <PermissionRoute permission="assistant:read" />,
            children: [
              {
                path: paths.assistantHistory,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/assistant/pages/assistant-history-page'
                    )
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
            element: <PermissionRoute permission="services:read" />,
            children: [
              {
                path: paths.services,
                lazy: async () => ({
                  Component: (
                    await import('@/features/services/pages/services-page')
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
            element: <PermissionRoute permission="appointments:read" />,
            children: [
              {
                path: paths.appointments,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/appointments/pages/appointments-page'
                    )
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="workshop:read" />,
            children: [
              {
                path: paths.workOrders,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/work-orders/pages/work-orders-page'
                    )
                  ).default,
                }),
              },
              {
                path: paths.technicians,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/technicians/pages/technicians-page'
                    )
                  ).default,
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
          {
            element: <PermissionRoute permission="maintenance:read" />,
            children: [
              {
                path: paths.maintenance,
                lazy: async () => ({
                  Component: (
                    await import(
                      '@/features/maintenance/pages/maintenance-page'
                    )
                  ).default,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute permission="audit:read" />,
            children: [
              {
                path: paths.audit,
                lazy: async () => ({
                  Component: (await import('@/features/audit/pages/audit-page'))
                    .default,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
]
