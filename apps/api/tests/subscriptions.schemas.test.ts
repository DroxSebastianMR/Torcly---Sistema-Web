import { describe, expect, it } from 'vitest'
import {
  assignSubscriptionSchema,
  billingCycleEnum,
  createPlanSchema,
  platformSubscriptionQuerySchema,
  subscriptionStatusEnum,
  updatePlanSchema,
  updatePlatformSubscriptionSchema,
} from '../src/modules/subscriptions/subscriptions.schemas.js'

describe('subscriptionStatusEnum', () => {
  it('valida estados permitidos', () => {
    expect(subscriptionStatusEnum.parse('ACTIVE')).toBe('ACTIVE')
    expect(subscriptionStatusEnum.parse('TRIAL')).toBe('TRIAL')
    expect(subscriptionStatusEnum.parse('PAST_DUE')).toBe('PAST_DUE')
    expect(subscriptionStatusEnum.parse('CANCELED')).toBe('CANCELED')
    expect(subscriptionStatusEnum.parse('SUSPENDED')).toBe('SUSPENDED')
  })

  it('rechaza estado no soportado', () => {
    expect(() => subscriptionStatusEnum.parse('EXPIRED')).toThrow()
  })
})

describe('billingCycleEnum', () => {
  it('valida ciclos permitidos', () => {
    expect(billingCycleEnum.parse('MONTHLY')).toBe('MONTHLY')
    expect(billingCycleEnum.parse('ANNUAL')).toBe('ANNUAL')
  })

  it('rechaza ciclo inválido', () => {
    expect(() => billingCycleEnum.parse('WEEKLY')).toThrow()
  })
})

describe('platformSubscriptionQuerySchema', () => {
  it('asigna valores por defecto', () => {
    const parsed = platformSubscriptionQuerySchema.parse({})
    expect(parsed.status).toBe('all')
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(10)
    expect(parsed.search).toBeUndefined()
  })

  it('valida filtros opcionales de búsqueda y estado', () => {
    const parsed = platformSubscriptionQuerySchema.parse({
      search: 'Taller Central',
      status: 'ACTIVE',
      planCode: 'PRO',
      page: '3',
      pageSize: '25',
    })
    expect(parsed.search).toBe('Taller Central')
    expect(parsed.status).toBe('ACTIVE')
    expect(parsed.planCode).toBe('PRO')
    expect(parsed.page).toBe(3)
    expect(parsed.pageSize).toBe(25)
  })
})

describe('updatePlatformSubscriptionSchema', () => {
  it('valida payload completo de actualización', () => {
    const parsed = updatePlatformSubscriptionSchema.parse({
      planId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'ACTIVE',
      billingCycle: 'ANNUAL',
      renewsAt: '2026-12-31T23:59:59.000Z',
      notes: 'Ampliación de vigencia anual aprobada.',
    })
    expect(parsed.status).toBe('ACTIVE')
    expect(parsed.billingCycle).toBe('ANNUAL')
    expect(parsed.renewsAt).toBe('2026-12-31T23:59:59.000Z')
    expect(parsed.notes).toBe('Ampliación de vigencia anual aprobada.')
  })

  it('permite campos opcionales o nulos para renovación', () => {
    const parsed = updatePlatformSubscriptionSchema.parse({
      status: 'SUSPENDED',
      renewsAt: null,
      notes: null,
    })
    expect(parsed.status).toBe('SUSPENDED')
    expect(parsed.renewsAt).toBeNull()
    expect(parsed.notes).toBeNull()
  })

  it('rechaza uuid de plan inválido', () => {
    expect(() =>
      updatePlatformSubscriptionSchema.parse({
        planId: 'plan-no-uuid',
      }),
    ).toThrow()
  })
})

describe('assignSubscriptionSchema', () => {
  it('valida asignación de membresía anual', () => {
    const parsed = assignSubscriptionSchema.parse({
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      planId: '123e4567-e89b-12d3-a456-426614174001',
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
      notes: 'Membresía anual activada para taller en producción.',
    })
    expect(parsed.billingCycle).toBe('ANNUAL')
    expect(parsed.status).toBe('ACTIVE')
    expect(parsed.notes).toBe(
      'Membresía anual activada para taller en producción.',
    )
  })

  it('rechaza organización inválida', () => {
    expect(() =>
      assignSubscriptionSchema.parse({
        organizationId: 'no-uuid',
        planId: '123e4567-e89b-12d3-a456-426614174001',
      }),
    ).toThrow()
  })
})

describe('createPlanSchema y updatePlanSchema', () => {
  it('valida creación de plan comercial con cuotas', () => {
    const parsed = createPlanSchema.parse({
      code: 'VIP_TURBO',
      name: 'Plan VIP Turbo',
      description: 'Para talleres de alto rendimiento.',
      priceMonthly: 199.9,
      priceYearly: 1999.0,
      maxMembers: 15,
      maxTechnicians: 25,
      maxProducts: 5000,
      features: ['Atención 24/7', 'IA avanzada'],
    })
    expect(parsed.code).toBe('VIP_TURBO')
    expect(parsed.priceMonthly).toBe(199.9)
    expect(parsed.maxMembers).toBe(15)
  })

  it('rechaza código con caracteres no permitidos', () => {
    expect(() =>
      createPlanSchema.parse({
        code: 'plan con espacios!',
        name: 'Plan Invalido',
        priceMonthly: 50,
        priceYearly: 500,
        maxMembers: 5,
        maxTechnicians: 5,
        maxProducts: 500,
      }),
    ).toThrow()
  })

  it('permite actualizar campos parciales de un plan sin código', () => {
    const parsed = updatePlanSchema.parse({
      name: 'Plan Profesional Plus',
      priceMonthly: 179.0,
      maxMembers: 12,
    })
    expect(parsed.name).toBe('Plan Profesional Plus')
    expect(parsed.priceMonthly).toBe(179.0)
    expect(parsed.maxMembers).toBe(12)
  })
})
