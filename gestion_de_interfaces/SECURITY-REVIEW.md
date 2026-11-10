# Informe de revisión de seguridad

**Fecha:** 2026-11-10

**Alcance:** revisión estática del código de la aplicación y sus políticas de acceso a datos. No se verificó la configuración efectiva de Supabase ni una instancia desplegada.

## Hallazgos

### MEDIUM — Un usuario asignado puede apropiarse de una tarea y borrarla

- **Archivo:** `supabase/migrations/20261027170000_create_task_tables.sql`, líneas 66-79.
- **Evidencia:** La política `tasks_update_visible` permite actualizar la fila a su creador o al usuario asignado. Su `WITH CHECK` también permite que la fila actualizada tenga al usuario autenticado como `created_by_user_id`. La política `tasks_delete_owned` autoriza el borrado en función de ese campo. Por tanto, un usuario asignado puede cambiar el creador a su propio UUID y luego borrar la tarea.
- **Impacto:** un usuario asignado puede eliminar una tarea creada por otra persona, aunque la interfaz reserve esa acción al creador.
- **Confianza:** 9/10.
- **Recomendación:** impedir que un usuario que solo está asignado modifique `created_by_user_id` y limitar los campos que puede cambiar. Aplicar la restricción en la base de datos, no solo en la interfaz.

## Limitaciones

El análisis estático no confirma qué migraciones están aplicadas ni qué políticas están activas en la instancia de Supabase desplegada. La revisión de dependencias reportó que `npm audit --omit=dev` no encontró avisos.
