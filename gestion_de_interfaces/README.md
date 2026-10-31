# Taskflow — gestión de tareas multi-organización

## 1. Qué hace esta app

Taskflow es una aplicación web (Ionic + Angular) para gestionar tareas en equipo. Cada usuario trabaja dentro de una **organización** y el contenido que ve depende de su rol.

| Rol | Qué puede hacer |
|---|---|
| `USER` (usuario estándar) | Crear, editar, cambiar de estado y eliminar sus tareas; ver el calendario; ver la actividad **de sus tareas** (creadas o asignadas). |
| `CORP_ADMIN` (admin de organización) | Todo lo anterior, más: añadir y eliminar usuarios de su organización, invitar correos aún no registrados, asignar/desasignar tareas y ver **toda** la actividad de su organización. |
| `SUPER_ADMIN` | Panel global: crear, modificar (nombre y slug) y eliminar organizaciones, ver cuántas hay y cuántos usuarios tiene cada una, con el detalle de sus miembros. |

Funciones principales:

- **Cuadro de Mando** (`/workspace`): estadísticas, gráficos (Chart.js), tabla de tareas con búsqueda y filtros, panel de actividad reciente y, para admins, panel de equipo.
- **Calendario** (`/workspace/calendar`) de fechas límite.
- **Gestión de Equipo** (`/workspace/team-management`, solo admin de organización).
- **Actividad** (`/workspace/activity-feed`): historial completo con alcance según rol y actualización en tiempo real.
- **Panel Global** (`/admin/super-panel`, solo super admin).
- Exportación de informes a CSV y PDF.
- Modo noche, registro e inicio de sesión con Supabase Auth.

Decisiones de comportamiento a tener en cuenta:

- **Añadir usuario:** si el correo ya tiene cuenta, se vincula al instante; si no, queda como *invitación pendiente* y se une a la organización cuando se registre con ese correo.
- **Eliminar usuario:** lo saca de la organización, no borra su cuenta. Sus tareas asignadas por otros quedan sin asignar.
- **Eliminar una organización:** sus miembros pasan a usuarios estándar sin organización.

## 2. Cómo probarlo

### Requisitos

- Node.js 20 o superior y npm.
- Un proyecto de [Supabase](https://supabase.com) (gratuito sirve).

### Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Configura Supabase. Copia `src/assets/supabase-config.example.json` a `src/assets/supabase-config.json` y rellena la URL del proyecto y la clave pública (`anon` / `publishable`).

3. Crea la base de datos: en el **SQL Editor** de Supabase ejecuta, **en orden**, todos los archivos de [`supabase/migrations/`](supabase/migrations):

   1. `20261027170000_create_task_tables.sql`
   2. `20261027175000_restrict_activity_log_inserts.sql`
   3. `20261029090000_add_task_due_date.sql`
   4. `20261029104500_enable_activity_logs_realtime.sql`
   5. `20261031133000_create_organizations_and_admin_rpc.sql`
   6. `20261031144000_sync_auth_users_to_profiles.sql`
   7. `20261031160000_organization_admin_features.sql`

   > La tabla `public.profiles` debe existir antes de las migraciones de organizaciones (`id`, `email`, `full_name`, `role`, `created_at`, `organization_id`, con una restricción `check_valid_role` que admita `SUPER_ADMIN`, `CORP_ADMIN` y `STANDARD_USER`).

4. Arranca la app:

   ```bash
   npm start
   ```

   Abre <http://localhost:4200>.

### Crear el super admin

1. Regístrate desde `/register` con el correo que será super admin (confirma el correo si Supabase lo exige).
2. Promociónalo con la clave de servicio, solo desde tu máquina:

   ```bash
   SUPABASE_URL="https://TU-PROYECTO.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="tu-service-role" \
   npm run set-super-admin -- correo@ejemplo.com
   ```

3. Cierra sesión y vuelve a entrar: el rol se lee de la sesión.

### Recorrido de prueba sugerido

1. **Super admin:** en `/admin/super-panel` crea una organización indicando el correo de un usuario ya registrado como administrador. Comprueba los contadores, "Ver usuarios", "Modificar" y "Eliminar".
2. **Admin de organización:** cierra sesión y entra con ese usuario (la primera vez, vuelve a iniciar sesión para que reciba el rol). En el Cuadro de Mando:
   - añade un miembro existente (se vincula) y otro con un correo sin cuenta (queda pendiente);
   - crea una tarea y asígnala desde la columna **Responsable**; desasígnala con "Sin asignar";
   - elimina un miembro y confirma que desaparece del equipo.
3. **Usuario estándar:** regístrate con el correo invitado y comprueba que entra en la organización. Verifica que solo ve sus tareas y, en **Actividad**, solo los eventos de ellas.
4. **Admin otra vez:** en **Actividad** debe ver los eventos de todos los miembros.

## 3. Cómo se construyó

**Pila tecnológica**

- Angular 22 con componentes *standalone* y *signals*, e Ionic 9 (Capacitor para móvil).
- Supabase: Auth, PostgreSQL, Row Level Security (RLS), funciones RPC y Realtime.
- Chart.js para los gráficos; jsPDF + autotable para los informes PDF.
- Pruebas con el *runner* de `ng test` (Vitest).

**Estructura (`src/app`)**

```
auth/                     login y registro
core/
  auth/                   AuthService, guards de sesión y rol
  models/                 modelos de tareas, actividad y organizaciones
  services/               organizaciones, perfiles/equipo, informes
  tasks/                  TaskDataService (tareas, asignación, actividad)
  supabase/               cliente de Supabase configurado en tiempo de ejecución
features/
  admin/super-panel/      panel global
  calendar/               calendario
  workspace/              activity-feed, team-management
home/                     Cuadro de Mando
shared/components/        tabla de datos, tarjetas, gráficos
supabase/migrations/      esquema, RLS y funciones SQL
```

**Seguridad: la autorización vive en la base de datos**

- El rol de la interfaz se lee de `app_metadata` del JWT y las rutas se protegen con guards (`authGuard`, `roleActivateGuard`). Esto solo mejora la experiencia; la protección real es la de la base de datos.
- Cada tabla tiene RLS. Un `CORP_ADMIN` accede a las tareas y la actividad de su organización mediante funciones `SECURITY DEFINER` (`current_admin_organization_id`, `task_in_admin_organization`, …).
- Las operaciones sensibles son RPC que validan el rol dentro de la función: `add_organization_member`, `remove_organization_member`, `cancel_organization_invitation`, `assign_task`, `delete_organization`, `create_organization_with_admin`.
- Un trigger impide que el cliente cambie `role` u `organization_id` de un perfil, para evitar escaladas de privilegios.
- Un trigger sobre `profiles` mantiene sincronizado `app_metadata` con el rol, y otro crea el perfil al registrarse (aplicando la invitación pendiente si existe).
- El historial de actividad lo escribe un trigger sobre `tasks`; los clientes no pueden insertar en `activity_logs`.

## 4. Cómo verificarlo

### Pruebas automáticas

```bash
npm test -- --watch=false
```

Cubren servicios (tareas, organizaciones, equipo), tabla con asignación, Cuadro de Mando, feed de actividad, panel global y registro.

Para una sola prueba:

```bash
npm test -- --watch=false --include='src/app/home/home.page.spec.ts'
```

### Compilación y estilo

```bash
npm run build
npm run lint
```

La compilación de producción respeta los límites de tamaño configurados en `angular.json`.

### Verificar la seguridad en Supabase

Con dos cuentas (un admin de organización y un usuario estándar):

- El usuario estándar **no** ve tareas ni actividad ajenas en la app.
- Desde la consola del navegador, un usuario estándar que intente `update` de su `role` u `organization_id` en `profiles` recibe un error de permisos.
- Un admin que intente asignar una tarea a alguien de otra organización recibe el error "Solo puedes asignar tareas a usuarios de tu organización".
- Un admin no puede eliminarse a sí mismo ni a otro administrador de la organización.

### Problemas frecuentes

- **No carga la configuración de Supabase:** falta `src/assets/supabase-config.json` o contiene valores de ejemplo.
- **Un admin no ve las opciones de admin:** cierra sesión y vuelve a entrar para que se actualice el rol.
- **Error `check_valid_role`:** la restricción de `profiles.role` no admite `STANDARD_USER`; revisa su definición.
- **Registro sin recibir correo:** puede ser la confirmación de correo de Supabase o que la cuenta ya exista.
