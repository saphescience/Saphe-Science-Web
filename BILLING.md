# Facturación por alumno

## Activación

1. Ejecutar una sola vez `supabase/migrations/20261103_student_billing_settings.sql`
   en el SQL Editor del proyecto Supabase correspondiente a esta web.
2. Comprobar con una cuenta real de profesor que puede guardar y volver a cargar
   la tarifa y el pagador de un alumno propio. Un alumno y otro profesor no deben
   poder acceder a esos datos.
3. Publicar el frontend después de comprobar la migración.

La migración crea únicamente `student_billing_settings`, sus permisos y sus
policies. No modifica las tablas o policies existentes. El borrado de un alumno
elimina automáticamente su configuración de facturación mediante la foreign key.

## Cálculo

- Se incluyen todas las clases asignadas al alumno en el mes, también las futuras.
- Se excluyen los bloqueos (`type = 'unavailable'`).
- Cada importe se calcula desde la duración real y la tarifa actual del alumno,
  en euros. Se redondea a céntimos por clase y después se suman las líneas.
- La tarifa es única por alumno: cambiarla recalcula los resúmenes de cualquier
  mes. Todavía no existen tarifas históricas, facturas emitidas ni cierres mensuales.
- No se aplican impuestos ni se genera un documento fiscal. El botón de descarga
  permanece desactivado hasta configurar la facturación definitiva.
- Sin tarifa o con horarios inválidos no se presenta un total monetario engañoso.
- El pagador es por ahora solo un nombre; los datos fiscales se configurarán después.

No se guardan estos datos en localStorage ni se utilizan claves administrativas.
Las clases se consultan por profesor, alumno y año con paginación.

## Pruebas

`node --test tests/billingMath.test.mjs`

Las pruebas de navegador durante la implementación usan Supabase simulado. La
migración y las policies deben comprobarse en el proyecto Supabase real antes de publicar.
