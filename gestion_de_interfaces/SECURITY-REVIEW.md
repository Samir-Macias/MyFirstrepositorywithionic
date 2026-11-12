# Informe de revisión de seguridad

**Fecha:** 2026-11-10

**Alcance:** revisión estática del código de la aplicación y sus políticas de acceso a datos. No se verificó la configuración efectiva de Supabase ni una instancia desplegada.

## Hallazgos

### MEDIUM — Un usuario asignado puede apropiarse de una tarea y borrarla

**Estado: corregido en el código; pendiente de aplicar la migración en Supabase.**

- **Archivo:** `supabase/migrations/20261027170000_create_task_tables.sql`, líneas 66-79.
- **Evidencia:** La política `tasks_update_visible` permite actualizar la fila a su creador o al usuario asignado. Su `WITH CHECK` también permite que la fila actualizada tenga al usuario autenticado como `created_by_user_id`. La política `tasks_delete_owned` autoriza el borrado en función de ese campo. Por tanto, un usuario asignado puede cambiar el creador a su propio UUID y luego borrar la tarea.
- **Impacto:** un usuario asignado puede eliminar una tarea creada por otra persona, aunque la interfaz reserve esa acción al creador.
- **Confianza:** 9/10.
- **Corrección:** la migración `supabase/migrations/20261110190000_prevent_task_creator_changes.sql` añade un trigger que rechaza cambios al creador original. El mapper de tareas también omite ese campo en escrituras del cliente; las altas usan el valor predeterminado `auth.uid()` de la base de datos.
- **Validación pendiente:** aplicar la nueva migración en cada entorno Supabase y probar que un usuario asignado no pueda cambiar `created_by_user_id` ni borrar la tarea, mientras conserva las actualizaciones permitidas.

## Limitaciones

El análisis estático no confirma qué migraciones están aplicadas ni qué políticas están activas en la instancia de Supabase desplegada. La revisión de dependencias reportó que `npm audit --omit=dev` no encontró avisos.
