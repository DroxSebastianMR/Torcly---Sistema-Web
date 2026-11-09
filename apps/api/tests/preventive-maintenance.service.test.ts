import { describe, expect, it, vi, beforeEach } from 'vitest'
import { preventiveMaintenanceService } from '../src/modules/preventive-maintenance/preventive-maintenance.service.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'

describe('Preventive Maintenance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates CRITICAL priority for vehicles with last service >= 180 days', async () => {
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() - 200) // 200 days ago

    vi.spyOn(databaseService.client.vehicle, 'findMany').mockResolvedValueOnce([
      {
        id: 'vehicle-1',
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        mileage: 45000,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        organizationId: 'org-1',
        customerId: 'cust-1',
        customer: {
          id: 'cust-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '987654321',
          email: 'juan@example.com',
        },
        workOrders: [
          {
            id: 'wo-1',
            code: 'OT-0001',
            deliveredAt: mockDate,
            createdAt: mockDate,
            currentMileage: 40000,
            lines: [
              {
                service: {
                  name: 'Cambio de aceite sintético 5W-30',
                },
              },
            ],
          },
        ],
      },
    ] as any)

    const result = await preventiveMaintenanceService.getReminders(
      'org-1',
      'Taller Torcly',
      {},
    )

    expect(result.metrics.criticalCount).toBe(1)
    expect(result.metrics.warningCount).toBe(0)
    expect(result.metrics.upToDateCount).toBe(0)
    expect(result.data[0].priority).toBe('CRITICAL')
    expect(result.data[0].daysSinceLastService).toBeGreaterThanOrEqual(199)
    expect(result.data[0].suggestedMessage).toContain('ABC-123')
    expect(result.data[0].suggestedMessage).toContain('Taller Torcly')
  })

  it('calculates WARNING priority for vehicles with last service between 150 and 179 days', async () => {
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() - 160) // 160 days ago

    vi.spyOn(databaseService.client.vehicle, 'findMany').mockResolvedValueOnce([
      {
        id: 'vehicle-2',
        plate: 'XYZ-789',
        brand: 'Nissan',
        model: 'Sentra',
        year: 2020,
        mileage: 60000,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        organizationId: 'org-1',
        customerId: 'cust-2',
        customer: {
          id: 'cust-2',
          firstName: 'María',
          lastName: 'García',
          phone: '912345678',
          email: 'maria@example.com',
        },
        workOrders: [
          {
            id: 'wo-2',
            code: 'OT-0002',
            deliveredAt: mockDate,
            createdAt: mockDate,
            currentMileage: 55000,
            lines: [],
          },
        ],
      },
    ] as any)

    const result = await preventiveMaintenanceService.getReminders(
      'org-1',
      'Taller Torcly',
      {},
    )

    expect(result.metrics.criticalCount).toBe(0)
    expect(result.metrics.warningCount).toBe(1)
    expect(result.metrics.upToDateCount).toBe(0)
    expect(result.data[0].priority).toBe('WARNING')
  })

  it('filters by priority when query parameter is provided', async () => {
    const criticalDate = new Date()
    criticalDate.setDate(criticalDate.getDate() - 200)

    const upToDateDate = new Date()
    upToDateDate.setDate(upToDateDate.getDate() - 30)

    vi.spyOn(databaseService.client.vehicle, 'findMany').mockResolvedValueOnce([
      {
        id: 'vehicle-1',
        plate: 'AAA-111',
        brand: 'Ford',
        model: 'Ranger',
        year: 2022,
        mileage: 30000,
        createdAt: criticalDate,
        updatedAt: criticalDate,
        organizationId: 'org-1',
        customerId: 'cust-1',
        customer: { id: 'cust-1', firstName: 'A', lastName: 'B', phone: null, email: null },
        workOrders: [{ id: 'wo-1', code: 'OT-1', deliveredAt: criticalDate, createdAt: criticalDate, currentMileage: 25000, lines: [] }],
      },
      {
        id: 'vehicle-2',
        plate: 'BBB-222',
        brand: 'Kia',
        model: 'Rio',
        year: 2023,
        mileage: 15000,
        createdAt: upToDateDate,
        updatedAt: upToDateDate,
        organizationId: 'org-1',
        customerId: 'cust-2',
        customer: { id: 'cust-2', firstName: 'C', lastName: 'D', phone: null, email: null },
        workOrders: [{ id: 'wo-2', code: 'OT-2', deliveredAt: upToDateDate, createdAt: upToDateDate, currentMileage: 12000, lines: [] }],
      },
    ] as any)

    const result = await preventiveMaintenanceService.getReminders(
      'org-1',
      'Taller Torcly',
      { priority: 'CRITICAL' },
    )

    expect(result.metrics.totalVehiclesAnalyzed).toBe(2)
    expect(result.data.length).toBe(1)
    expect(result.data[0].plate).toBe('AAA-111')
  })
})
