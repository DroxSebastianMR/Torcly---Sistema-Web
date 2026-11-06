# Torcly v2.2.2 — Proveedores, Compras con Kardex, Operaciones Directas, Aforo de Patio (8 Bahías) y Flujo Vehicular Diario

Fecha de lanzamiento: 6 de noviembre de 2026  
Rama base: `develop` -> `main`  
Estado: Desplegada en producción (`main`) con tag `v2.2.2`

---

## 1. Resumen Ejecutivo de la Versión

La versión **v2.2.2** de **Torcly** consolida la operativa física del taller mecánico y la cadena de suministro de repuestos e insumos dentro del ecosistema SaaS. Esta versión incorpora dos sprints de alta complejidad operativa y financiera (**Sprint 29 y Sprint 30**), el nuevo sistema de trazabilidad de **flujo e ingresos vehiculares diarios**, la asignación de la membresía comercial **Corporativa Anual** para el taller en producción (`Grupo Mecatronic`) y una suite de demostración completa.

Principales capacidades entregadas:

1. **Gestión Integral de Proveedores y Registro de Compras (`/compras`, `/proveedores`):**
   - Catálogo formal de proveedores (Persona Natural con DNI / Jurídica con RUC).
   - Órdenes de compra con cálculo en dos filas por ítem (selector de producto de ancho completo + cantidad, costo unitario y subtotal), sin desbordamientos ni scrollbars horizontales.
   - Aprobación y recepción de compras con impacto automático en el inventario y Kardex (`ENTRY`).
2. **Operaciones Directas en Taller (Walk-In sin Cita Previa):**
   - Creación de órdenes de taller inmediatas para vehículos que ingresan sin cita programada previa (`/ordenes-taller`).
   - Registro de kilometraje actual (odómetro) y nivel de combustible en la recepción del vehículo.
3. **Control Físico de Aforo y Capacidad de Patio (Tope de 8 Bahías):**
   - Componente visual interactivo `YardCapacityWidget` que monitorea las 8 bahías simultáneas del taller.
   - Detección de sobrecupo (alerta al alcanzar 8/8) y conteo dinámico de ingresos del día.
4. **Trazabilidad y Bitácora de Flujo Vehicular Diario:**
   - Filtros de turno y fechas en Órdenes de taller (`Hoy`, `Ayer`, `Esta semana`, `Este mes`) y por origen (`Ingreso directo` vs `Con cita previa`).
   - Clic interactivo desde el widget de patio para filtrar al instante los ingresos de la jornada.
   - Bloque analítico de Taller en `Reportes` (`/reportes`) con comparativa de ingresos directos vs citas, flujo de entradas vs salidas (entregas) y exportación a Excel.
   - Refuerzo en `Dashboard` con aforo e ingresos del día.
5. **Estandarización UI Institucional:**
   - Eliminación de iconos decorativos en cabeceras de diálogos modales.
   - DatePicker customizado de Torcly unificado.
   - Skeleton loaders animados reemplazando textos estáticos de carga.
   - Mensajes de error en rojo visible (`#dc2626`).

---

## 2. Detalle de Módulos y Sprints Incluidos

### A. Sprint 29: Proveedores y Compras con Kardex e Inventario (`sprint-29-proveedores-compras`)

- **Módulo de Proveedores (`/proveedores`):**
  - Registro de empresas distribuidoras y proveedores de repuestos (RUC de 11 dígitos, DNI de 8 dígitos, razón social, contacto, teléfono, correo).
  - Estado activo/inactivo con validación estricta en base de datos.
- **Módulo de Compras (`/compras`):**
  - Registro de facturas y guías de compra de repuestos.
  - Formulario ergonómico en dos filas por ítem: fila superior para selección clara de producto y fila inferior para cantidad, costo unitario pactado y subtotal.
  - Eliminación de scrollbars grises en tablas y áreas de observaciones.
  - Estados de compra: `DRAFT`, `CONFIRMED`, `RECEIVED`, `CANCELLED`.
  - Al marcarse como recibida, los repuestos ingresan al stock activo de la organización mediante un movimiento de Kardex de tipo `ENTRY`.

---

### B. Sprint 30: Operaciones Directas y Aforo de Patio (`sprint-30-operaciones-directas-aforo`)

- **Recepción Directa (Walk-in):**
  - Modal `DirectWorkOrderModal` para recibir clientes y vehículos de inmediato sin pasar por el módulo de citas.
  - Origen registrado explícitamente en la orden (`source: 'WALK_IN' | 'APPOINTMENT'`).
  - Odómetro y combustible guardados en la orden y actualizados en la ficha del vehículo.
- **Control de Aforo (Tope de 8 Bahías):**
  - Cálculo en tiempo real de vehículos presentes en el taller (órdenes en etapas `RECEPCIONADA`, `EN_DIAGNOSTICO`, `PENDIENTE_APROBACION`, `APROBADA`, `EN_EJECUCION`, `LISTA_PARA_ENTREGA`).
  - La bahía se libera en el momento exacto en que la orden pasa a `ENTREGADA` (salida del vehículo).
  - Alerta visual amarilla (>= 6 bahías) y roja de patio lleno (8/8 bahías) para coordinar entregas.

---

### C. Módulo de Flujo Vehicular y Reportes Diarios

- **Operativo en vivo (Jornada 8:00 AM – 5:00 PM):**
  - Visualización en cabecera de `Órdenes de taller` y en `Dashboard`.
  - Filtro interactivo en un clic: _"Ingresos de hoy: N (X citas · Y directos)"_.
  - Tabla de órdenes enriquecida con hora de recepción, badge de origen y kilometraje inicial.
- **Analítico Histórico (Cierres diarios, semanales y mensuales):**
  - En `/reportes` (bloque `Taller`), tarjetas e indicadores de:
    - _Vehículos ingresados_ (Total entradas).
    - _Ingresos directos (Walk-in)_ vs _Ingresos con cita previa_.
    - _Vehículos entregados_ (Salidas físicas del taller).
    - _Tiempo promedio de permanencia_ en el taller.
  - Gráficos de barras de entradas vs salidas y desglose por etapa.
  - Exportación de la bitácora completa a Excel.

---

## 3. Configuración de Producción y Semilla Demo

- **Organización Producción:** `Grupo Mecatronic` (`grupo-mecatronic`).
- **Membresía Asignada:** `ENTERPRISE` (Plan Corporativo Anual, cuota máxima de técnicos, miembros y catálogo).
- **Semilla de Demostración (`seed:demo`):**
  - 5 Clientes representativos (Juan Carlos Pérez, María Elena Quispe, Carlos Alberto Mendoza, Transportes y Servicios Rápidos S.A.C., Logística Integral del Sur S.R.L.).
  - 5 Vehículos con kilometraje inicial y placas peruanas (`ABC-123`, `BVF-456`, `XTC-789`, `F4T-890`, `V9K-321`).
  - 5 Técnicos calificados con especialidades (`TEC-001` a `TEC-005`).
  - 5 Productos de alta rotación con stock cargado en Kardex (Aceite 5W-30, Pastillas cerámicas, Filtros blindados, Filtros de aire, Líquido DOT 4).
  - 5 Proveedores automotrices con RUC oficial (Bosch, Mann Filter, Mobil, Brembo, Kyb).
  - 5 Servicios estándar de mano de obra (Cambio de aceite, Alineación 3D, Frenos, Afinamiento, Diagnóstico con escáner).

---

## 4. Auditoría Técnica y Control de Calidad

- **Migraciones de Base de Datos:** 46 migraciones sincronizadas y aplicadas en desarrollo y producción.
- **Typecheck API:** 0 errores (`tsc --noEmit` superado).
- **Typecheck Web:** 0 errores (`tsc -b` superado).
- **Tests API:** 59 suites de pruebas unitarias y de reglas ejecutadas y aprobadas (481 pruebas pasadas).
- **Tests Web:** 100 suites de componentes, integración y formularios aprobadas (484 pruebas pasadas).
- **Cobertura de Estilos:** Prettier y ESLint limpios en todo el monorepo.
