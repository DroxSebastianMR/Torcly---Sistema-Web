# Asistente IA

Ruta: `POST /api/v1/assistant/chat`, requiere sesión y `assistant:read`.

El módulo es estrictamente de lectura: compone agregados autorizados de operaciones y, si corresponde, reabastecimiento. No envía acceso a base de datos, identificadores, clientes, documentos ni herramientas mutantes al proveedor.

## Configuración

En `apps/api/.env`, nunca en la web:

```env
GROQ_API_KEY=tu_clave_autorizada
AI_REQUEST_TIMEOUT_MS=10000
AI_RATE_LIMIT_PER_MINUTE=10
```

`AI_PROVIDER=fake` habilita respuestas deterministas locales; las pruebas usan el proveedor falso. Groq se factura o limita según la cuenta/modelo: configurar alertas de consumo y mantener el límite por usuario. La clave no se registra ni viaja al cliente.
