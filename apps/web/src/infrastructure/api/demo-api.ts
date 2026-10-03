import { modules, type Permission } from '@/lib/permissions'

const timestamp = '2026-10-03T14:30:00.000Z'
const allPermissions: Permission[] = modules.flatMap((module) => [
  `${module}:read` as Permission,
  `${module}:write` as Permission,
])

const demoUser = {
  id: 'demo-user-001',
  name: 'Presentador Torcly',
  email: 'demo@torcly.local',
  username: 'demo',
  permissions: allPermissions,
}

let signedIn = false

const customers = [
  {
    id: 'customer-001',
    type: 'NATURAL',
    documentNumber: '74291638',
    firstName: 'Mariana',
    lastName: 'Salazar Vega',
    legalName: null,
    phone: '987654321',
    email: 'mariana.salazar@example.test',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'customer-002',
    type: 'NATURAL',
    documentNumber: '46813579',
    firstName: 'Diego',
    lastName: 'Ramírez Soto',
    legalName: null,
    phone: '986123456',
    email: 'diego.ramirez@example.test',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'customer-003',
    type: 'LEGAL',
    documentNumber: '20608123456',
    firstName: null,
    lastName: null,
    legalName: 'Transportes Horizonte S.A.C.',
    phone: '014567890',
    email: 'operaciones@horizonte.example.test',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

const vehicles = [
  {
    id: 'vehicle-001',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla Cross',
    year: 2022,
    customerId: 'customer-001',
    owner: customers[0],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'vehicle-002',
    plate: 'B7X908',
    brand: 'Hyundai',
    model: 'Accent',
    year: 2024,
    customerId: 'customer-003',
    owner: customers[2],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'vehicle-003',
    plate: 'KIA456',
    brand: 'Kia',
    model: 'Sportage',
    year: 2021,
    customerId: 'customer-002',
    owner: customers[1],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

const products = [
  {
    id: 'product-filter',
    code: 'MANN-W71283',
    barcode: '4011558730405',
    name: 'Filtro de aceite Mann W 712/83',
    description: 'Filtro de aceite para mantenimiento preventivo.',
    categoryId: 'category-filtration',
    brandId: 'brand-mann',
    unitId: 'unit-piece',
    salePrice: 42.5,
    minimumStock: 4,
    stock: 12,
    lowStock: false,
    active: true,
    category: { id: 'category-filtration', name: 'Filtración' },
    brand: { id: 'brand-mann', name: 'Mann-Filter' },
    unit: { id: 'unit-piece', name: 'Unidad', symbol: 'und' },
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'product-oil',
    code: 'MOTUL-8100-5W30',
    barcode: '3374650246770',
    name: 'Aceite Motul 8100 X-clean 5W-30',
    description: 'Lubricante sintético para motor.',
    categoryId: 'category-lubricants',
    brandId: 'brand-motul',
    unitId: 'unit-liter',
    salePrice: 58,
    minimumStock: 6,
    stock: 20,
    lowStock: false,
    active: true,
    category: { id: 'category-lubricants', name: 'Lubricantes' },
    brand: { id: 'brand-motul', name: 'Motul' },
    unit: { id: 'unit-liter', name: 'Litro', symbol: 'L' },
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

const services = [
  {
    id: 'service-maintenance',
    code: 'MANT-PREVENTIVO',
    name: 'Mantenimiento preventivo',
    description: 'Inspección general y mantenimiento básico.',
    price: 195,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'service-alignment',
    code: 'ALINEAMIENTO',
    name: 'Alineamiento y balanceo',
    description: 'Alineamiento computarizado de dirección.',
    price: 120,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

const order = {
  id: 'work-order-001',
  code: 'OT-000001',
  appointment: { id: 'appointment-001', code: 'CITA-000001' },
  customer: {
    id: 'customer-001',
    documentNumber: '74291638',
    name: 'Mariana Salazar Vega',
  },
  vehicle: {
    id: 'vehicle-001',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla Cross',
    year: 2022,
  },
  status: 'EN_EJECUCION',
  technicianId: 'demo-user-001' as string | null,
  technician: 'Presentador Torcly' as string | null,
  subtotal: 237.5,
  total: 237.5,
  lineCount: 2,
  performedBy: 'Presentador Torcly',
  diagnosisUpdatedBy: 'Presentador Torcly',
  diagnosisUpdatedAt: timestamp,
  budgetSentAt: timestamp,
  approvedBy: 'Mariana Salazar Vega',
  approvedAt: timestamp,
  rejectedBy: null,
  rejectedAt: null,
  decisionNotes: 'Presupuesto aprobado para la demostración.',
  executionStartedBy: 'Presentador Torcly',
  executionStartedAt: timestamp,
  readyForDeliveryAt: null as string | null,
  deliveredBy: null as string | null,
  deliveredAt: null as string | null,
  deliveryNotes: null as string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  diagnosis:
    'Cambio preventivo de aceite y filtro; se verificará el nivel de lubricante.',
  lines: [
    {
      id: 'line-filter',
      type: 'PRODUCT',
      productId: 'product-filter',
      serviceId: null,
      name: 'Filtro de aceite Mann W 712/83',
      code: 'MANN-W71283',
      unitLabel: 'und',
      unitPrice: 42.5,
      quantity: 1,
      subtotal: 42.5,
    },
    {
      id: 'line-maintenance',
      type: 'SERVICE',
      productId: null,
      serviceId: 'service-maintenance',
      name: 'Mantenimiento preventivo',
      code: 'MANT-PREVENTIVO',
      unitLabel: null,
      unitPrice: 195,
      quantity: 1,
      subtotal: 195,
    },
  ],
}

const appointments = [
  {
    id: 'appointment-001',
    code: 'CITA-000001',
    customer: order.customer,
    vehicle: order.vehicle,
    date: '2026-10-03',
    time: '09:00',
    reason: 'Mantenimiento preventivo y cambio de filtro.',
    status: 'ATENDIDA',
    performedBy: 'Presentador Torcly',
    rescheduledBy: null as string | null,
    rescheduledAt: null as string | null,
    cancelledBy: null,
    cancelledAt: null,
    attendedBy: 'Presentador Torcly',
    attendedAt: timestamp,
    workOrder: { id: order.id, code: order.code },
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'appointment-002',
    code: 'CITA-000002',
    customer: {
      id: 'customer-002',
      documentNumber: '46813579',
      name: 'Diego Ramírez Soto',
    },
    vehicle: {
      id: 'vehicle-003',
      plate: 'KIA456',
      brand: 'Kia',
      model: 'Sportage',
      year: 2021,
    },
    date: '2026-10-03',
    time: '11:30',
    reason: 'Revisión de frenos.',
    status: 'PROGRAMADA',
    performedBy: 'Presentador Torcly',
    rescheduledBy: null,
    rescheduledAt: null,
    cancelledBy: null,
    cancelledAt: null,
    attendedBy: null,
    attendedAt: null,
    workOrder: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

const activities: Array<Record<string, unknown>> = [
  {
    id: 'activity-001',
    status: 'COMPLETADA',
    description: 'Inspección visual del motor y verificación de niveles.',
    performedBy: 'Presentador Torcly',
    occurredAt: timestamp,
    completedBy: 'Presentador Torcly',
    completedAt: timestamp,
    createdAt: timestamp,
  },
]

const consumptions: Array<Record<string, unknown>> = []
const movements: Array<Record<string, unknown>> = products.map(
  (product, index) => ({
    id: `movement-initial-${index + 1}`,
    productId: product.id,
    product: {
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
    },
    type: 'INITIAL',
    quantity: product.stock,
    notes: 'Stock inicial de demostración.',
    performedBy: 'Presentador Torcly',
    occurredAt: timestamp,
    referenceType: null,
    referenceId: null,
  }),
)

function page<T>(items: T[], url: URL) {
  const pageNumber = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? 20))
  const start = (pageNumber - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    pagination: {
      page: pageNumber,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  }
}

function toUrl(value: string) {
  return new URL(value, window.location.origin)
}

function setUpdated() {
  order.updatedAt = new Date().toISOString()
}

function execution() {
  const productLine = order.lines[0]
  const consumed = consumptions
    .filter((item) => item.type === 'CONSUMPTION')
    .reduce((sum, item) => sum + Number(item.quantity), 0)
  const returned = consumptions
    .filter((item) => item.type === 'RETURN')
    .reduce((sum, item) => sum + Number(item.quantity), 0)
  const netConsumed = consumed - returned
  return {
    workOrderId: order.id,
    code: order.code,
    status: order.status,
    startedBy: order.executionStartedBy,
    startedAt: order.executionStartedAt,
    readyForDeliveryAt: order.readyForDeliveryAt,
    deliveredBy: order.deliveredBy,
    deliveredAt: order.deliveredAt,
    deliveryNotes: order.deliveryNotes,
    activities,
    productLines: [
      {
        lineId: productLine.id,
        productId: productLine.productId,
        name: productLine.name,
        code: productLine.code,
        unitLabel: productLine.unitLabel,
        budgeted: productLine.quantity,
        consumed,
        returned,
        netConsumed,
        pending: productLine.quantity - netConsumed,
      },
    ],
    consumptions,
  }
}

function workOrderSummary() {
  const summary = { ...order }
  Reflect.deleteProperty(summary, 'diagnosis')
  Reflect.deleteProperty(summary, 'lines')
  return summary
}

function workOrderList(url: URL) {
  const search = (url.searchParams.get('search') ?? '').toLowerCase()
  const status = url.searchParams.get('status') ?? 'all'
  const matchesSearch = [
    order.code,
    order.customer.name,
    order.vehicle.plate,
    order.appointment.code,
  ].some((value) => value.toLowerCase().includes(search))
  const results =
    matchesSearch && (status === 'all' || status === order.status)
      ? [workOrderSummary()]
      : []
  const result = page(results, url)
  return {
    ...result,
    summary: {
      total: results.length,
      recepcionadas: 0,
      enDiagnostico: 0,
      pendientesAprobacion: 0,
      aprobadas: order.status === 'APROBADA' ? 1 : 0,
      rechazadas: 0,
      enEjecucion: order.status === 'EN_EJECUCION' ? 1 : 0,
      listasParaEntrega: order.status === 'LISTA_PARA_ENTREGA' ? 1 : 0,
      entregadas: order.status === 'ENTREGADA' ? 1 : 0,
    },
  }
}

function inventoryMovement(
  productId: string,
  quantity: number,
  type: 'EXIT' | 'ADJUSTMENT_IN',
  notes: string | null,
) {
  const product = products.find((candidate) => candidate.id === productId)
  if (!product) throw new Error('Producto de demostración no encontrado.')
  const movement = {
    id: `movement-${Date.now()}-${movements.length + 1}`,
    productId,
    product: {
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
    },
    type,
    quantity,
    notes,
    performedBy: demoUser.name,
    occurredAt: new Date().toISOString(),
    referenceType: 'WORK_ORDER',
    referenceId: order.code,
  }
  movements.unshift(movement)
  return movement
}

function requireOrder(id: string) {
  if (id !== order.id) throw new Error('Orden de demostración no encontrada.')
  return order
}

function createActivity(input: unknown) {
  const value = input as { description?: string; occurredAt?: string }
  const activity = {
    id: `activity-${Date.now()}`,
    status: 'PENDIENTE',
    description: value.description?.trim() || 'Actividad de demostración',
    performedBy: demoUser.name,
    occurredAt: value.occurredAt
      ? `${value.occurredAt}T12:00:00.000Z`
      : new Date().toISOString(),
    completedBy: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  }
  activities.unshift(activity)
  return activity
}

function listCustomers(url: URL) {
  const query = (url.searchParams.get('search') ?? '').toLowerCase()
  const type = url.searchParams.get('type') ?? 'all'
  return page(
    customers.filter((customer) => {
      const name =
        customer.legalName ?? `${customer.firstName} ${customer.lastName}`
      return (
        (type === 'all' || customer.type === type) &&
        `${name} ${customer.documentNumber}`.toLowerCase().includes(query)
      )
    }),
    url,
  )
}

function listVehicles(url: URL) {
  const query = (url.searchParams.get('search') ?? '').toLowerCase()
  const customerId = url.searchParams.get('customerId')
  return page(
    vehicles.filter(
      (vehicle) =>
        (!customerId || vehicle.customerId === customerId) &&
        `${vehicle.plate} ${vehicle.brand} ${vehicle.model}`
          .toLowerCase()
          .includes(query),
    ),
    url,
  )
}

function listAppointments(url: URL) {
  const search = (url.searchParams.get('search') ?? '').toLowerCase()
  const status = url.searchParams.get('status') ?? 'all'
  const customerId = url.searchParams.get('customerId')
  const date = url.searchParams.get('date')
  const results = appointments.filter(
    (appointment) =>
      (!customerId || appointment.customer?.id === customerId) &&
      (!date || appointment.date === date) &&
      (status === 'all' || appointment.status === status) &&
      `${appointment.code} ${appointment.customer?.name ?? ''} ${appointment.vehicle.plate} ${appointment.reason}`
        .toLowerCase()
        .includes(search),
  )
  return {
    ...page(results, url),
    summary: {
      total: results.length,
      programadas: appointments.filter((item) => item.status === 'PROGRAMADA')
        .length,
      canceladas: appointments.filter((item) => item.status === 'CANCELADA')
        .length,
      hoy: appointments.filter((item) => item.date === '2026-10-03').length,
    },
  }
}

function vehicleHistory(vehicleId: string, url: URL) {
  const entries =
    vehicleId === order.vehicle.id && order.status === 'ENTREGADA'
      ? [
          {
            id: order.id,
            code: order.code,
            diagnosis: order.diagnosis,
            technicianId: order.technicianId,
            technician: order.technician,
            performedBy: order.performedBy,
            deliveredBy: order.deliveredBy,
            deliveredAt: order.deliveredAt,
            subtotal: order.subtotal,
            total: order.total,
            activities: activities.map((activity) => ({
              id: activity.id,
              description: activity.description,
              status: activity.status,
              performedBy: activity.performedBy,
              occurredAt: activity.occurredAt,
            })),
            products: execution()
              .productLines.filter((line) => line.netConsumed > 0)
              .map((line) => ({
                lineId: line.lineId,
                productId: line.productId,
                name: line.name,
                code: line.code,
                unitLabel: line.unitLabel,
                quantity: line.netConsumed,
              })),
          },
        ]
      : []
  return page(entries, url)
}

export const demoApi = {
  get(urlValue: string) {
    const url = toUrl(urlValue)
    const { pathname } = url
    if (pathname === '/auth/me') return signedIn ? demoUser : null
    if (pathname === '/customers') return listCustomers(url)
    if (pathname === '/vehicles') return listVehicles(url)
    if (pathname === '/appointments') return listAppointments(url)
    if (pathname === '/work-orders') return workOrderList(url)
    if (pathname === '/work-orders/catalog') {
      return {
        data: {
          products: products.map((product) => ({
            id: product.id,
            code: product.code,
            name: product.name,
            unit: { name: product.unit.name, symbol: product.unit.symbol },
            salePrice: product.salePrice,
          })),
          services: services.map((service) => ({
            id: service.id,
            code: service.code,
            name: service.name,
            price: service.price,
          })),
        },
      }
    }
    if (pathname === '/work-orders/technicians') {
      return { data: [{ id: demoUser.id, displayName: demoUser.name }] }
    }
    if (
      pathname.startsWith('/work-orders/vehicles/') &&
      pathname.endsWith('/history')
    ) {
      return vehicleHistory(pathname.split('/')[3], url)
    }
    if (pathname === `/work-orders/${order.id}`) return { data: order }
    if (pathname === `/work-orders/${order.id}/execution`)
      return { data: execution() }
    if (pathname === '/inventory/existencia') {
      return page(
        products.map((product) => ({
          productId: product.id,
          code: product.code,
          name: product.name,
          unit: { name: product.unit.name, symbol: product.unit.symbol },
          active: product.active,
          stock: product.stock,
          minimumStock: product.minimumStock,
          lowStock: product.stock <= product.minimumStock,
          lastMovementAt: movements[0]?.occurredAt ?? null,
        })),
        url,
      )
    }
    if (pathname === '/inventory/historial') return page(movements, url)
    if (pathname === '/products/options') {
      return {
        data: {
          categories: products.map((product) => product.category),
          brands: products.flatMap((product) =>
            product.brand ? [product.brand] : [],
          ),
          units: products.map((product) => product.unit),
        },
      }
    }
    if (pathname === '/services/options') {
      return {
        data: services.map(({ id, code, name }) => ({ id, code, name })),
      }
    }
    if (pathname === '/products') return page(products, url)
    if (pathname === '/services') return page(services, url)
    const vehicle = vehicles.find((item) => pathname === `/vehicles/${item.id}`)
    if (vehicle) return { data: vehicle }
    const customer = customers.find(
      (item) => pathname === `/customers/${item.id}`,
    )
    if (customer) return { data: customer }
    const appointment = appointments.find(
      (item) => pathname === `/appointments/${item.id}`,
    )
    if (appointment) return { data: appointment }
    throw new Error(
      `El endpoint local ${pathname} no está disponible en la demo.`,
    )
  },

  post(urlValue: string, body?: unknown) {
    const url = toUrl(urlValue)
    const { pathname } = url
    if (pathname === '/auth/login') {
      const credentials = body as { identifier?: string; password?: string }
      if (
        credentials.identifier !== demoUser.email ||
        credentials.password !== 'DemoTorcly2026!'
      ) {
        throw new Error(
          'Usa las credenciales indicadas en la guía de demostración.',
        )
      }
      signedIn = true
      return demoUser
    }
    if (pathname === '/auth/logout') {
      signedIn = false
      return undefined
    }
    if (pathname === `/work-orders/${order.id}/execution/start`) {
      requireOrder(order.id)
      order.status = 'EN_EJECUCION'
      order.executionStartedBy = demoUser.name
      order.executionStartedAt = new Date().toISOString()
      setUpdated()
      return { data: order }
    }
    if (pathname === `/work-orders/${order.id}/activities`) {
      requireOrder(order.id)
      const activity = createActivity(body)
      setUpdated()
      return { data: activity }
    }
    if (
      pathname.match(
        new RegExp(`^/work-orders/${order.id}/activities/[^/]+/complete$`),
      )
    ) {
      const activityId = pathname.split('/')[4]
      const activity = activities.find((item) => item.id === activityId)
      if (!activity) throw new Error('Actividad de demostración no encontrada.')
      activity.status = 'COMPLETADA'
      activity.completedBy = demoUser.name
      activity.completedAt = new Date().toISOString()
      setUpdated()
      return { data: activity }
    }
    if (pathname === `/work-orders/${order.id}/consumptions`) {
      const input = body as {
        items?: Array<{ lineId: string; quantity: number }>
      }
      const registrations = (input.items ?? []).map((item) => {
        const line = order.lines.find(
          (candidate) => candidate.id === item.lineId,
        )
        const product = products.find(
          (candidate) => candidate.id === line?.productId,
        )
        if (
          !line ||
          !product ||
          item.quantity <= 0 ||
          item.quantity > product.stock
        ) {
          throw new Error(
            'No se puede consumir esa cantidad en la demostración.',
          )
        }
        product.stock -= item.quantity
        inventoryMovement(
          product.id,
          -item.quantity,
          'EXIT',
          'Consumo de orden de taller.',
        )
        const registration = {
          id: `consumption-${Date.now()}-${consumptions.length + 1}`,
          type: 'CONSUMPTION',
          workOrderLineId: line.id,
          productId: product.id,
          quantity: item.quantity,
          notes: null,
          performedBy: demoUser.name,
          occurredAt: new Date().toISOString(),
        }
        consumptions.unshift(registration)
        return registration
      })
      setUpdated()
      return { data: { order, registrations } }
    }
    if (pathname === `/work-orders/${order.id}/returns`) {
      const input = body as {
        items?: Array<{ lineId: string; quantity: number; notes?: string }>
      }
      const registrations = (input.items ?? []).map((item) => {
        const line = order.lines.find(
          (candidate) => candidate.id === item.lineId,
        )
        const product = products.find(
          (candidate) => candidate.id === line?.productId,
        )
        if (!line || !product || item.quantity <= 0) {
          throw new Error(
            'No se puede devolver esa cantidad en la demostración.',
          )
        }
        product.stock += item.quantity
        inventoryMovement(
          product.id,
          item.quantity,
          'ADJUSTMENT_IN',
          item.notes ?? 'Devolución de repuesto.',
        )
        const registration = {
          id: `return-${Date.now()}-${consumptions.length + 1}`,
          type: 'RETURN',
          workOrderLineId: line.id,
          productId: product.id,
          quantity: item.quantity,
          notes: item.notes ?? null,
          performedBy: demoUser.name,
          occurredAt: new Date().toISOString(),
        }
        consumptions.unshift(registration)
        return registration
      })
      setUpdated()
      return { data: { order, registrations } }
    }
    if (pathname === `/work-orders/${order.id}/finalize`) {
      if (activities.some((activity) => activity.status !== 'COMPLETADA')) {
        throw new Error('Completa las actividades antes de finalizar la orden.')
      }
      order.status = 'LISTA_PARA_ENTREGA'
      order.readyForDeliveryAt = new Date().toISOString()
      setUpdated()
      return { data: order }
    }
    if (pathname === `/work-orders/${order.id}/delivery`) {
      const input = body as { notes?: string }
      order.status = 'ENTREGADA'
      order.deliveredBy = demoUser.name
      order.deliveredAt = new Date().toISOString()
      order.deliveryNotes = input.notes?.trim() || null
      setUpdated()
      return { data: order }
    }
    if (pathname === '/appointments') {
      const input = body as {
        customerId: string
        vehicleId: string
        date: string
        time: string
        reason: string
      }
      const customer = customers.find((item) => item.id === input.customerId)
      const vehicle = vehicles.find((item) => item.id === input.vehicleId)
      if (!customer || !vehicle)
        throw new Error('Cliente o vehículo no encontrado en la demo.')
      const appointment = {
        id: `appointment-${Date.now()}`,
        code: `CITA-${String(appointments.length + 1).padStart(6, '0')}`,
        customer: {
          id: customer.id,
          documentNumber: customer.documentNumber,
          name:
            customer.legalName ?? `${customer.firstName} ${customer.lastName}`,
        },
        vehicle: {
          id: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
        },
        date: input.date,
        time: input.time,
        reason: input.reason,
        status: 'PROGRAMADA',
        performedBy: demoUser.name,
        rescheduledBy: null,
        rescheduledAt: null,
        cancelledBy: null,
        cancelledAt: null,
        attendedBy: null,
        attendedAt: null,
        workOrder: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      appointments.unshift(appointment)
      return { data: appointment }
    }
    throw new Error(
      `La acción local ${pathname} no está disponible en la demo.`,
    )
  },

  put(urlValue: string, body?: unknown) {
    const url = toUrl(urlValue)
    const { pathname } = url
    if (pathname === `/work-orders/${order.id}/technician`) {
      const input = body as { technicianId?: string | null }
      order.technicianId = input.technicianId ?? null
      order.technician = input.technicianId ? demoUser.name : null
      setUpdated()
      return { data: order }
    }
    if (pathname === `/work-orders/${order.id}/diagnosis`) {
      const input = body as { diagnosis?: string }
      order.diagnosis = input.diagnosis?.trim() || order.diagnosis
      order.diagnosisUpdatedBy = demoUser.name
      order.diagnosisUpdatedAt = new Date().toISOString()
      setUpdated()
      return { data: order }
    }
    if (pathname === `/appointments/${appointments[1].id}/reschedule`) {
      const input = body as { date?: string; time?: string }
      appointments[1].date = input.date ?? appointments[1].date
      appointments[1].time = input.time ?? appointments[1].time
      appointments[1].rescheduledBy = demoUser.name
      appointments[1].rescheduledAt = new Date().toISOString()
      return { data: appointments[1] }
    }
    throw new Error(
      `La actualización local ${pathname} no está disponible en la demo.`,
    )
  },

  patch(urlValue: string, body?: unknown) {
    void body
    throw new Error(
      `La actualización local ${toUrl(urlValue).pathname} no está disponible en la demo.`,
    )
  },
}
