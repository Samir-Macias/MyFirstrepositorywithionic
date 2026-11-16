# GitHub Webhook Setup - Guía Completa

## 📋 Resumen
Este documento detalla cómo desplegar y configurar el webhook de GitHub para tu aplicación Taskflow. El webhook actualiza automáticamente el estado de las tareas en Supabase cuando ocurren eventos en GitHub.

---

## ✅ Paso 1: Guardar Secretos en Supabase Panel

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. En la barra lateral izquierda, ve a **Settings > Secrets**
4. Verifica que estos 4 secretos estén configurados:
   - `GITHUB_APP_ID`: Tu GitHub App ID
   - `GITHUB_WEBHOOK_SECRET`: El secret para validar webhooks
   - `GITHUB_INSTALLATION_ID`: Tu Installation ID
   - `GITHUB_PRIVATE_KEY`: Tu clave privada en formato `.pem`

5. **Haz clic en "Save"** para confirmar y almacenar todos los secretos

**✓ Verificación**: Deberías ver una notificación verde de confirmación y los 4 secretos listados en la tabla inferior.

---

## ✅ Paso 2: Función Local Creada

La función ya está creada localmente en:
```
supabase/functions/github-webhook/index.ts
```

### Características implementadas:
- ✓ Validación HMAC-SHA256 de firma de GitHub
- ✓ Verificación de autenticidad de webhooks
- ✓ Actualización automática de estado de tareas
- ✓ Soporte para Pull Requests
- ✓ Soporte para Issues
- ✓ Logging de eventos

---

## ⏳ Paso 3: Desplegar la Función

Tienes dos opciones de despliegue:

### Opción A: Panel de Supabase (RECOMENDADO - MÁS FÁCIL)

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. En la barra lateral izquierda, ve a **Edge Functions**
4. Haz clic en **"Create a new function"**
5. Nombre: `github-webhook`
6. Copia y pega el contenido completo de:
   ```
   supabase/functions/github-webhook/index.ts
   ```
7. Haz clic en **Deploy**

**✓ Verificación**: Deberías ver `github-webhook` en la lista de Edge Functions con estado **✓ ACTIVE**

---

### Opción B: CLI (Requiere Token con Permisos Completos)

Si prefieres usar la línea de comandos:

```bash
# 1. Generar nuevo token en https://app.supabase.com/account/tokens
# Debe tener permisos: projects_read, project_admin_read, functions_admin_write

export SUPABASE_ACCESS_TOKEN="your_full_permissions_token"

# 2. Vincular el proyecto
npx supabase link --project-ref uczwiaqjtmywrdsedunp

# 3. Desplegar la función
npx supabase functions deploy github-webhook --no-verify-jwt
```

---

## 🔧 Configurar Webhook en GitHub

Una vez que la función esté desplegada, debes configurar el webhook en GitHub:

### 1. Obtener la URL del webhook

Ve a Supabase > Edge Functions > github-webhook > Copiar URL de invocación

Formato:
```
https://[tu-proyecto].supabase.co/functions/v1/github-webhook
```

### 2. Configurar en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **Settings > Webhooks**
3. Haz clic en **Add webhook**
4. Configura:
   - **Payload URL**: `https://[tu-proyecto].supabase.co/functions/v1/github-webhook`
   - **Content type**: `application/json`
   - **Secret**: El valor de `GITHUB_WEBHOOK_SECRET`
   - **Events**: 
     - ☑ Pull requests
     - ☑ Issues
   - ☑ Active

5. Haz clic en **Add webhook**

---

## 📊 Mapeo de Estados

La función actualiza automáticamente el estado de las tareas:

### Pull Requests
| Evento | Estado en BD |
|--------|-------------|
| PR opened | `in_progress` |
| PR closed & merged | `completed` |
| PR closed & not merged | `failed` |

### Issues
| Evento | Estado en BD |
|--------|-------------|
| Issue opened | `pending` |
| Issue closed | `completed` |

---

## 🗂️ Estructura de Datos Esperada

La función busca tareas en Supabase con la tabla `tasks`:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  github_pr_number INTEGER,
  github_issue_number INTEGER,
  ...
);
```

**Importante**: Asegúrate de que tus tareas tengan el campo `github_pr_number` o `github_issue_number` para que el webhook las encuentre.

---

## 🧪 Pruebas

### Desde Supabase Console

1. Ve a Edge Functions > github-webhook
2. Haz clic en **Execute**
3. En el body, pega un payload de prueba:

```json
{
  "action": "opened",
  "pull_request": {
    "number": 42,
    "state": "open",
    "title": "Test PR",
    "merged": false
  },
  "repository": {
    "name": "my-repo"
  }
}
```

### Desde Terminal

```bash
curl -X POST https://[tu-proyecto].supabase.co/functions/v1/github-webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=test" \
  -d '{
    "action": "opened",
    "pull_request": {
      "number": 42,
      "state": "open",
      "title": "Test PR",
      "merged": false
    }
  }'
```

---

## 🔍 Monitoreo y Logs

Para ver los logs de tu función:

1. Ve a Supabase > Edge Functions > github-webhook
2. Haz clic en la función
3. Ve a la pestaña **Logs**
4. Los eventos se mostrarán en tiempo real

---

## ⚠️ Solución de Problemas

### "Invalid signature"
- Verifica que `GITHUB_WEBHOOK_SECRET` sea exacto en Supabase
- Asegúrate de que el Secret en GitHub matches el que configuraste

### "No task found for PR #X"
- Verifica que la tarea exista en la tabla `tasks`
- Asegúrate de que el campo `github_pr_number` coincida con el número del PR

### "Missing webhook secret configuration"
- Verifica que `GITHUB_WEBHOOK_SECRET` esté guardado en Supabase Secrets
- Haz clic en "Save" en el panel de secretos

### Error 500
- Revisa los Logs en Supabase Edge Functions
- Verifica que la conexión a Supabase esté correcta

---

## 📝 Notas Importantes

1. **Seguridad**: El token de acceso no se guarda en ningún archivo de código
2. **Automatización**: Los webhooks se procesan automáticamente cuando ocurren eventos
3. **Validación**: Todos los webhooks se validan mediante HMAC-SHA256
4. **Latencia**: Los cambios de estado aparecerán en Supabase en segundos

---

## 🚀 Próximos Pasos

1. ☐ Guardar secretos en Supabase (Paso 1)
2. ☐ Desplegar función (Paso 3 - Opción A o B)
3. ☐ Configurar webhook en GitHub
4. ☐ Crear una tarea de prueba
5. ☐ Crear un PR/Issue en GitHub para verificar
6. ☐ Ver actualización automática en Supabase

---

**Fecha de creación**: 2026-11-16
**Última actualización**: 2026-11-16
