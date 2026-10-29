export interface PasswordResetMessage {
  to: string
  token: string
  expiresAt: Date
  requestId?: string
}

export interface PasswordResetNotifier {
  send(message: PasswordResetMessage): Promise<void>
}

const environmentNotifier: PasswordResetNotifier = {
  async send(message) {
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'password_reset_requested',
        requestId: message.requestId,
        expiresAt: message.expiresAt.toISOString(),
      }),
    )
  },
}

let notifier: PasswordResetNotifier = environmentNotifier

export function getPasswordResetNotifier() {
  return notifier
}

export function setPasswordResetNotifier(next: PasswordResetNotifier) {
  notifier = next
}
