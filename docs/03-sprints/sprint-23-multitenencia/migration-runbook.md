# Runbook de migración multitenant

## Antes de aplicar

1. Generar un respaldo restaurable de PostgreSQL.
2. Guardar conteos por tabla y detectar referencias huérfanas.
3. Confirmar el nombre y código de la organización que recibirá los datos
   actuales durante el backfill.
4. Ejecutar pruebas en una copia de la base de producción.

## Fase 1: fundación

La migración `20261103000000_add_organization_foundation` crea únicamente las
tablas de organización, membresías y la organización activa de sesión. No
modifica los datos comerciales existentes ni debe producir pérdida de datos.

Después de aplicarla, se crea la organización inicial con las variables
`SEED_ORGANIZATION_CODE` y `SEED_ORGANIZATION_NAME`. Las cuentas de taller
reciben una membresía con su rol actual. La cuenta `SEED_PLATFORM_ADMIN_*`, si
se configura, queda global y sin datos operativos asociados.

## Fases posteriores

1. Añadir `organization_id` nullable a cada tabla operativa y poblarla con la
   organización de transición.
2. Publicar repositorios que filtren y validen pertenencia por organización.
3. Ejecutar pruebas de lectura, escritura y referencias cruzadas con dos
   organizaciones.
4. Convertir `organization_id` en obligatorio y sustituir únicos globales por
   índices compuestos que incluyan `organization_id`.

## Verificación posterior

- Los conteos de la organización de transición coinciden con los previos.
- Una sesión de otra organización no puede listar, obtener ni mutar esos UUID.
- Un código de producto y una placa iguales pueden existir en organizaciones
  distintas.
- El administrador de plataforma no obtiene datos operativos sin una entrada
  de soporte auditada.
