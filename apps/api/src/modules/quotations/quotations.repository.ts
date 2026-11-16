import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import type {
  QuotationCreateInput,
  QuotationConversionInput,
  QuotationFilters,
  QuotationUpdateInput,
} from './quotations.types.js'
import { computeQuotationTotals } from './quotations.rules.js'

type Actor = { id: string; name: string }

const quotationSummarySelect = {
  id: true,
  code: true,
  status: true,
  subtotal: true,
  total: true,
  validUntil: true,
  notes: true,
  workOrderId: true,
  vehiclePlate: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
      phone: true,
      email: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
    },
  },
  items: {
    select: {
      id: true,
      type: true,
      productId: true,
      serviceId: true,
      name: true,
      code: true,
      unitLabel: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
    },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { items: true } },
} satisfies Prisma.QuotationSelect

const quotationDetailInclude = {
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
      phone: true,
      email: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
    },
  },
  items: {
    select: {
      id: true,
      type: true,
      productId: true,
      serviceId: true,
      name: true,
      code: true,
      unitLabel: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.QuotationInclude

export type QuotationSummaryRecord = Prisma.QuotationGetPayload<{
  select: typeof quotationSummarySelect
}>

export type QuotationDetailRecord = Prisma.QuotationGetPayload<{
  include: typeof quotationDetailInclude
}>

export type QuotationItemRecord = QuotationDetailRecord['items'][number]

function auditData(
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    organizationId: context.organizationId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

async function nextQuotationCode(
  transaction: Prisma.TransactionClient,
  organizationId: string,
): Promise<string> {
  const count = await transaction.quotation.count({
    where: { organizationId },
  })
  return `COT-${String(count + 1).padStart(6, '0')}`
}

export const quotationsRepository = {
  async list(filters: QuotationFilters, organizationId: string) {
    const search = filters.search?.trim()
    const where: Prisma.QuotationWhereInput = {
      organizationId,
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { vehiclePlate: { contains: search, mode: 'insensitive' } },
              {
                customer: {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { legalName: { contains: search, mode: 'insensitive' } },
                    {
                      documentNumber: { contains: search, mode: 'insensitive' },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    }

    const [total, items] = await Promise.all([
      databaseService.client.quotation.count({ where }),
      databaseService.client.quotation.findMany({
        where,
        select: quotationSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ])

    return { total, items }
  },

  async findById(id: string, organizationId: string) {
    return databaseService.client.quotation.findFirst({
      where: { id, organizationId },
      include: quotationDetailInclude,
    })
  },

  async create(
    input: QuotationCreateInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const code = await nextQuotationCode(transaction, organizationId)
      const { subtotal, total } = computeQuotationTotals(
        input.items.map((i) => ({
          unitPrice: Number(i.unitPrice ?? 0),
          quantity: Number(i.quantity ?? 1),
        })),
      )

      const quotation = await transaction.quotation.create({
        data: {
          organizationId,
          code,
          customerId: input.customerId ?? null,
          vehicleId: input.vehicleId ?? null,
          vehiclePlate: input.vehiclePlate?.trim() || null,
          status: 'DRAFT',
          subtotal,
          total,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          notes: input.notes?.trim() || null,
          createdBy: actor.name,
          items: {
            create: input.items.map((item) => ({
              type: item.type,
              productId: item.productId ?? null,
              serviceId: item.serviceId ?? null,
              name: item.name || 'Ítem',
              code: item.code || 'ITEM',
              unitLabel: item.unitLabel ?? null,
              unitPrice: Number(item.unitPrice ?? 0),
              quantity: Number(item.quantity ?? 1),
              subtotal:
                Math.round(
                  (Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) +
                    Number.EPSILON) *
                    100,
                ) / 100,
            })),
          },
        },
        include: quotationDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData(
          'QUOTATION_CREATED',
          actor.id,
          quotation.code,
          context,
          {
            quotationId: quotation.id,
            code: quotation.code,
            subtotal,
            total,
            itemCount: quotation.items.length,
          },
        ),
      })

      return quotation
    })
  },

  async update(
    id: string,
    input: QuotationUpdateInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const existing = await transaction.quotation.findFirst({
        where: { id, organizationId },
      })
      if (!existing)
        throw new AppError(
          404,
          'QUOTATION_NOT_FOUND',
          'Cotización no encontrada.',
        )
      if (existing.status === 'APPROVED') {
        throw new AppError(
          409,
          'QUOTATION_ALREADY_APPROVED',
          'No se puede editar una cotización aprobada o convertida a orden.',
        )
      }

      const { subtotal, total } = computeQuotationTotals(
        input.items.map((i) => ({
          unitPrice: Number(i.unitPrice ?? 0),
          quantity: Number(i.quantity ?? 1),
        })),
      )

      await transaction.quotationItem.deleteMany({
        where: { quotationId: id },
      })

      const updated = await transaction.quotation.update({
        where: { id },
        data: {
          customerId: input.customerId ?? null,
          vehicleId: input.vehicleId ?? null,
          vehiclePlate: input.vehiclePlate?.trim() || null,
          status: input.status ?? existing.status,
          subtotal,
          total,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          notes: input.notes?.trim() || null,
          items: {
            create: input.items.map((item) => ({
              type: item.type,
              productId: item.productId ?? null,
              serviceId: item.serviceId ?? null,
              name: item.name || 'Ítem',
              code: item.code || 'ITEM',
              unitLabel: item.unitLabel ?? null,
              unitPrice: Number(item.unitPrice ?? 0),
              quantity: Number(item.quantity ?? 1),
              subtotal:
                Math.round(
                  (Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) +
                    Number.EPSILON) *
                    100,
                ) / 100,
            })),
          },
        },
        include: quotationDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('QUOTATION_UPDATED', actor.id, updated.code, context, {
          quotationId: updated.id,
          code: updated.code,
          subtotal,
          total,
          status: updated.status,
        }),
      })

      return updated
    })
  },

  async convertToOrder(
    id: string,
    input: QuotationConversionInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const quotation = await transaction.quotation.findFirst({
        where: { id, organizationId },
        include: { items: true },
      })
      if (!quotation)
        throw new AppError(
          404,
          'QUOTATION_NOT_FOUND',
          'Cotización no encontrada.',
        )
      if (quotation.status === 'APPROVED' || quotation.workOrderId) {
        throw new AppError(
          409,
          'QUOTATION_ALREADY_CONVERTED',
          'La cotización ya fue convertida a Orden de Taller.',
        )
      }
      let customerId = quotation.customerId
      let vehicleId = quotation.vehicleId

      if (input.mode === 'EXISTING') {
        const customer = await transaction.customer.findFirst({
          where: { id: input.customerId, organizationId },
          select: { id: true },
        })
        const vehicle = await transaction.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            organizationId,
            customerId: input.customerId,
          },
          select: { id: true },
        })
        if (!customer || !vehicle) {
          throw new AppError(
            400,
            'QUOTATION_CONVERSION_ASSOCIATION_INVALID',
            'Selecciona un cliente y un vehículo vinculados de tu organización.',
          )
        }
        customerId = customer.id
        vehicleId = vehicle.id
      } else if (input.mode === 'NEW') {
        const customerInput = input.customer
        const customer = await transaction.customer.create({
          data:
            customerInput.type === 'NATURAL'
              ? {
                  organizationId,
                  type: 'NATURAL',
                  documentNumber: customerInput.documentNumber,
                  firstName: customerInput.firstName,
                  lastName: customerInput.lastName,
                  phone: customerInput.phone,
                  email: customerInput.email ?? null,
                }
              : {
                  organizationId,
                  type: 'LEGAL',
                  documentNumber: customerInput.documentNumber,
                  legalName: customerInput.legalName,
                  phone: customerInput.phone,
                  email: customerInput.email ?? null,
                },
        })
        const vehicle = await transaction.vehicle.create({
          data: {
            organizationId,
            customerId: customer.id,
            plate: customerInput.vehicle.plate,
            brand: customerInput.vehicle.brand,
            model: customerInput.vehicle.model,
            year: customerInput.vehicle.year,
            mileage: customerInput.vehicle.mileage ?? null,
          },
        })
        customerId = customer.id
        vehicleId = vehicle.id
        await transaction.auditLog.createMany({
          data: [
            auditData(
              'CUSTOMER_CREATED',
              actor.id,
              customer.documentNumber,
              context,
              {
                customerId: customer.id,
                source: 'QUOTATION_CONVERSION',
              },
            ),
            auditData('VEHICLE_CREATED', actor.id, vehicle.plate, context, {
              vehicleId: vehicle.id,
              customerId: customer.id,
              source: 'QUOTATION_CONVERSION',
            }),
          ],
        })
      }

      if (!customerId || !vehicleId) {
        throw new AppError(
          400,
          'QUOTATION_INCOMPLETE_FOR_CONVERSION',
          'Completa un cliente y un vehículo antes de convertir la cotización.',
        )
      }

      // Generar código de Orden de Taller
      const rows = await transaction.$queryRaw<
        Array<{ seq: number | string }>
      >`SELECT nextval('"work_orders_code_seq"') AS seq`
      const orderCode = `OT-${String(Number(rows[0].seq)).padStart(6, '0')}`

      const workOrder = await transaction.workOrder.create({
        data: {
          code: orderCode,
          organizationId,
          appointmentId: null,
          customerId,
          vehicleId,
          source: 'WALK_IN',
          receptionNotes: `Convertido desde Cotización ${quotation.code}. ${
            quotation.notes ? `Notas: ${quotation.notes}` : ''
          }`,
          status: 'RECEPCIONADA',
          subtotal: quotation.subtotal,
          total: quotation.total,
          performedBy: actor.name,
          lines: {
            create: quotation.items.map((item) => ({
              type: item.type,
              productId: item.productId,
              serviceId: item.serviceId,
              name: item.name,
              code: item.code,
              unitLabel: item.unitLabel,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        select: { id: true, code: true },
      })

      // Marcar cotización como aprobada y vincularla
      const updatedQuotation = await transaction.quotation.update({
        where: { id },
        data: {
          status: 'APPROVED',
          workOrderId: workOrder.id,
          customerId,
          vehicleId,
          vehiclePlate: null,
        },
        include: quotationDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData(
          'QUOTATION_CONVERTED',
          actor.id,
          quotation.code,
          context,
          {
            quotationId: quotation.id,
            workOrderId: workOrder.id,
            workOrderCode: workOrder.code,
          },
        ),
      })

      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_CREATED',
          actor.id,
          workOrder.code,
          context,
          {
            workOrderId: workOrder.id,
            code: workOrder.code,
            source: 'WALK_IN',
            fromQuotationCode: quotation.code,
          },
        ),
      })

      return {
        quotation: updatedQuotation,
        workOrder,
      }
    })
  },
}
