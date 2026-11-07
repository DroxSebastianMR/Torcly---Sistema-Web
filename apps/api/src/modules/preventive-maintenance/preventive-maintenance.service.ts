import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type {
  MaintenancePriority,
  PreventiveMaintenanceItem,
  PreventiveMaintenanceMetrics,
  PreventiveMaintenanceQuery,
} from './preventive-maintenance.types.js'

export const preventiveMaintenanceService = {
  async getReminders(
    organizationId: string,
    organizationName: string,
    query: PreventiveMaintenanceQuery,
  ): Promise<{
    data: PreventiveMaintenanceItem[]
    metrics: PreventiveMaintenanceMetrics
  }> {
    const search = query.search?.trim()

    const vehicles = await databaseService.client.vehicle.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { plate: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                {
                  customer: {
                    OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        workOrders: {
          where: {
            status: { in: ['ENTREGADA', 'LISTA_PARA_ENTREGA'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            lines: {
              include: {
                service: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const allItems: PreventiveMaintenanceItem[] = vehicles.map((vehicle) => {
      const lastOrder = vehicle.workOrders[0]
      const referenceDate = lastOrder?.deliveredAt ?? lastOrder?.createdAt ?? vehicle.createdAt
      const daysSinceLastService = Math.max(
        0,
        Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24)),
      )

      let priority: MaintenancePriority = 'UP_TO_DATE'
      if (daysSinceLastService >= 180) {
        priority = 'CRITICAL'
      } else if (daysSinceLastService >= 150) {
        priority = 'WARNING'
      }

      const hasOilOrPeriodicService = lastOrder?.lines.some((line) =>
        line.service?.name?.toLowerCase().includes('aceite') ||
        line.service?.name?.toLowerCase().includes('preventivo'),
      )

      const recommendedService = hasOilOrPeriodicService
        ? 'Cambio de aceite y filtros (Servicio periódico)'
        : 'Mantenimiento preventivo general y chequeo de fluidos'

      const customerName = `${vehicle.customer.firstName} ${vehicle.customer.lastName}`.trim()
      const suggestedMessage = `Hola ${customerName}, te saludamos de ${organizationName}. Te recordamos que tu vehículo ${vehicle.brand} ${vehicle.model} (Placa ${vehicle.plate}) ya cumplió ${daysSinceLastService} días desde su última atención. Le corresponde su ${recommendedService}. ¿Te gustaría agendar una cita esta semana?`

      return {
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        customer: {
          id: vehicle.customer.id,
          name: customerName || 'Cliente sin nombre',
          phone: vehicle.customer.phone,
          email: vehicle.customer.email,
        },
        lastServiceDate: lastOrder ? (lastOrder.deliveredAt ?? lastOrder.createdAt).toISOString() : null,
        lastOrderCode: lastOrder?.code ?? null,
        lastMileage: lastOrder?.currentMileage ?? vehicle.mileage ?? null,
        daysSinceLastService,
        priority,
        recommendedService,
        suggestedMessage,
      }
    })

    const metrics: PreventiveMaintenanceMetrics = {
      totalVehiclesAnalyzed: allItems.length,
      criticalCount: allItems.filter((item) => item.priority === 'CRITICAL').length,
      warningCount: allItems.filter((item) => item.priority === 'WARNING').length,
      upToDateCount: allItems.filter((item) => item.priority === 'UP_TO_DATE').length,
    }

    const filteredItems =
      query.priority && query.priority !== 'all'
        ? allItems.filter((item) => item.priority === query.priority)
        : allItems

    return {
      data: filteredItems,
      metrics,
    }
  },
}
