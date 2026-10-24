import { describe, expect, it } from 'vitest'
import { assistantChatSchema } from '../src/modules/assistant/assistant.schemas.js'

describe('Esquema del asistente', () => {
  it('acepta una consulta de lectura acotada', () => {
    expect(
      assistantChatSchema.parse({ message: '¿Cómo está el stock?' }),
    ).toMatchObject({ message: '¿Cómo está el stock?' })
  })

  it('rechaza mensajes largos y periodos invertidos', () => {
    expect(() =>
      assistantChatSchema.parse({ message: 'x'.repeat(801) }),
    ).toThrow()
    expect(() =>
      assistantChatSchema.parse({
        message: 'Consulta válida',
        from: '2026-10-31',
        to: '2026-10-01',
      }),
    ).toThrow()
  })
})
