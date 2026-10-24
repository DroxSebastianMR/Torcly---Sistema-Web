# Sprint 19 - Asistente IA del dashboard

Rama objetivo: `feature/sprint-19-ai-dashboard-assistant`  
Base requerida: Sprint 18 implementado y BI con datos reales  
Estado: **Implementado; listo para prueba del usuario.**

## Objetivo

Incorporar un chat de consulta en el dashboard para explicar indicadores y recomendar próximos pasos a partir de un contexto operativo mínimo, verificable y autorizado.

## Alcance del MVP

- Panel de chat accesible desde Dashboard para usuarios con `assistant:read`.
- Preguntas de solo lectura: ventas, caja, stock bajo, citas, órdenes, compras y recomendaciones de reabastecimiento existentes.
- API genera un resumen estructurado y autorizado por servidor; el modelo recibe agregados, período, filtros y referencias de módulos, no acceso directo a PostgreSQL.
- Respuestas incluyen procedencia: período, `generatedAt`, fuentes/módulos consultados y aclaración de que son orientación, no hechos no verificados.
- Conversación breve por usuario/sesión, historial limitado, límite de entrada/salida, timeout, rate limit y feedback para proveedor no configurado/saturado.
- Adaptador `AiProvider`, implementación `GroqProvider` y fake determinista para pruebas. `GROQ_API_KEY` vive solo en API.

## Decisiones obligatorias

1. Groq es la primera opción del MVP por latencia y compatibilidad de chat, pero su nivel gratuito está limitado. El sistema maneja `429`, timeout e indisponibilidad sin bloquear el dashboard.
2. La IA no ejecuta acciones, no llama endpoints mutantes ni recibe poderes para modificar registros.
3. El backend compone el contexto tras aplicar permisos; jamás se delega la autorización al prompt ni se expone PII/secretos completos.
4. La IA no es fuente de verdad. Cada recomendación debe señalar los datos que la sustentan o responder que no hay evidencia suficiente.
5. No incluir clave ni SDK de Groq en la web; no registrar prompts/respuestas completas si contienen datos operativos sensibles.

## Fuera de alcance

- Agentes autónomos, herramientas de escritura, envío de mensajes, voz, archivos, RAG documental externo, entrenamiento/fine-tuning y garantías médicas/financieras.

## Entregables

- API de consulta asistida, proveedor abstraído, contexto mínimo, rate limiting y auditoría sanitizada.
- Chat web con historial de sesión, estados accesibles y enlaces a módulos fuente.
- Configuración documentada sin secretos, pruebas fake y guía de operación/costo.

## Implementación

- API bajo `/api/v1/assistant/chat`, protegido por `assistant:read`, con entrada máxima de 800 caracteres, límite por usuario, timeout y errores seguros para falta de proveedor, cuota e indisponibilidad.
- `AiProvider` abstrae `GroqProvider` y `FakeProvider`. Groq se invoca desde el servidor por `fetch`; la clave únicamente se lee desde `apps/api/.env`.
- El contexto procede del read-model de Operaciones y de recomendaciones de reabastecimiento solo si el usuario puede consultar inventario. Contiene agregados, período, fecha de generación y rutas fuente; no incluye clientes, documentos, identificadores internos ni acceso a PostgreSQL.
- El panel está integrado al Dashboard, es accesible, mantiene respuesta, carga, vacío, error y restricciones de permisos. Muestra procedencia enlazable y rechaza solicitudes operativas.

## Configuración y costo

Definir `GROQ_API_KEY` solo en `apps/api/.env`. Opcionalmente se puede ajustar `AI_REQUEST_TIMEOUT_MS` (por defecto 10 s) y `AI_RATE_LIMIT_PER_MINUTE` (por defecto 10). Para pruebas locales, `AI_PROVIDER=fake` evita cualquier llamada externa. Groq puede devolver cuota `429`; la aplicación no reintenta automáticamente ni expone detalle de proveedor. Consultar y configurar límites/costo directamente en la cuenta autorizada de Groq antes de operar con datos reales.
