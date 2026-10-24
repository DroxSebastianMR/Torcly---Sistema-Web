import { env } from '@/app/config/env'

const telemetryDelayMs = 3_000

export function reportModuleLoad(
  path: string,
  durationMs: number,
  navigationType: 'initial' | 'route-change',
) {
  const body = JSON.stringify({
    path,
    durationMs: Number(durationMs.toFixed(2)),
    navigationType,
  })
  const send = () => {
    void fetch(`${env.apiUrl}/metrics/module-load`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => undefined)
  }

  window.setTimeout(send, telemetryDelayMs)
}
