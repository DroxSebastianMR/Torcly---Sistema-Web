export const notificationDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNotificationDate(dateStr: string): string {
  try {
    return notificationDateFormatter.format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
