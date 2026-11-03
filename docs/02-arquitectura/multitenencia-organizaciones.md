# Multitenencia por organizaciones

## Objetivo

Torcly operará como una plataforma compartida: una misma base de datos y las
mismas tablas atenderán a varios talleres, pero ningún usuario de un taller
podrá leer o modificar datos de otro. La separación se aplica en servidor y en
base de datos, no mediante filtros que el navegador pueda alterar.

## Modelo aprobado

- **Organization** representa un taller o negocio cliente de Torcly.
- **User** es una identidad global de inicio de sesión; no es propietario de
  datos operativos por sí sola.
- **OrganizationMembership** vincula un usuario con una organización y con el
  rol que tiene dentro de ella. Un usuario podrá pertenecer a más de un taller.
- **Platform administrator** es una cuenta global (`isPlatformAdmin`) para el
  equipo de Torcly. No equivale a un administrador de taller ni recibe datos de
  una organización por defecto.
- La sesión guarda o resuelve la organización activa desde una membresía válida.
  La API nunca aceptará un `organizationId` enviado por el cliente como fuente
  de autoridad.

## Nombres y niveles de acceso

Para que no se confunda quién administra **Torcly** con quién administra un
**taller**, existen dos niveles deliberadamente separados:

| Nivel        | Nombre visible                     | Implementación                                        | Alcance                                                                                    |
| ------------ | ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plataforma   | Administrador de plataforma Torcly | `User.isPlatformAdmin`                                | Organizaciones, membresías, planes, soporte y analítica agregada.                          |
| Organización | Dueño del taller                   | Membresía con el rol operativo actual `administrator` | Sólo el taller al que pertenece: operación, usuarios internos y configuración del negocio. |
| Organización | Colaborador del taller             | Membresía con otro rol operativo                      | Sólo los permisos y datos del taller asignado.                                             |

`isPlatformAdmin` **no es un rol de taller** y no se mostrará en Usuarios y
permisos del negocio. Por compatibilidad de la instalación actual, el código
interno `administrator` se conserva durante la transición, pero en la interfaz
se presentará como **Dueño del taller**. En una migración posterior y aislada
podrá cambiarse el código a `owner` sin mezclarlo con privilegios de plataforma.

Una cuenta de plataforma no recibe permisos operativos ni una organización por
defecto. Para soporte deberá entrar por un flujo explícito, temporal y
auditado; nunca por un selector libre enviado desde el navegador.

## Alcance de aislamiento

Cada registro operativo tendrá `organization_id`: clientes, vehículos,
catálogos, productos, servicios, técnicos, inventario, citas, órdenes, ventas,
pagos, cajas, compras, proveedores, reabastecimiento, notificaciones,
conversaciones IA y auditoría.

Los datos de identidad permanecen globales: usuarios, sesiones, permisos y
plantillas de roles. Los roles se aplican mediante membresías, no directamente
sobre la identidad del usuario.

## Reglas de seguridad

1. Cada endpoint autenticado obtiene el contexto de organización desde la
   sesión y la membresía activa.
2. Repositorios y servicios filtran siempre por `organizationId`; un UUID de
   otro tenant responde como recurso inexistente o acceso denegado, sin revelar
   su existencia.
3. Las referencias entre entidades deben pertenecer a la misma organización.
4. El administrador de plataforma accede a una consola separada y toda entrada
   a una organización queda auditada con motivo, actor y organización destino.
5. Códigos únicos pasan a ser únicos por organización: placas, documentos,
   códigos de productos, servicios, técnicos, ventas, citas, órdenes, pagos y
   cajas.

## Migración sin pérdida de datos

La producción actual no se modificará de golpe.

1. Crear organizaciones, membresías y la columna nullable `organization_id`.
2. Crear una organización de transición y asociar a ella todos los datos y
   usuarios existentes mediante una migración de backfill auditable.
3. Publicar la API con contexto de tenant y doble validación de pertenencia.
4. Verificar conteos por tabla, relaciones cruzadas y pruebas de aislamiento.
5. Convertir las columnas a obligatorias y reemplazar índices globales por
   índices/únicos compuestos por organización.

Antes de ejecutar cada fase en producción se debe hacer respaldo, ejecutar
preflight de conteos y tener una ventana de reversión.

## Cuenta global

La cuenta global se aprovisionará únicamente con variables de entorno de la
semilla (`SEED_PLATFORM_ADMIN_*`); nunca se incluirá una contraseña en el
repositorio. Su uso se limita a administrar organizaciones, activar/desactivar
cuentas y soporte auditado. Para trabajar el día a día dentro de un taller se
usará una cuenta con membresía de esa organización.

## Variables de semilla

La primera organización y, si se requiere, la cuenta global de plataforma se
configuran fuera del repositorio:

```env
SEED_ORGANIZATION_CODE=taller-principal
SEED_ORGANIZATION_NAME=Nombre del taller

SEED_PLATFORM_ADMIN_EMAIL=soporte@torcly.com
SEED_PLATFORM_ADMIN_USERNAME=soporte
SEED_PLATFORM_ADMIN_NAME=Equipo Torcly
SEED_PLATFORM_ADMIN_PASSWORD=<secreto-seguro>
```

La cuenta global no recibe una membresía automáticamente; por lo tanto, no
puede consultar datos operativos hasta que el flujo de soporte permita
seleccionar una organización de manera auditada.

## Pruebas obligatorias

- Dos organizaciones con el mismo código de producto y la misma placa pueden
  coexistir.
- Un usuario de Organización A no ve ni consulta por UUID registros de B.
- Una venta no puede referenciar cliente, producto o caja de otra organización.
- Un administrador de plataforma no entra a datos de un taller sin seleccionar
  explícitamente una organización y dejar auditoría.
- Backfill conserva el número de registros y relaciones de la instalación
  actual.

## Fase funcional en curso

La fundación ya permite identificar una organización activa en la sesión. La
siguiente fase convierte esa fundación en aislamiento efectivo:

1. Asociar cada entidad operativa a `organization_id` y conservar la cadena de
   relaciones dentro del mismo tenant.
2. Reemplazar los únicos globales por únicos compuestos cuando la columna sea
   obligatoria (por ejemplo, `organization_id + code`, placa y documento).
3. Exigir el contexto de organización resuelto por servidor a cada repositorio,
   consulta, mutación, reporte, notificación e historial de IA.
4. Añadir pruebas cruzadas A/B con PostgreSQL real antes de activar el
   backfill en producción.
5. Exponer la consola de plataforma por separado, sin reutilizar las rutas ni
   el dashboard operativo de un taller.
