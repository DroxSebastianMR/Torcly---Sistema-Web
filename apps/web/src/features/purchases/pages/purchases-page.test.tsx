// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PurchasesPage from './purchases-page'
import * as authContextModule from '@/features/auth/hooks/auth-context'
import * as usePurchasesModule from '../hooks/use-purchases'
import * as useProductsModule from '@/features/products/hooks/use-products'
import type { PurchaseSummary, SupplierRef } from '../types/purchases.types'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('PurchasesPage', () => {
  const mockPurchases: PurchaseSummary[] = [
    {
      id: 'purch-1',
      code: 'COM-0001',
      supplier: {
        id: 'supp-1',
        legalName: 'Distribuidora Automotriz San Martín SAC',
        documentNumber: '20601234567',
      },
      purchaseDate: '2026-11-01',
      total: 1450.5,
      lineCount: 3,
      status: 'DRAFT',
      externalRef: 'F001-000432',
      performedBy: 'Admin Taller',
      receivedBy: null,
      receivedAt: null,
      cancelledBy: null,
      cancelledAt: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'purch-2',
      code: 'COM-0002',
      supplier: {
        id: 'supp-2',
        legalName: 'Lubricantes y Filtros del Norte EIRL',
        documentNumber: '20456789012',
      },
      purchaseDate: '2026-11-02',
      total: 3200,
      lineCount: 10,
      status: 'RECEIVED',
      externalRef: 'B002-009811',
      performedBy: 'Admin Taller',
      receivedBy: 'Admin Taller',
      receivedAt: '2026-11-02T12:00:00.000Z',
      cancelledBy: null,
      cancelledAt: null,
      createdAt: '2026-11-02T12:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z',
    },
  ]

  const mockSuppliers: SupplierRef[] = [
    {
      id: 'supp-1',
      legalName: 'Distribuidora Automotriz San Martín SAC',
      documentNumber: '20601234567',
    },
  ]

  beforeEach(() => {
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'usr-admin',
        email: 'admin@taller.pe',
        fullName: 'Admin Taller',
        role: 'workshop_owner',
        organizationId: 'org-1',
        permissions: ['purchases:read', 'purchases:write'],
        requiresPasswordChange: false,
      },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      switchOrganization: vi.fn(),
      updateProfile: vi.fn(),
    } as unknown as ReturnType<typeof authContextModule.useAuth>)

    vi.spyOn(usePurchasesModule, 'usePurchases').mockReturnValue({
      data: {
        data: mockPurchases,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchasesModule.usePurchases>)

    vi.spyOn(usePurchasesModule, 'useActiveSuppliers').mockReturnValue({
      data: mockSuppliers,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchasesModule.useActiveSuppliers>)

    vi.spyOn(usePurchasesModule, 'useSuppliers').mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchasesModule.useSuppliers>)

    vi.spyOn(useProductsModule, 'useProducts').mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 100, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProductsModule.useProducts>)

    vi.spyOn(usePurchasesModule, 'usePurchase').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePurchasesModule.usePurchase>)

    vi.spyOn(usePurchasesModule, 'usePurchaseMutations').mockReturnValue({
      createPurchase: { mutateAsync: vi.fn(), isPending: false },
      updatePurchase: { mutateAsync: vi.fn(), isPending: false },
      receivePurchase: { mutateAsync: vi.fn(), isPending: false },
      cancelPurchase: { mutateAsync: vi.fn(), isPending: false },
      createSupplier: { mutateAsync: vi.fn(), isPending: false },
      updateSupplier: { mutateAsync: vi.fn(), isPending: false },
      toggleSupplierStatus: { mutateAsync: vi.fn(), isPending: false },
    } as unknown as ReturnType<typeof usePurchasesModule.usePurchaseMutations>)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renderiza el título, las métricas y la tabla de compras', () => {
    renderWithClient(<PurchasesPage />)

    expect(screen.getByRole('heading', { name: /^compras$/i })).toBeTruthy()
    expect(screen.getByText('Compras registradas')).toBeTruthy()
    expect(screen.getByText('Borradores')).toBeTruthy()
    expect(screen.getAllByText('Recibidas').length).toBeGreaterThan(0)

    // Elementos de la tabla (desktop y mobile cards)
    expect(screen.getAllByText('COM-0001').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Distribuidora Automotriz San Martín SAC').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('COM-0002').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Lubricantes y Filtros del Norte EIRL').length,
    ).toBeGreaterThan(0)
  })

  it('abre el modal de nueva compra al hacer clic en el botón correspondiente', async () => {
    renderWithClient(<PurchasesPage />)

    const newBtn = screen.getByRole('button', { name: /nueva compra/i })
    await userEvent.click(newBtn)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /nueva compra/i })).toBeTruthy()
  })
})
