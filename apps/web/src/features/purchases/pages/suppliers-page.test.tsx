// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SuppliersPage from './suppliers-page'
import * as authContextModule from '@/features/auth/hooks/auth-context'
import * as usePurchasesModule from '../hooks/use-purchases'
import type { SupplierSummary } from '../types/purchases.types'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

describe('SuppliersPage', () => {
  const mockSuppliers: SupplierSummary[] = [
    {
      id: 'supp-1',
      legalName: 'Distribuidora Automotriz San Martín SAC',
      documentNumber: '20601234567',
      contactName: 'Carlos Mendoza',
      phone: '+51 987654321',
      email: 'ventas@sanmartin.pe',
      active: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'supp-2',
      legalName: 'Torno y Rectificaciones Pérez',
      documentNumber: '10456789012',
      contactName: 'Juan Pérez',
      phone: '+51 912345678',
      email: 'juan.perez@gmail.com',
      active: false,
      createdAt: '2026-11-02T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
    },
  ]

  const toggleSupplierStatusMock = vi.fn().mockResolvedValue({})
  const createSupplierMock = vi.fn().mockResolvedValue({})
  const updateSupplierMock = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Admin Taller',
        permissions: ['purchases:read', 'purchases:write'],
      },
    } as any)

    vi.spyOn(usePurchasesModule, 'useSuppliers').mockReturnValue({
      data: {
        data: mockSuppliers,
        pagination: { page: 1, pageSize: 15, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    vi.spyOn(usePurchasesModule, 'usePurchaseMutations').mockReturnValue({
      toggleSupplierStatus: {
        mutateAsync: toggleSupplierStatusMock,
        isPending: false,
      },
      createSupplier: {
        mutateAsync: createSupplierMock,
        isPending: false,
      },
      updateSupplier: {
        mutateAsync: updateSupplierMock,
        isPending: false,
      },
    } as any)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renderiza el título, las métricas y la tabla de proveedores', () => {
    render(<SuppliersPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Proveedores' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Distribuidora Automotriz San Martín SAC'),
    ).toBeTruthy()
    expect(screen.getByText('20601234567')).toBeTruthy()
    expect(screen.getByText('Carlos Mendoza')).toBeTruthy()
    expect(screen.getByText('Torno y Rectificaciones Pérez')).toBeTruthy()
    expect(screen.getByText('10456789012')).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()
    expect(screen.getByText('Inactivo')).toBeTruthy()

    // Botón de nuevo proveedor
    expect(
      screen.getByRole('button', { name: /nuevo proveedor/i }),
    ).toBeTruthy()
  })

  it('abre el modal de creación al hacer clic en Nuevo proveedor', async () => {
    render(<SuppliersPage />)

    const newBtn = screen.getByRole('button', { name: /nuevo proveedor/i })
    await userEvent.click(newBtn)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: /nuevo proveedor/i }),
    ).toBeTruthy()
    expect(screen.getByLabelText(/Razón Social \/ Nombre/i)).toBeTruthy()
  })

  it('abre el diálogo de confirmación para desactivar un proveedor activo', async () => {
    render(<SuppliersPage />)

    const deactivateBtn = screen.getByTitle('Desactivar proveedor')
    await userEvent.click(deactivateBtn)

    expect(screen.getByText('¿Desactivar proveedor?')).toBeTruthy()
    expect(
      screen.getByText(
        /El proveedor "Distribuidora Automotriz San Martín SAC" quedará inactivo/i,
      ),
    ).toBeTruthy()

    const confirmBtn = screen.getByRole('button', { name: /sí, desactivar/i })
    await userEvent.click(confirmBtn)

    expect(toggleSupplierStatusMock).toHaveBeenCalledWith({
      id: 'supp-1',
      active: false,
    })
  })
})
