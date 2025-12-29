# Actualización para n8n v2.1.4

## Cambios Realizados

He actualizado el workflow para que sea compatible con n8n v2.1.4. Los cambios principales son:

### ✅ Problemas Corregidos

1. **Variables de entorno bloqueadas**: n8n 2.1.4 no permite usar `$env` en expresiones por seguridad
2. **Método HTTP del webhook**: Ahora está explícitamente configurado como POST
3. **Configuración del nodo Gemini AI**: URL y API key correctamente separados, usando modelo `gemini-2.5-flash`
4. **TypeVersions**: Actualizados a las versiones más recientes de los nodos
5. **Mapeo de columnas PostgreSQL**: Solo inserta columnas existentes (nombre, email, mensaje, categoria)
6. **Actualización de resumen_ia**: Implementado con stored procedure para manejo seguro de caracteres especiales

### 📝 Archivos Modificados/Creados

- `workflow/workflow-solucion.json` - Workflow actualizado con llamada a stored procedure
- `init-db/02-stored-procedure.sql` - Función PL/pgSQL para actualizar resumen_ia de forma segura

---

## Cómo Usar el Workflow Actualizado

### Paso 0: Crear el Stored Procedure en PostgreSQL

**Primero, ejecuta el stored procedure en la base de datos:**

```bash
docker exec -i estudiantesdb psql -U postgres -d n8n < init-db/02-stored-procedure.sql
```

Este procedimiento almacenado maneja correctamente el escape de caracteres especiales en el resumen de IA.

**Verificar que se creó correctamente:**

```bash
docker exec estudiantesdb psql -U postgres -d n8n -c "\df actualizar_resumen_ia"
```

Deberías ver la función listada.

---

### Paso 1: Eliminar el Workflow Anterior

1. En n8n, ve a **"Workflows"** (menú izquierdo)
2. Busca "Formulario Webhook - Solución Completa"
3. Haz clic en los **tres puntos** → **"Delete"**
4. Confirma la eliminación

### Paso 2: Importar el Workflow Actualizado

1. Haz clic en el menú **☰** (arriba a la izquierda)
2. Selecciona **"Import from file"**
3. Selecciona: `workflow/workflow-solucion.json`
4. Haz clic en **"Import"**

### Paso 3: Configurar Credenciales

El workflow se abrirá automáticamente. Configura las credenciales:

#### PostgreSQL
1. Haz clic en el nodo **"PostgreSQL"** (el primero que dice INSERT)
2. En "Credential to connect with", selecciona **"PostgreSQL Lab"**
3. Haz lo mismo con el segundo nodo PostgreSQL (**"Actualizar Resumen"**)

#### Telegram
1. Haz clic en el nodo **"Telegram"**
2. En "Credential to connect with", selecciona **"Telegram Bot"**

**Nota:** El Chat ID y la API key de Gemini ya están hardcodeadas en el workflow, no necesitas configurarlas.

### Paso 4: Guardar y Publicar

1. Haz clic en **"Save"** (arriba a la derecha)
2. Haz clic en **"Publish"** (botón que apareció)
3. Confirma la publicación

### Paso 5: Probar el Workflow

1. Ve a: **http://localhost:8080**
2. Completa el formulario:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Categoría: Consulta
   - Mensaje: Un mensaje de prueba
3. Haz clic en **"Enviar Formulario"**

### Paso 6: Verificar Resultados

Deberías ver:

✅ **En el navegador:**
- Mensaje de éxito con el ID del registro

✅ **En Telegram:**
- Notificación con todos los datos
- Resumen generado por Gemini AI

✅ **En PostgreSQL:**
```bash
docker exec estudiantesdb psql -U postgres -d n8n -c "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1;"
```

---

## Diferencias con la Versión Anterior

| Aspecto | Versión Anterior | Nueva Versión |
|---------|------------------|---------------|
| **Variables $env** | `{{ $env.GEMINI_API_KEY }}` | API key hardcodeada |
| **Chat ID Telegram** | `{{ $env.TELEGRAM_CHAT_ID }}` | `8412407901` hardcodeado |
| **Webhook Method** | No especificado | `POST` explícito |
| **HTTP Request URL** | URL con expresión | URL limpia + query parameter |
| **TypeVersions** | Antiguas (v1) | Actualizadas (v2-v4) |

---

## Notas Importantes

### Para Laboratorio Educativo
- ✅ Usar API keys hardcodeadas es **ACEPTABLE** para fines educativos
- ✅ Simplifica la configuración para los estudiantes
- ✅ Evita problemas de permisos con variables de entorno

### Para Producción
- ⚠️ En entornos de producción, deberías usar:
  - Credenciales de n8n para almacenar secrets
  - Variables de entorno con permisos específicos configurados
  - Sistemas externos de gestión de secrets (Vault, AWS Secrets Manager, etc.)

---

## Troubleshooting

### Error: "This webhook is not registered for POST requests"
**Solución:** Asegúrate de que el workflow esté **publicado** (no solo guardado).

### Error: "access to env vars denied"
**Solución:** Este error ya no debería aparecer con el workflow actualizado. Si aparece, verifica que importaste el archivo correcto.

### Error: "Invalid URL"
**Solución:** El nuevo workflow tiene la URL correctamente configurada. Si ves este error, elimina el workflow antiguo e importa el nuevo.

### No llega mensaje a Telegram
**Solución:**
1. Verifica que las credenciales "Telegram Bot" estén configuradas
2. Asegúrate de haber enviado `/start` al bot en Telegram
3. Revisa las ejecuciones en n8n para ver errores específicos

---

## Resumen de Comandos Útiles

```bash
# Verificar que n8n esté corriendo
docker ps | grep n8n-lab

# Ver datos en PostgreSQL
docker exec estudiantesdb psql -U postgres -d n8n -c "SELECT * FROM submissions;"

# Probar el formulario
open http://localhost:8080  # Mac
xdg-open http://localhost:8080  # Linux

# Validar el JSON del workflow
cat workflow/workflow-solucion.json | python3 -m json.tool > /dev/null && echo "✓ JSON válido"
```

---

**Última actualización:** 2025-12-29
**Versión del workflow:** v7 (compatible con n8n 2.1.4)
**Modelo Gemini:** gemini-2.5-flash (probado y funcional)
**Base de datos:** Stored procedure para actualización segura del resumen_ia
