type SessionExpiredListener = () => void

const listeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired() {
  for (const listener of listeners) listener()
}
