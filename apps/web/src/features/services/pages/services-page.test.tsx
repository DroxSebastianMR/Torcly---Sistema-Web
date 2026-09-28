// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ServicesResponse } from '../types/services.types'
import Page from './services-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const services = vi.hoisted(() => ({
  useServices: vi.fn(),
  useService: vi.fn(),
  useServiceOptions: vi.fn(),
  useServiceMutations: vi.fn(),
}))
vi.mock('../hooks/use-services', () => ({
  serviceKeys: { all: ['services'] },
  useServices: services.useServices,
  useService: services.useService,
  useServiceOptions: services.useServiceOptions,
  useServiceMutations: services.useServiceMutations,
}))

vi.mock('../components/service-form-modal', () => ({
  ServiceFormModal: () => null,
}))

const serviceMock = {
  id: 'sv1',
  code: 'CAMBIO-BOMBA',
  name: 'Cambio de bomba de agua',
  description: null,
  price: 250.5,
  active: true,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function response(overrides: Partial<ServicesResponse> = {}): ServicesResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function renderPage() {
  return render(<Page />)
}

describe('Página de servicios', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita el registro según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['services:read'] } })
    services.useServices.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Servicios' })).toBeTruthy()
    expect(screen.getByText('No se encontraron servicios')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Registrar servicio' }),
    ).toBeNull()
  })

  it('muestra el registro con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['services:read', 'services:write'] },
    })
    services.useServices.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Registrar servicio' }),
    ).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['services:read'] } })
    services.useServices.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByLabelText('Cargando servicios')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['services:read'] } })
    services.useServices.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByText('No se pudo cargar el catálogo de servicios'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista servicios con su estado y acciones según permiso', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['services:read', 'services:write'] },
    })
    services.useServices.mockReturnValue({
      data: response({
        data: [serviceMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getAllByText('Cambio de bomba de agua').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('CAMBIO-BOMBA').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', {
        name: 'Editar Cambio de bomba de agua',
      }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', {
        name: 'Desactivar Cambio de bomba de agua',
      }).length,
    ).toBeGreaterThan(0)
  })

  it('omite las acciones de la tabla sin permiso de escritura', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['services:read'] } })
    services.useServices.mockReturnValue({
      data: response({
        data: [serviceMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.queryByRole('button', { name: 'Editar Cambio de bomba de agua' }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', {
        name: 'Desactivar Cambio de bomba de agua',
      }),
    ).toBeNull()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['services:read'] } })
    services.useServices.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar servicios' }),
    )
    await userEvent.type(
      await screen.findByPlaceholderText('Escribe un código o nombre…'),
      'bomba',
    )

    await waitFor(() =>
      expect(services.useServices).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'bomba' }),
      ),
    )
  })

  it('confirma el cambio de estado con el diálogo de confirmación', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['services:read', 'services:write'] },
    })
    services.useServices.mockReturnValue({
      data: response({
        data: [serviceMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    services.useServiceMutations.mockReturnValue({
      status: { mutateAsync: vi.fn().mockResolvedValue({}) },
    })

    renderPage()

    const toggleButtons = screen.getAllByRole('button', {
      name: 'Desactivar Cambio de bomba de agua',
    })
    await userEvent.click(toggleButtons[0])
    expect(
      await screen.findByRole('heading', { name: '¿Desactivar servicio?' }),
    ).toBeTruthy()
  })
})
