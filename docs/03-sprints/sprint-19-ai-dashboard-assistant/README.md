# Sprint 19 - Asistente IA del dashboard

Rama objetivo: `feature/sprint-19-ai-dashboard-assistant`  
Base requerida: Sprint 18 implementado y BI con datos reales  
Estado: **Planificado; no iniciado.**

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
