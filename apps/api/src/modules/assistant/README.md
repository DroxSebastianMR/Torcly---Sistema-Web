# Asistente IA

Ruta: `POST /api/v1/assistant/chat`, requiere sesión y `assistant:read`.

El chat persiste las preguntas y respuestas por usuario en conversaciones privadas. `GET /api/v1/assistant/conversations` lista las conversaciones propias y `GET /api/v1/assistant/conversations/:id` devuelve sus mensajes. Ningún usuario puede consultar el historial de otro.

La persistencia requiere aplicar la migración `20261026000000_add_assistant_conversation_history`.

El módulo es estrictamente de lectura: compone el resumen y hasta 10 elementos relevantes de cada sección operativa autorizada (citas, órdenes, ventas, saldos e inventario), además del reabastecimiento cuando corresponde. Así puede contestar seguimientos como «¿cuáles son?» sin reenviar la base de datos completa. No entrega acceso a la base de datos, identificadores internos, documentos ni herramientas mutantes al proveedor.

## Configuración

En `apps/api/.env`, nunca en la web:

```env
GROQ_API_KEY=tu_clave_autorizada
AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-20b
AI_REQUEST_TIMEOUT_MS=12000
AI_RATE_LIMIT_PER_MINUTE=8
AI_MAX_OUTPUT_TOKENS=350
```

`GROQ_MODEL` y `AI_MAX_OUTPUT_TOKENS` permiten ajustar costo y latencia sin modificar el código. La clave nunca debe usar el prefijo `VITE_` ni incluirse en la web.

`AI_PROVIDER=fake` habilita respuestas deterministas locales; las pruebas usan el proveedor falso. Groq se factura o limita según la cuenta/modelo: configurar alertas de consumo y mantener el límite por usuario. La clave no se registra ni viaja al cliente.
