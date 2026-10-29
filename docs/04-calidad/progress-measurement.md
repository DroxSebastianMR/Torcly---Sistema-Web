# Medición del avance

## Indicador principal

`avance funcional = historias aprobadas / 92 × 100`

Estados permitidos:

- `Pendiente`: no iniciada.
- `En desarrollo`: existe trabajo no validado.
- `En QA`: cumple implementación y está en pruebas.
- `En revisión del usuario`: QA completo, pendiente de aprobación.
- `Aprobada`: el usuario probó el sprint y aceptó la historia.

Solo `Aprobada` suma al porcentaje. El estado inicial auditado es 0/92. Las historias reportadas previamente como hechas se revalidarán dentro de los sprints correspondientes.

## Indicadores secundarios

- flujos críticos aprobados / flujos planificados;
- reglas de negocio verificadas / reglas aplicables;
- endpoints protegidos / endpoints del sprint;
- pruebas automáticas aprobadas;
- defectos abiertos por severidad;
- deuda explícita aceptada para una fase posterior.
