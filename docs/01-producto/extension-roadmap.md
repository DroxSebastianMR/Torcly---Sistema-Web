# Extensión posterior al backlog base

El backlog base de Torcly concluye con 92 historias. Los sprints de este documento son funcionalidades posteriores: no modifican el porcentaje histórico ni declaran aprobado ningún sprint anterior.

## Secuencia propuesta

| Sprint | Rama propuesta                             | Objetivo                                                                           | Dependencia                                    |
| ------ | ------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| 17     | `feature/sprint-17-purchases`              | Compras a proveedor y recepción trazable de existencias.                           | Productos e inventario.                        |
| 18     | `feature/sprint-18-account-notifications`  | Perfil propio, notificaciones operativas y retiro del módulo de códigos de barras. | Auth, auditoría y navegación.                  |
| 19     | `feature/sprint-19-ai-dashboard-assistant` | Asistente conversacional de lectura para consultas y recomendaciones explicables.  | BI, reabastecimiento, permisos y datos reales. |

## Decisiones transversales

1. Cada sprint se implementa y verifica en una rama separada; su acta sigue siendo obligatoria antes de declararlo aprobado.
2. Las compras afectan inventario una sola vez al confirmar la recepción, mediante transacción, idempotencia, auditoría y permiso de servidor.
3. El retiro de **Códigos de barras** significa quitar la ruta, navegación, permisos, endpoint declarado y pantalla del módulo. El campo opcional `Product.barcode` no se elimina: es información comercial ya existente y no equivale al módulo.
4. Perfil y notificaciones no reemplazan la administración de usuarios ni exponen información de otros usuarios.
5. El asistente IA es solo lectura. No crea ventas, citas, pagos, compras, movimientos de inventario ni usuarios; tampoco recibe secretos, tokens, contraseñas, documentos completos ni PII innecesaria.
6. Las claves de proveedor permanecen exclusivamente en `apps/api/.env`; jamás se publican como `VITE_*`, se registran en logs o se agregan al repositorio.

## Proveedor IA recomendado para el MVP

Se recomienda **Groq** para el MVP académico: ofrece una API compatible con el formato de chat de OpenAI y está orientada a respuestas de baja latencia. Su nivel gratuito está sujeto a límites de organización/modelo y puede devolver `429`; por eso el diseño usa un adaptador de proveedor, límite por usuario, timeout, respuesta de reserva y nunca asume que el servicio es ilimitado. [Límites de Groq](https://console.groq.com/docs/rate-limits), [referencia compatible de chat](https://console.groq.com/docs/api-reference).

Gemini es una alternativa válida cuando se priorice contexto amplio, pero su nivel gratuito y elegibilidad cambian por proyecto/cuenta y su contenido gratuito puede ser usado para mejorar productos; no es la primera opción para datos operativos reales sin evaluar esa condición. [Precios y tratamiento del nivel gratuito de Gemini](https://ai.google.dev/gemini-api/docs/pricing?hl=en), [límites de Gemini](https://ai.google.dev/gemini-api/docs/rate-limits?authuser=2).

La primera implementación debe usar `AiProvider`/`GroqProvider`, permitir deshabilitar la función si falta `GROQ_API_KEY` y conservar un proveedor simulado para pruebas. Migrar a otro proveedor no deberá cambiar rutas, permisos ni contratos de la web.
