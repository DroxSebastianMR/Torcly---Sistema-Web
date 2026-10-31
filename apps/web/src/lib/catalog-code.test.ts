import { describe, expect, it } from 'vitest'
import {
  appendCatalogCodeSequence,
  normalizeCatalogCode,
  suggestProductCode,
  suggestServiceCode,
} from './catalog-code'

describe('Códigos compactos de catálogo', () => {
  it('combina marca y modelo sin exceder doce caracteres', () => {
    expect(suggestProductCode('Filtro de aceite Mann W 712/83', 'Mann')).toBe(
      'MANN-W71283',
    )
    expect(suggestProductCode('Filtro de aceite CA 2022')).toBe('FIL-CA2022')
  })

  it('abrevia servicios con palabras significativas', () => {
    expect(suggestServiceCode('Servicio de torque')).toBe('SERV-TOR')
    expect(suggestServiceCode('Revisión de suspensión y dirección')).toBe(
      'SERV-REV-SUS',
    )
  })

  it('normaliza la edición manual', () => {
    expect(normalizeCatalogCode(' filtro ca / 2022 ')).toBe('FILTRO-CA-2022')
  })

  it('resuelve colisiones manteniendo el código corto', () => {
    expect(appendCatalogCodeSequence('FIL-CA2022', 2)).toBe('FIL-CA2022-2')
    expect(appendCatalogCodeSequence('SERV-REV-SUS', 12)).toBe('SERV-REV-12')
  })
})
