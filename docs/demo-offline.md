# Demo offline — Sprints 09 y 10

Esta rama contiene una demo local para presentar las órdenes de taller sin depender de PostgreSQL, Supabase, la API ni la red de la universidad. Se activa exclusivamente al ejecutar `pnpm demo`; el modo normal (`pnpm dev`) conserva la autenticación, permisos y comunicación con la API reales.

## Preparación antes de ir a la universidad

1. En una computadora con acceso a paquetes, instala las dependencias una vez:

   ```sh
   pnpm install
   ```

2. Lleva el repositorio completo en una memoria USB, incluyendo la carpeta `node_modules`, o instala las dependencias en la computadora de presentación antes de desconectarla.
3. No ejecutes `pnpm dev`: ese comando inicia la API y requiere su configuración de base de datos.

## Arranque en la presentación

Desde la raíz del proyecto ejecuta:

```sh
pnpm demo
```

Abre la dirección que muestra Vite, normalmente [http://127.0.0.1:5173](http://127.0.0.1:5173).

Usa solamente estas credenciales de demostración:

| Campo            | Valor               |
| ---------------- | ------------------- |
| Usuario o correo | `demo@torcly.local` |
| Contraseña       | `DemoTorcly2026!`   |

La cuenta **Presentador Torcly** trae todos los permisos de lectura y escritura del sistema. Esto evita denegaciones de rol durante la exposición sin modificar los permisos reales ni la API.

## Datos disponibles

- 3 clientes y 3 vehículos asociados.
- 2 productos con stock, categorías, marcas y unidades; 2 servicios.
- `CITA-000001` atendida y vinculada a `OT-000001`.
- `OT-000001` en **Ejecución**, con presupuesto aprobado, técnico asignado y una actividad completada.
- `CITA-000002` programada, para demostrar el flujo desde Agenda.

## Recorrido recomendado

1. En **Órdenes de taller**, abre `OT-000001`.
2. Registra una actividad y márcala como completada.
3. Registra el consumo de una unidad del filtro Mann; verifica la salida en **Inventario**.
4. Si lo deseas, registra una devolución para mostrar el ajuste de ingreso y vuelve a consumirla.
5. Finaliza el trabajo y registra la entrega. La orden pasa a **Entregada**.
6. Abre **Vehículos** → `ABC123` y verifica el historial técnico de la orden entregada.
7. En **Citas**, abre `CITA-000002` para mostrar una cita programada y el flujo de atención.

## Límites del modo demo

- Los datos viven solo en memoria: al recargar la página o detener `pnpm demo`, se restauran los datos iniciales.
- El adaptador local solo cubre los recorridos de clientes, vehículos, citas, inventario y órdenes de taller necesarios para los Sprints 09 y 10.
- Las solicitudes a endpoints no incluidos fallan de manera local; la demo no intenta conectarse a Internet, a Supabase ni a la API.
