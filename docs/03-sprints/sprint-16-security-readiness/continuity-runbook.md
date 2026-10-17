# Runbook de continuidad - PostgreSQL (HU-88)

Procedimiento operable de respaldo y restauración para Torcly. Es un documento
ejecutable, no una afirmación de que la restauración ya se ensayó: la evidencia
de una restauración de QA autorizada queda pendiente y debe registrarse aparte.

> No ejecutar `pg_dump`/`pg_restore` contra producción ni con datos reales. Todo
> ensayo se hace sobre una base descartable y con autorización explícita.

## Entornos

| Entorno    | Base                    | Respaldo                            | Restauración                      |
| ---------- | ----------------------- | ----------------------------------- | --------------------------------- |
| Desarrollo | local                   | opcional                            | libre, datos descartables         |
| QA         | controlada y desechable | diario                              | permitida para ensayo documentado |
| Producción | proveedor gestionado    | diario, cifrado, retención definida | solo con aprobación y ventana     |

La aplicación solo usa `DATABASE_URL`/`DIRECT_URL`; el respaldo se resuelve en
infraestructura, no en el código.

## Objetivos propuestos

- **RPO** (pérdida máxima admisible): 24 h (respaldo diario).
- **RTO** (tiempo de recuperación objetivo): 2 h para restaurar y validar.
- Estos valores son propuestas a acordar con el responsable operativo.

## Respaldo (diario)

1. Generar el volcado lógico con formato comprimido:
   `pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" > torcly-$(date +%F).dump`
2. Cifrar en reposo (ej. `age`/`gpg`) antes de moverlo fuera del host.
3. Verificar la copia: `pg_restore --list torcly-$(date +%F).dump` debe listar
   objetos sin error.
4. Almacenar en una ubicación separada del servidor de base de datos (almacenamiento
   de objetos con control de acceso).
5. Registrar: fecha, tamaño, checksum, responsable y resultado de la verificación.

## Retención y protección

- Retención mínima propuesta: 30 respaldos diarios + 12 mensuales.
- Copias cifradas en tránsito y en reposo; acceso restringido con mínimo privilegio.
- Secretos de respaldo solo en el gestor de secretos del proveedor; nunca en el repo.

## Restauración (ensayo en QA descartable)

1. Crear una base vacía y desechable en el entorno de QA.
2. Restaurar:
   `pg_restore --clean --if-exists --no-owner --dbname "$QA_DATABASE_URL" torcly-YYYY-MM-DD.dump`
3. Validar integridad mínima:
   - `prisma migrate status` sin migraciones pendientes.
   - Consultas de conteo en tablas clave (`User`, `Sale`, `InventoryMovement`, `AuditLog`).
   - Verificación funcional corta: iniciar sesión y consultar un listado.
4. Registrar evidencia fechada: responsable, duración total, resultado, incidencias
   y `requestId` de una operación de prueba. Nunca adjuntar `.env` ni datos reales.
5. Destruir la base de QA al terminar.

## Respuesta a incidentes

1. Detectar y clasificar (caída, corrupción, pérdida de datos).
2. Aislar el servicio afectado y comunicar a los responsables.
3. Decidir el punto de restauración más reciente y válido.
4. Restaurar en un entorno controlado, validar y promover con aprobación.
5. Documentar causa raíz y acciones preventivas.

## Responsables

| Rol                   | Responsabilidad                                       |
| --------------------- | ----------------------------------------------------- |
| Responsable operativo | autorizar ensayos, aprobar restauración en producción |
| Infraestructura/BD    | ejecutar respaldo, verificar y restaurar              |
| Desarrollo            | validar la integridad funcional tras restaurar        |

## Controles del proveedor

- Confirmar en el proveedor: respaldo automático, cifrado, retención, ubicación,
  recuperación a un punto en el tiempo y SLA de soporte.
- El sistema no simula copias: si el proveedor no ofrece respaldo, debe declararse
  como dependencia y riesgo explícito.
