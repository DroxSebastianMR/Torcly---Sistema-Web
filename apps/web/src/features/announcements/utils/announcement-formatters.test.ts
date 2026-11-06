import { describe, expect, it } from 'vitest'
import {
  getAnnouncementAppearance,
  getEmbeddableVideoUrl,
} from './announcement-formatters'

describe('getAnnouncementAppearance', () => {
  it('retorna paleta y etiqueta correcta para UPDATE', () => {
    const config = getAnnouncementAppearance('UPDATE')
    expect(config.label).toBe('Actualización')
    expect(config.bg).toBe('#E7F6EF') // Verde menta
    expect(config.accent).toBe('#329B78')
  })

  it('retorna paleta y etiqueta correcta para MAINTENANCE', () => {
    const config = getAnnouncementAppearance('MAINTENANCE')
    expect(config.label).toBe('Mantenimiento')
    expect(config.bg).toBe('#FFF0F4') // Rosa suave
    expect(config.accent).toBe('#CE4779')
  })

  it('retorna paleta y etiqueta correcta para COMMUNICATION', () => {
    const config = getAnnouncementAppearance('COMMUNICATION')
    expect(config.label).toBe('Comunicado')
    expect(config.bg).toBe('#EAF4FD') // Azul cielo
    expect(config.accent).toBe('#4385C7')
  })
})

describe('getEmbeddableVideoUrl', () => {
  it('transforma url de youtube watch a embed nocookie', () => {
    const raw = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    expect(getEmbeddableVideoUrl(raw)).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('transforma url corta youtu.be a embed', () => {
    const raw = 'https://youtu.be/dQw4w9WgXcQ'
    expect(getEmbeddableVideoUrl(raw)).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('transforma url de loom share a embed', () => {
    const raw = 'https://www.loom.com/share/abc12345'
    expect(getEmbeddableVideoUrl(raw)).toBe(
      'https://www.loom.com/embed/abc12345',
    )
  })

  it('retorna null si no se proporciona url', () => {
    expect(getEmbeddableVideoUrl(null)).toBeNull()
    expect(getEmbeddableVideoUrl(undefined)).toBeNull()
    expect(getEmbeddableVideoUrl('')).toBeNull()
  })
})
