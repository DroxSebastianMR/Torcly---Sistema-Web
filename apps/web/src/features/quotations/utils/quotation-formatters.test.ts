import { describe, expect, it } from 'vitest'
import {
  generateQuotationWhatsAppMessage,
  quotationStatusConfig,
} from './quotation-formatters'
import type { QuotationSummary } from '../types/quotations.types'

describe('quotation-formatters', () => {
  it('tiene etiquetas para todos los estados de cotización', () => {
    expect(quotationStatusConfig.DRAFT.label).toBe('Borrador')
    expect(quotationStatusConfig.SENT.label).toBe('Enviada')
    expect(quotationStatusConfig.APPROVED.label).toBe('Aprobada')
    expect(quotationStatusConfig.EXPIRED.label).toBe('Vencida')
    expect(quotationStatusConfig.REJECTED.label).toBe('Rechazada')
  })

  it('genera mensaje formateado para WhatsApp correctamente', () => {
    const mockQuotation: QuotationSummary = {
      id: 'q-1',
      code: 'COT-000042',
      status: 'SENT',
      customer: {
        id: 'c-1',
        name: 'Carlos Mendoza',
        phone: '987654321',
        documentNumber: '12345678',
        email: 'carlos@example.com',
      },
      vehiclePlate: 'ABC-123',
      vehicle: {
        id: 'v-1',
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
      },
      validUntil: '2026-12-31T00:00:00.000Z',
      subtotal: 300,
      total: 300,
      itemCount: 2,
      items: [
        {
          id: 'qi-1',
          type: 'PRODUCT',
          productId: 'p-1',
          serviceId: null,
          name: 'Filtro de aceite',
          code: 'FIL-001',
          unitLabel: 'und',
          unitPrice: 100,
          quantity: 2,
          subtotal: 200,
        },
        {
          id: 'qi-2',
          type: 'SERVICE',
          productId: null,
          serviceId: 's-1',
          name: 'Cambio de aceite',
          code: 'SERV-001',
          unitLabel: null,
          unitPrice: 100,
          quantity: 1,
          subtotal: 100,
        },
      ],
      workOrderId: null,
      notes: 'Incluye cambio de aceite y filtro.',
      createdAt: '2026-11-09T10:00:00.000Z',
      updatedAt: '2026-11-09T10:00:00.000Z',
      createdBy: 'Admin',
    }

    const message = generateQuotationWhatsAppMessage(
      mockQuotation,
      'Taller Hermanos Motors',
    )
    expect(message).toContain(
      'Hola Carlos Mendoza, te saludamos de *Taller Hermanos Motors*.',
    )
    expect(message).toContain('Toyota Corolla (ABC-123)')
    expect(message).toContain('· N° Cotización: *COT-000042*')
    expect(message).toContain('S/\u00a0300.00')
    expect(message).toContain('Detalle del presupuesto:')
    expect(message).toContain('• Filtro de aceite — 2 und (S/\u00a0200.00)')
    expect(message).toContain('• Cambio de aceite — 1 (S/\u00a0100.00)')
    expect(message).toContain(
      '· Observaciones: Incluye cambio de aceite y filtro.',
    )
  })
})
