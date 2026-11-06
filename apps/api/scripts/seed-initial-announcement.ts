import 'dotenv/config'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'

async function main() {
  const count = await databaseService.client.announcement.count()
  console.info(`Anuncios actuales en base de datos: ${count}`)

  if (count === 0) {
    const ann = await databaseService.client.announcement.create({
      data: {
        title: 'Torcly v1.1.2 — Centro de Notificaciones y Experiencia SaaS',
        summary:
          'Nueva versión con centro de notificaciones unificado, filtrado rápido por categorías y avisos en tiempo real para todos los talleres.',
        content:
          '### Resumen de la Versión v1.1.2\n\n' +
          'Nos complace anunciar el despliegue oficial de **Torcly v1.1.2** con importantes mejoras en la productividad de los talleres y la comunicación de plataforma:\n\n' +
          '- **Centro de Notificaciones Unificado:** Nueva campana interactiva con categorías operativas (Órdenes de trabajo, Inventario, Clientes y Facturación).\n' +
          '- **Bandeja Completa y Filtros Rápidos:** Visualización por rangos de tiempo (Hoy, 7 días, 30 días, 90 días) con colores visuales suaves identificativos.\n' +
          '- **Módulo de Novedades y Anuncios SaaS:** Espacio centralizado para consultar releases, cambios en el sistema y ventanas de mantenimiento programadas.\n' +
          '- **Mejoras de Rendimiento:** Optimización de consultas en base de datos y reducción de latencia en carga de vistas operativas.\n\n' +
          'Si tienes dudas o consultas sobre el uso de las nuevas herramientas, revisa nuestro video tutorial explicativo o contacta al equipo de soporte de Torcly.',
        type: 'UPDATE',
        status: 'PUBLISHED',
        versionTag: 'v1.1.2',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        createdBy: 'Equipo Torcly',
      },
    })
    console.info(`✅ Anuncio inicial creado con ID: ${ann.id}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
