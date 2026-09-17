import { createApp } from './app.js'
import { env } from './config/env.js'

const server = createApp().listen(env.PORT, env.HOST, () => {
  console.info(`Torcly API: http://${env.HOST}:${env.PORT}/api/v1`)
})
server.on('error', (error) => {
  console.error('No se pudo iniciar la API:', error.message)
  process.exit(1)
})
let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  server.close((error) => process.exit(error ? 1 : 0))
  setTimeout(() => process.exit(1), 10000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
