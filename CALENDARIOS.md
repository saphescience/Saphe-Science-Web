# Calendarios de Saphe Science

## Activación en Supabase

1. En **SQL Editor → New query**, ejecuta una vez el archivo
   `supabase/migrations/20261109_academic_calendars.sql`. No modifica tablas ni
   políticas existentes y no carga fechas de ejemplo.
2. En **Authentication → Users**, verifica la identidad y copia el UUID de la
   cuenta real del profesor. No obtengas la lista de autorizados de
   `profiles.role` sin comprobar las cuentas.
3. Sustituye `UUID_VERIFICADO` por ese UUID y ejecuta en SQL Editor:

   ```sql
   insert into saphe_calendar_private.teachers (user_id)
   values ('UUID_VERIFICADO'::uuid)
   on conflict (user_id) do nothing;
   ```

   La cuenta también debe tener el rol `teacher` que exige el panel existente.
   Puedes retirar la autorización borrando únicamente su fila de la lista
   privada. Esa acción no borra los intensivos ya guardados.
4. Recarga la vista previa del profesor. Prueba primero con un borrador. Antes
   de publicar una prueba en el proyecto real, recuerda que sus datos serán
   accesibles desde la API pública incluso sin publicar el código en GitHub.

### Auditoría de roles del resto de la web

El código del panel anterior comprueba `profiles.role`. El repositorio no
contiene el esquema completo ni las políticas desplegadas de `profiles`.
Estas consultas de solo lectura ayudan a revisar permisos existentes:

```sql
select has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
  as authenticated_can_update_role;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';
```

El primer resultado comprueba privilegios, no si RLS permite una actualización
concreta. Revisa también funciones, triggers y permisos indirectos antes de
concluir si el rol anterior puede manipularse. Los intensivos no confían solo
en ese campo: cada operación de gestión exige el UUID autenticado en la lista
privada y comprueba propiedad. No se modifican roles ni permisos anteriores.

## Crear y publicar

1. En el panel del profesor, abre **INTENSIVOS → Crear intensivo**.
2. Completa nombre, tipo, asignatura, nivel, modalidad y fechas de inicio y fin.
   Descripción, máximo de plazas y disponibilidad son opcionales. No incluyas
   nombres de alumnos ni datos personales en la información pública.
3. Indica un horario y pulsa fechas en el calendario para añadir sesiones
   concretas. Para repetir, marca días de la semana y pulsa **Añadir días del
   intervalo**. Puedes ajustar o quitar cualquier sesión después.
4. Guarda como **borrador** o pulsa **Publicar**. Para publicar hace falta al
   menos una sesión. Los conflictos con clases, bloqueos u otros intensivos
   del mismo profesor se avisan sin bloquear.
5. Abre **Cursos → Intensivos** y navega al mes correspondiente. Los días con
   sesiones tienen un punto de color; el fondo azul claro indica el periodo.
   Pulsa una fecha para ver sus sesiones o abre la ficha completa.
6. **Guardar cambios** actualiza un intensivo publicado sin redespliegue.
   **Despublicar** lo devuelve a borrador y **Cancelar intensivo** lo oculta.
   **Eliminar** pide confirmación y borra solo ese intensivo y sus sesiones.

El calendario público consulta Supabase al abrir, cambiar de mes o curso,
volver a la pestaña y pulsar **Actualizar**. No hay retraso de despliegue, pero
una pestaña abierta continuamente no recibe cambios en tiempo real.
La página muestra una sola cuadrícula. Al seleccionar una comunidad, las
fechas escolares verificadas aparecen sobre esa misma cuadrícula, con su
propia leyenda. La edición de intensivos solo está en el panel del profesor.
Las fechas y horas son civiles de **Europe/Madrid**, no se desplazan según la
zona horaria del visitante. No se admiten sesiones que crucen medianoche.
La disponibilidad es manual: no hay reservas ni descuentos automáticos de plazas.

## Cargar el calendario escolar

Un administrador carga en `public.school_calendar_periods` únicamente periodos
verificados. No se cargan fechas por defecto. Por cada fila:

| Campo | Valor |
|---|---|
| `region` | Código de comunidad o ciudad autónoma, por ejemplo `MD` |
| `academic_year` | Año de inicio, por ejemplo `2026` para 2026–2027 |
| `kind` | `teaching`, `non_teaching`, `term_start`, `term_end`, `christmas`, `easter`, `holiday` u `other` |
| `start_date`, `end_date` | Fechas inclusivas verificadas |
| `label_es`, `label_en` | Etiqueta opcional en cada idioma |
| `scope_es`, `scope_en` | Alcance y excepciones: etapa, municipio, centro u otros límites |
| `source_url`, `verified_on` | Enlace HTTPS al documento oficial y fecha real de comprobación |

No marques un intervalo completo como lectivo si contiene fines de semana o
festivos: usa filas por día o tramos verificados. La aplicación no deduce días
lectivos de la ausencia de festivos. El calendario escolar no bloquea
sesiones de la academia.

## Permisos y pruebas

- `intensives` y `intensive_sessions`: lectura pública por RLS solo si el
  intensivo está publicado. Los permisos de columna excluyen el profesor
  responsable y las marcas de tiempo administrativas.
- `school_calendar_periods`: lectura pública de fechas con verificación no
  futura; ninguna escritura para visitantes, alumnos o profesores desde la web.
- `saphe_calendar_private.teachers`: sin acceso de navegador. Las funciones
  autenticadas comprueban autorización y propiedad antes de leer o modificar
  datos privados. Guardado transaccional y control de edición concurrente.
- `tests/academicCalendars.test.mjs`: prueba el SQL en una base efímera con
  PGlite y usuarios ficticios. Se ejecuta con Node pasando como primer
  argumento la ruta absoluta a `@electric-sql/pglite/dist/index.js`.
  PGlite no es una dependencia de la web.

Después de aplicar el SQL falta repetir el flujo con las cuentas reales y
confirmar la lectura del calendario público desde otro navegador.
