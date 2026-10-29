import { describe, expect, it, vi } from 'vitest'
import {
  FakeProvider,
  GroqProvider,
} from '../src/modules/assistant/ai.provider.js'

const input = {
  message: '¿Qué requiere atención?',
  context: {
    generatedAt: '2026-10-24T00:00:00.000Z',
    period: { from: null, to: null },
    sources: [
      { module: 'inventory', label: 'Inventario', path: '/inventario' },
    ],
    facts: { operations: {} },
  },
  history: [],
}

describe('Proveedores del asistente', () => {
  it('usa una respuesta determinista en fake', async () => {
    await expect(new FakeProvider().complete(input)).resolves.toContain(
      'Inventario',
    )
  })

  it('convierte una cuota del proveedor en error seguro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 429, ok: false }),
    )
    await expect(
      new GroqProvider('secret', 1000).complete(input),
    ).rejects.toMatchObject({ code: 'ASSISTANT_RATE_LIMITED' })
    vi.unstubAllGlobals()
  })

  it('envía al proveedor reglas de alcance para Torcly y el taller', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Respuesta.' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      new GroqProvider('secret', 1000).complete(input),
    ).resolves.toBe('Respuesta.')

    const request = fetchMock.mock.calls[0]?.[1] as { body: string }
    const payload = JSON.parse(request.body) as {
      model: string
      messages: Array<{ content: string }>
    }
    expect(payload.model).toBe('openai/gpt-oss-20b')
    expect(payload.messages[0]?.content).toContain(
      'Solo respondes preguntas sobre Torcly',
    )
    expect(payload.messages[0]?.content).toContain('consulta es ajena a Torcly')
    vi.unstubAllGlobals()
  })
})
