import { createApp } from './app.js'
import { env } from './config/env.js'
import { databaseService } from './infrastructure/database/prisma.service.js'

function startServer() {
  let shuttingDown = false
  const server = createApp().listen(env.PORT, env.HOST, () => {
    console.info(`Torcly API: http://${env.HOST}:${env.PORT}/api/v1`)
  })

  void databaseService
    .connect()
    .then(() => {
      if (!shuttingDown) console.info('Base de datos: conectada mediante Prisma')
    })
    .catch(() => {
      if (!shuttingDown) {
        console.error(
          'Base de datos: conexión inicial no disponible; la API continuará activa.',
        )
      }
    })

  server.on('error', async () => {
    console.error('No se pudo iniciar la API.')
    await databaseService.disconnect()
    process.exit(1)
  })

  function shutdown() {
    if (shuttingDown) return
    shuttingDown = true

    server.close(async (error) => {
      await databaseService.disconnect()
      process.exit(error ? 1 : 0)
    })

    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer()
