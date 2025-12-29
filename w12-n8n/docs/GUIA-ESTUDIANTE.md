# Guía del Estudiante - Laboratorio n8n

## Introducción

Bienvenido al laboratorio práctico de **n8n**, una herramienta de automatización de workflows que te permitirá integrar diferentes servicios y APIs sin escribir código complejo.

### Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

- ✅ Configurar y ejecutar n8n en Docker
- ✅ Crear webhooks para recibir datos externos
- ✅ Implementar validaciones y transformaciones de datos
- ✅ Integrar PostgreSQL para persistencia
- ✅ Consumir APIs de IA (Gemini) mediante HTTP Requests
- ✅ Enviar notificaciones automatizadas con Telegram
- ✅ Manejar errores y respuestas HTTP apropiadamente

### Tiempo Estimado
⏱️ 90-120 minutos

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Docker y Docker Compose instalados
- ✅ PostgreSQL corriendo en `localhost:5432` (ya configurado)
- ✅ Navegador web moderno
- ✅ Cliente de base de datos o `psql` (opcional, para verificar datos)
- ✅ Telegram instalado en tu móvil (para recibir notificaciones)

---

## Paso 1: Iniciar n8n

### 1.1 Verificar archivos del proyecto

Confirma que tienes la siguiente estructura:

```
./
├── docker-compose.yml
├── .env
├── init-db/
│   └── 01-schema.sql
├── test-client/
│   ├── index.html
│   └── styles.css
└── docs/
    └── GUIA-ESTUDIANTE.md (este archivo)
```

### 1.2 Revisar el archivo .env

Abre el archivo `.env` y verifica que las credenciales estén configuradas:

```bash
cat .env
```

Deberías ver las variables de entorno para n8n, PostgreSQL, Gemini y Telegram.

### 1.3 Iniciar el contenedor de n8n

Ejecuta el siguiente comando en la terminal (desde la raíz del proyecto):

```bash
docker-compose up -d
```

Este comando:
- Descarga la imagen de n8n (si no la tienes)
- Inicia el contenedor en modo detached (-d)
- Expone n8n en el puerto 5678

### 1.4 Verificar que n8n esté corriendo

```bash
docker-compose ps
```

Deberías ver algo como:

```
NAME        IMAGE               STATUS
n8n-lab     n8nio/n8n:latest    Up 10 seconds
```

Para ver los logs en tiempo real:

```bash
docker-compose logs -f n8n
```

Presiona `Ctrl+C` para salir de los logs.

---

## Paso 2: Crear la Tabla en PostgreSQL

### 2.1 Conectar a PostgreSQL

Ejecuta el script SQL que crea la tabla `submissions`:

```bash
# Reemplaza "estudiantesdb" con el nombre de tu contenedor PostgreSQL
# Para averiguar el nombre: docker ps | grep postgres

docker exec -i estudiantesdb psql -U postgres -d n8n < init-db/01-schema.sql
```

**Nota:** Si tu contenedor de PostgreSQL tiene otro nombre, reemplaza `estudiantesdb` con el nombre correcto.

### 2.2 Verificar la tabla

Conéctate a PostgreSQL y verifica que la tabla exista:

```bash
docker exec estudiantesdb psql -U postgres -d n8n
```

Dentro de psql, ejecuta:

```sql
\dt
SELECT * FROM submissions;
\q
```

Deberías ver la tabla `submissions` con 3 registros de ejemplo.

---

## Paso 3: Acceder a n8n

### 3.1 Abrir n8n en el navegador

Abre tu navegador y accede a:

```
http://localhost:5678
```

### 3.2 Iniciar sesión

Credenciales (configuradas en el .env):

- **Usuario:** `admin`
- **Contraseña:** `admin123`

### 3.3 Interfaz de n8n

Una vez dentro, verás:
- Panel izquierdo: Lista de workflows
- Área central: Canvas para crear workflows
- Panel derecho: Configuración de nodos

---

## Paso 4: Configurar Credenciales

Antes de crear el workflow, necesitas configurar las credenciales para PostgreSQL y Telegram.

### 4.1 Configurar PostgreSQL

1. En el menú superior derecho, haz clic en tu usuario
2. Selecciona **"Credentials"**
3. Haz clic en **"Add Credential"**
4. Busca y selecciona **"Postgres"**
5. Completa los datos:
   - **Name:** `PostgreSQL Lab`
   - **Host:** `host.docker.internal`
   - **Database:** `n8n`
   - **User:** `postgres`
   - **Password:** `MysecretPassword`
   - **Port:** `5432`
   - **SSL:** `disabled`
6. Haz clic en **"Test Connection"** para verificar
7. Guarda con **"Save"**

### 4.2 Configurar Telegram

1. En **"Credentials"**, haz clic en **"Add Credential"**
2. Busca y selecciona **"Telegram API"**
3. Completa:
   - **Name:** `Telegram Bot`
   - **Access Token:** `8491732916:AAFtLJooAImrdPniePxB6RFd8q7cHyLuslg`
4. Guarda con **"Save"**

**Nota:** Este bot ya está creado y configurado. El Chat ID es `8412407901`.

---

## Paso 5: Crear el Workflow Paso a Paso

Ahora crearemos el workflow completo. Sigue estos pasos cuidadosamente.

### 5.1 Crear un nuevo Workflow

1. En el panel izquierdo, haz clic en **"+ Add Workflow"**
2. Dale un nombre: `Formulario Webhook`

### 5.2 Nodo 1: Webhook (Recibir datos)

1. Haz clic en el botón **"+ Add first step"**
2. Busca **"Webhook"** y selecciónalo
3. Configura:
   - **HTTP Method:** `POST`
   - **Path:** `form-submission`
   - **Response Mode:** `Respond to Webhook`
4. Copia la **Webhook URL** (algo como `http://localhost:5678/webhook/form-submission`)
5. Haz clic fuera del panel para cerrar la configuración

### 5.3 Nodo 2: IF (Validar datos)

1. Haz clic en el **+** después del nodo Webhook
2. Busca **"IF"** y selecciónalo
3. Configura las condiciones:
   - **Condition 1:**
     - **Value 1:** `{{ $json.body.nombre }}`
     - **Operation:** `is not empty`
   - Haz clic en **"Add Condition"**
   - **Condition 2:**
     - **Value 1:** `{{ $json.body.email }}`
     - **Operation:** `is not empty`
4. Cierra la configuración

**Explicación:** Este nodo valida que `nombre` y `email` no estén vacíos. Si pasan, sigue por la rama **true**; si fallan, va a la rama **false**.

### 5.4 Nodo 3: Set (Transformar datos) - Rama TRUE

1. En la salida **true** del IF, haz clic en el **+**
2. Busca **"Set"** y selecciónalo
3. Renombra el nodo a: `Transformar Datos`
4. Configura los valores:
   - **Keep Only Set:** `false`
   - Haz clic en **"Add Value"** → **String**
     - **Name:** `nombre`
     - **Value:** `{{ $json.body.nombre }}`
   - **Add Value** → **String**
     - **Name:** `email`
     - **Value:** `{{ $json.body.email.toLowerCase() }}`
   - **Add Value** → **String**
     - **Name:** `mensaje`
     - **Value:** `{{ $json.body.mensaje }}`
   - **Add Value** → **String**
     - **Name:** `categoria`
     - **Value:** `{{ $json.body.categoria }}`
   - **Add Value** → **String**
     - **Name:** `timestamp`
     - **Value:** `{{ $now.toISO() }}`
5. Cierra la configuración

**Explicación:** Este nodo transforma los datos del webhook, normaliza el email a minúsculas y agrega un timestamp.

### 5.5 Nodo 4: PostgreSQL (Insertar registro)

1. Después de **Transformar Datos**, haz clic en el **+**
2. Busca **"Postgres"** y selecciónalo
3. Configura:
   - **Credential:** Selecciona `PostgreSQL Lab`
   - **Operation:** `Insert`
   - **Table:** `submissions`
   - **Columns:** `nombre, email, mensaje, categoria`
   - Los valores se mapean automáticamente desde el nodo anterior
4. Cierra la configuración

**Explicación:** Inserta los datos en la tabla `submissions` de PostgreSQL.

### 5.6 Nodo 5: HTTP Request (Llamar a Gemini AI)

1. Después de **PostgreSQL**, haz clic en el **+**
2. Busca **"HTTP Request"** y selecciónalo
3. Renombra a: `Gemini AI`
4. Configura:
   - **Method:** `POST`
   - **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}`
   - **Send Body:** `true`
   - **Body Content Type:** `JSON`
   - **Specify Body:** `Using JSON`
   - **JSON/RAW Parameters:** Haz clic en **"Add Parameter"**
     - **Name:** `contents`
     - **Value:**
       ```json
       [{"parts": [{"text": "Resume en máximo 2 líneas el siguiente mensaje de categoría '{{ $json.categoria }}': {{ $json.mensaje }}"}]}]
       ```
5. Cierra la configuración

**Explicación:** Llama a la API de Gemini para generar un resumen del mensaje del usuario.

### 5.7 Nodo 6: Set (Preparar mensaje de Telegram)

1. Después de **Gemini AI**, haz clic en el **+**
2. Busca **"Set"** y selecciónalo
3. Renombra a: `Preparar Telegram`
4. Configura:
   - **Add Value** → **String**
     - **Name:** `resumen_ia`
     - **Value:** `{{ $json.candidates[0].content.parts[0].text }}`
   - **Add Value** → **String**
     - **Name:** `mensaje_telegram`
     - **Value:** (copia exactamente este texto)
       ```
       📬 *Nueva Submission Recibida*

       👤 *Nombre:* {{ $('Transformar Datos').item.json.nombre }}
       ✉️ *Email:* {{ $('Transformar Datos').item.json.email }}
       📁 *Categoría:* {{ $('Transformar Datos').item.json.categoria }}

       💬 *Mensaje:*
       {{ $('Transformar Datos').item.json.mensaje }}

       🤖 *Resumen IA:*
       {{ $json.resumen_ia }}

       ⏰ {{ $('Transformar Datos').item.json.timestamp }}
       ```
5. Cierra la configuración

**Explicación:** Extrae el resumen de Gemini y formatea un mensaje bonito para Telegram.

### 5.8 Nodo 7: Telegram (Enviar notificación)

1. Después de **Preparar Telegram**, haz clic en el **+**
2. Busca **"Telegram"** y selecciónalo
3. Configura:
   - **Credential:** Selecciona `Telegram Bot`
   - **Resource:** `Message`
   - **Operation:** `Send Message`
   - **Chat ID:** `{{ $env.TELEGRAM_CHAT_ID }}`
   - **Text:** `{{ $json.mensaje_telegram }}`
   - Haz clic en **"Add Field"** → **Additional Fields**
     - **Parse Mode:** `Markdown`
4. Cierra la configuración

**Explicación:** Envía el mensaje formateado a tu chat de Telegram.

### 5.9 Nodo 8: PostgreSQL (Actualizar resumen)

1. Después de **Telegram**, haz clic en el **+**
2. Busca **"Postgres"** y selecciónalo
3. Renombra a: `Actualizar Resumen`
4. Configura:
   - **Credential:** `PostgreSQL Lab`
   - **Operation:** `Update`
   - **Table:** `submissions`
   - **Update Key:** `id`
   - **Columns:** `resumen_ia`
   - Los valores se mapean del nodo **Preparar Telegram**
5. Cierra la configuración

**Explicación:** Actualiza el registro en PostgreSQL con el resumen generado por IA.

### 5.10 Nodo 9: Respond to Webhook (Respuesta de éxito)

1. Después de **Actualizar Resumen**, haz clic en el **+**
2. Busca **"Respond to Webhook"** y selecciónalo
3. Renombra a: `Respuesta Éxito`
4. Configura:
   - **Respond With:** `JSON`
   - **Response Body:**
     ```json
     {
       "success": true,
       "mensaje": "Formulario procesado exitosamente",
       "id": "{{ $('PostgreSQL').item.json.id }}",
       "timestamp": "{{ $('Transformar Datos').item.json.timestamp }}"
     }
     ```
   - **Response Code:** `200`
5. Cierra la configuración

**Explicación:** Responde al cliente del webhook con un JSON de éxito.

### 5.11 Nodo 10: Respond to Webhook (Respuesta de error) - Rama FALSE

1. Vuelve al nodo **IF**
2. En la salida **false** (abajo), haz clic en el **+**
3. Busca **"Respond to Webhook"** y selecciónalo
4. Renombra a: `Respuesta Error`
5. Configura:
   - **Respond With:** `JSON`
   - **Response Body:**
     ```json
     {
       "success": false,
       "error": "Campos requeridos faltantes: nombre y email son obligatorios"
     }
     ```
   - **Response Code:** `400`
6. Cierra la configuración

**Explicación:** Si la validación falla, responde con un error HTTP 400.

### 5.12 Guardar y Activar el Workflow

1. En la esquina superior derecha, haz clic en **"Save"**
2. Activa el workflow con el toggle **"Active"** (debe ponerse en verde)

---

## Paso 6: Probar con el Formulario

### 6.1 Abrir el formulario de prueba

Abre el archivo `test-client/index.html` en tu navegador:

```bash
open test-client/index.html
# o en Linux/WSL:
xdg-open test-client/index.html
```

### 6.2 Completar el formulario

Llena los campos:

- **Nombre:** Tu nombre
- **Email:** tu-email@ejemplo.com
- **Categoría:** Consulta
- **Mensaje:** Este es un mensaje de prueba para el laboratorio de n8n.

### 6.3 Enviar

Haz clic en **"Enviar Formulario"**.

Deberías ver:
- El estado cambia a "Enviando..."
- Luego a "Éxito" con un mensaje verde
- El estado del webhook en la página se actualiza

### 6.4 Verificar en Telegram

Abre Telegram en tu móvil. Deberías recibir un mensaje del bot con:
- Nombre, email, categoría
- El mensaje completo
- Un resumen generado por Gemini AI
- Timestamp

### 6.5 Verificar en PostgreSQL

Conéctate a PostgreSQL:

```bash
docker exec estudiantesdb psql -U postgres -d n8n
```

Ejecuta:

```sql
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1;
```

Deberías ver tu registro con el `resumen_ia` completado.

---

## Paso 7: Depuración y Troubleshooting

### Ver ejecuciones en n8n

1. En n8n, haz clic en **"Executions"** en el menú izquierdo
2. Verás todas las ejecuciones del workflow
3. Haz clic en una para ver el flujo de datos en cada nodo
4. Revisa los datos de entrada y salida de cada paso

### Problemas Comunes

#### Error: "Webhook not found"

**Solución:** Verifica que el workflow esté **activo** (toggle verde) y que la URL del webhook sea correcta.

#### Error: "Database connection failed"

**Solución:**
- Verifica que PostgreSQL esté corriendo: `docker ps | grep postgres`
- Revisa las credenciales en n8n
- Verifica que el host sea `host.docker.internal` (no `localhost`)
- Prueba la conexión: `docker exec n8n-lab ping -c 1 host.docker.internal`

#### No llega mensaje a Telegram

**Solución:**
- Verifica que el bot token sea correcto
- Asegúrate de haber iniciado el bot en Telegram (envía `/start` al bot)
- Revisa el Chat ID en las variables de entorno

#### Error de Gemini: "API key not valid"

**Solución:**
- Verifica que la variable `GEMINI_API_KEY` esté en el .env
- Reinicia el contenedor: `docker-compose restart n8n`
- Revisa que la URL de Gemini sea correcta

#### El formulario no se conecta

**Solución:**
- Verifica que n8n esté corriendo en el puerto 5678
- Abre las herramientas de desarrollador del navegador (F12) → Console
- Revisa si hay errores de CORS o red

---

## Entregables del Laboratorio

Para completar el laboratorio, debes entregar:

1. **Captura de pantalla del workflow completo** en n8n (vista del canvas con todos los nodos)

2. **Captura de una ejecución exitosa** mostrando el flujo de datos

3. **Captura del mensaje recibido en Telegram**

4. **Consulta SQL mostrando los registros en PostgreSQL:**
   ```sql
   SELECT id, nombre, email, categoria, resumen_ia, created_at
   FROM submissions
   ORDER BY created_at DESC
   LIMIT 5;
   ```

5. **Documento breve (1-2 páginas)** respondiendo:
   - ¿Qué ventajas tiene usar n8n vs. programar todo en código?
   - ¿Cómo mejorarías este workflow?
   - ¿Qué otros casos de uso se te ocurren para n8n?

---

## Desafíos Adicionales (Opcional)

Si terminaste temprano, intenta:

- ✨ Agregar un filtro para rechazar emails que no sean del dominio `@uleam.edu.ec`
- ✨ Enviar un email de confirmación al usuario (usando nodo de Email)
- ✨ Agregar un nodo para guardar los datos también en Google Sheets
- ✨ Implementar un límite de rate limiting (máximo 5 submissions por minuto)
- ✨ Crear un segundo workflow que envíe un resumen diario de todas las submissions

---

## Recursos Adicionales

- [Documentación oficial de n8n](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

¡Éxito en tu laboratorio!

Si tienes problemas, consulta con tu profesor o revisa la sección de Troubleshooting.
