import { env } from '@/app/config/env'

export function reportModuleLoad(
  path: string,
  durationMs: number,
  navigationType: 'initial' | 'route-change',
) {
  void fetch(`${env.apiUrl}/metrics/module-load`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      durationMs: Number(durationMs.toFixed(2)),
      navigationType,
    }),
  }).catch(() => undefined)
}
