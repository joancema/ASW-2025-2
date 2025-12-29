# Guía del Profesor - Laboratorio n8n

## Información General

Este laboratorio introduce a los estudiantes al concepto de automatización de workflows usando n8n, una herramienta de código abierto que permite crear integraciones complejas de forma visual.

### Objetivos Pedagógicos

- Comprender la arquitectura de workflows basados en eventos
- Aplicar conceptos de integración de sistemas (webhooks, APIs, bases de datos)
- Practicar el manejo de datos asincrónicos y transformaciones
- Implementar validaciones y manejo de errores en pipelines
- Experimentar con servicios de IA modernos (Gemini)

### Nivel
Intermedio - Estudiantes de Ingeniería de Software con conocimientos básicos de:
- APIs REST y HTTP
- Bases de datos SQL
- JSON y manipulación de datos
- Docker (básico)

### Duración Sugerida
**2 horas** (120 minutos) distribuidas así:
- 45 min: Teoría y conceptos
- 15 min: Demostración en vivo
- 45 min: Práctica guiada
- 15 min: Preguntas y troubleshooting

---

## Preparación Antes de la Clase

### 1. Infraestructura

#### PostgreSQL
Asegúrate de que tienes PostgreSQL corriendo y accesible en `localhost:5432`:

```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Si no está corriendo, iniciarlo (reemplaza con tu nombre de contenedor)
docker start estudiantesdb

# Verificar conexión
docker exec estudiantesdb psql -U postgres -c "SELECT version();"
```

#### Crear base de datos n8n (si no existe)

```bash
docker exec estudiantesdb psql -U postgres -c "CREATE DATABASE n8n;"
```

#### Ejecutar el schema inicial

```bash
docker exec -i estudiantesdb psql -U postgres -d n8n < init-db/01-schema.sql
```

### 2. Credenciales de APIs

#### Gemini API
- La API key proporcionada es válida pero tiene límites de uso
- Verifica que funcione antes de la clase:

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB7UEBLyyyB6nCsMLLHlJbusgUfEktD1tU" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hola, responde brevemente"}]
    }]
  }'
```

Si no funciona o prefieres usar tu propia API key:
1. Obtén una en [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Actualiza el `.env`

#### Telegram Bot
El bot ya está configurado. Para crear uno nuevo:

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Envía `/newbot` y sigue las instrucciones
3. Copia el token y actualiza `.env`
4. Para obtener el Chat ID:
   ```bash
   # Envía un mensaje al bot desde tu Telegram
   # Luego ejecuta:
   curl https://api.telegram.org/bot<TU_TOKEN>/getUpdates
   ```
5. Busca `"chat":{"id":XXXXXX}` en la respuesta

### 3. Preparar el Entorno de Demostración

```bash
# Clonar o distribuir el proyecto
cd /path/to/project

# Iniciar n8n
docker-compose up -d

# Verificar que esté corriendo
docker-compose ps
docker-compose logs -f n8n

# Acceder a n8n
open http://localhost:5678
```

### 4. Importar la Solución (para tu referencia)

1. Accede a n8n: http://localhost:5678
2. Login: admin / admin123
3. Click en "Import from File"
4. Selecciona `workflow/workflow-solucion.json`
5. Configura las credenciales (PostgreSQL y Telegram)
6. Activa el workflow

Ahora tienes la solución lista para demostrar.

---

## Estructura de la Clase Sugerida

### Parte 1: Introducción Teórica (45 min)

#### 1.1 ¿Qué es n8n? (10 min)

**Puntos clave:**
- Herramienta de automatización visual (Low-Code)
- Alternativa open-source a Zapier, Make (Integromat)
- Permite conectar APIs, bases de datos, servicios sin código
- Casos de uso: automatización de marketing, pipelines de datos, integraciones empresariales

**Ejemplos reales:**
- Guardar emails de Gmail en Google Sheets
- Enviar alertas de Slack cuando hay errores en logs
- Sincronizar CRM con base de datos

#### 1.2 Conceptos Fundamentals (15 min)

**Workflows:**
- Secuencia de pasos (nodos) que procesan datos
- Activados por triggers (webhook, schedule, manual)
- Flujo de datos de nodo a nodo

**Nodos:**
- **Triggers:** Webhook, Schedule, Manual
- **Actions:** HTTP Request, Database, Email, Telegram
- **Logic:** IF, Switch, Merge, Split
- **Transform:** Set, Function, Code

**Datos:**
- Cada nodo recibe JSON como entrada
- Puede transformar y pasar datos al siguiente
- Acceso a datos con expresiones: `{{ $json.campo }}`

#### 1.3 Arquitectura del Laboratorio (10 min)

Dibuja en la pizarra (o proyecta) el flujo completo:

```
[Formulario Web]
      ↓ (HTTP POST)
[Webhook n8n]
      ↓
[Validar datos] → SI → [Transformar] → [PostgreSQL] → [Gemini] → [Telegram] → [Update DB] → [Respuesta 200]
      ↓
     NO → [Respuesta 400 Error]
```

**Explicar cada componente:**
- Formulario HTML → Cliente que envía datos
- Webhook → Punto de entrada a n8n
- IF → Validación de datos
- Set → Transformación (normalización, timestamps)
- PostgreSQL → Persistencia
- Gemini → Procesamiento con IA
- Telegram → Notificación
- Respond to Webhook → Respuesta al cliente

#### 1.4 Webhooks y APIs (10 min)

**Conceptos:**
- ¿Qué es un webhook? (HTTP callback)
- Diferencia entre webhook y polling
- Anatomía de una request HTTP (method, headers, body)
- Códigos de respuesta HTTP (200, 400, 500)

**Hands-on rápido:**
Muestra en Postman o curl cómo se ve una request al webhook.

---

### Parte 2: Demostración en Vivo (15 min)

**Importante:** Haz una demo completa antes de que los estudiantes empiecen.

#### Demo Script

1. **Mostrar n8n vacío**
   - Crear nuevo workflow
   - Explicar la interfaz

2. **Agregar el webhook**
   - Mostrar cómo configurar el path
   - Explicar "Respond to Webhook"
   - Copiar la URL

3. **Mostrar el formulario HTML**
   - Abrir en navegador
   - Explicar el código JavaScript (fetch)
   - No enviar aún

4. **Agregar nodo IF**
   - Mostrar las expresiones `{{ $json.body.nombre }}`
   - Explicar "is not empty"

5. **Agregar Set de transformación**
   - Mostrar cómo mapear campos
   - Explicar `.toLowerCase()` en email
   - Mostrar `$now.toISO()` para timestamp

6. **Conectar PostgreSQL**
   - Mostrar credenciales configuradas
   - Configurar INSERT
   - Explicar mapeo automático de columnas

7. **HTTP Request a Gemini**
   - Mostrar la URL con API key desde env
   - Explicar el body JSON
   - Mostrar cómo acceder a variables de env: `{{ $env.VARIABLE }}`

8. **Preparar mensaje Telegram**
   - Mostrar el formateo con Markdown
   - Explicar cómo acceder a datos de nodos anteriores: `$('Nombre del Nodo').item.json.campo`

9. **Enviar Telegram**
   - Configurar credenciales
   - Mostrar Parse Mode: Markdown

10. **Update PostgreSQL**
    - Actualizar el resumen_ia

11. **Respond to Webhook (éxito y error)**
    - Mostrar JSON de respuesta
    - Explicar códigos 200 y 400

12. **Guardar y activar**

13. **Probar con el formulario**
    - Enviar datos reales
    - Mostrar el flow de ejecución en n8n
    - Mostrar mensaje en Telegram
    - Verificar en PostgreSQL

---

### Parte 3: Práctica Guiada (45 min)

Los estudiantes siguen la **GUIA-ESTUDIANTE.md** paso a paso.

#### Tu rol durante la práctica:

1. **Circular por el aula**
   - Ayudar con problemas de configuración
   - Verificar que todos tengan n8n corriendo

2. **Problemas comunes que encontrarás:**

   **"No puedo acceder a n8n"**
   - Verificar que el contenedor esté corriendo
   - Verificar puerto 5678 no esté ocupado
   - Revisar logs: `docker-compose logs n8n`

   **"Error al conectar a PostgreSQL"**
   - Verificar network_mode: host en docker-compose
   - Verificar credenciales
   - Verificar que PostgreSQL esté en localhost:5432

   **"El webhook no responde"**
   - Verificar que el workflow esté ACTIVO (toggle verde)
   - Verificar la URL del webhook
   - Revisar errores en la ejecución en n8n

   **"Gemini retorna error"**
   - Verificar la API key
   - Verificar formato del JSON en el body
   - Límite de rate puede estar alcanzado (esperar 1 minuto)

   **"No llega mensaje a Telegram"**
   - Verificar que el bot esté iniciado (/start)
   - Verificar el token y Chat ID
   - Verificar formato Markdown

3. **Checkpoints:**
   - A los 15 min: Todos deben tener n8n corriendo
   - A los 30 min: Todos deben tener el webhook y validación funcionando
   - A los 45 min: Workflow completo funcionando

---

### Parte 4: Q&A y Troubleshooting (15 min)

- Responde preguntas
- Ayuda a los que se quedaron atrás
- Muestra la solución importada si es necesario

---

## Importar la Solución Completa

Si necesitas mostrar la solución o algún estudiante necesita ayuda:

1. En n8n, click en el menú (tres líneas) → **"Import from File"**
2. Selecciona `workflow/workflow-solucion.json`
3. Click en **"Import"**
4. Configura las credenciales:
   - PostgreSQL Lab
   - Telegram Bot
5. Activa el workflow

---

## Evaluación y Seguimiento

### Entregables de los Estudiantes

Los estudiantes deben entregar (ver RUBRICA.md para detalles):

1. Capturas de pantalla del workflow
2. Captura de ejecución exitosa
3. Mensaje de Telegram
4. Consulta SQL mostrando datos
5. Documento de reflexión

### Criterios de Éxito

Un estudiante ha completado exitosamente el laboratorio si:

- ✅ El workflow está activo y funcional
- ✅ El formulario envía datos correctamente
- ✅ Los datos se guardan en PostgreSQL
- ✅ Gemini genera el resumen
- ✅ Llega la notificación a Telegram
- ✅ El webhook responde correctamente (200 OK)
- ✅ El manejo de errores funciona (400 Bad Request)

---

## Extensiones y Variaciones

### Para estudiantes avanzados:

1. **Agregar validación de email con regex:**
   - Usar IF con regex pattern
   - Rechazar emails inválidos

2. **Implementar rate limiting:**
   - Usar nodo Redis o Postgres
   - Contar submissions por IP
   - Rechazar si > 5 en 1 minuto

3. **Agregar envío de email de confirmación:**
   - Usar nodo Email (SMTP)
   - Enviar confirmación al usuario

4. **Dashboard de métricas:**
   - Crear segundo workflow con Schedule trigger
   - Consultar PostgreSQL por estadísticas
   - Enviar resumen diario por Telegram

### Para adaptar a otros contextos:

- **E-commerce:** Procesar órdenes, enviar a fulfillment, notificar cliente
- **IoT:** Recibir datos de sensores, alertar si fuera de rango
- **Marketing:** Sincronizar leads de formulario con CRM y email marketing

---

## Recursos para el Profesor

### Videos recomendados:

- [n8n Tutorial for Beginners](https://www.youtube.com/c/n8n-io)
- [n8n vs Zapier Comparison](https://www.youtube.com/results?search_query=n8n+vs+zapier)

### Documentación oficial:

- [n8n Docs](https://docs.n8n.io/)
- [n8n Workflows Library](https://n8n.io/workflows)
- [Community Forum](https://community.n8n.io/)

### APIs útiles para futuros labs:

- OpenAI (ChatGPT)
- Twilio (SMS)
- SendGrid (Email)
- Google Sheets
- Slack
- Discord
- Notion

---

## Notas Pedagógicas

### Conceptos clave a enfatizar:

1. **Event-Driven Architecture**
   - Los workflows reaccionan a eventos (webhook, schedule)
   - Patrón fundamental en sistemas modernos

2. **Separation of Concerns**
   - Cada nodo tiene una responsabilidad específica
   - Facilita debugging y mantenimiento

3. **Data Transformation**
   - Los datos fluyen y se transforman paso a paso
   - Concepto de pipeline de datos

4. **Error Handling**
   - Importancia de validar entradas
   - Respuestas HTTP apropiadas

5. **Integration Patterns**
   - Webhook para eventos síncronos
   - API calls para servicios externos
   - Database para persistencia

### Conexión con otros cursos:

- **Backend Development:** Webhooks = API endpoints
- **Arquitectura de Software:** Microservicios, integraciones
- **DevOps:** Automatización, CI/CD
- **Bases de Datos:** SQL, transacciones
- **Cloud Computing:** Servicios gestionados, APIs

---

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| n8n no inicia | Verificar puerto 5678 libre, revisar logs |
| No conecta a PostgreSQL | Verificar host: host.docker.internal, credenciales |
| Webhook 404 | Verificar workflow activo, path correcto |
| Gemini error 400 | Verificar formato JSON, API key válida |
| Telegram sin mensaje | Iniciar bot con /start, verificar token |
| Formulario CORS error | n8n permite CORS por defecto, verificar URL |

---

## Feedback y Mejora Continua

Después de impartir el laboratorio:

1. **Encuesta a estudiantes:**
   - ¿Qué fue lo más difícil?
   - ¿Qué mejorarías?
   - ¿Te sientes capaz de usar n8n en proyectos reales?

2. **Autoevaluación:**
   - ¿La demo fue clara?
   - ¿El tiempo fue suficiente?
   - ¿Los problemas técnicos fueron manejables?

3. **Iterar:**
   - Ajustar tiempos
   - Mejorar guías
   - Agregar casos de uso más relevantes

---

¡Éxito con tu clase!

Si tienes sugerencias para mejorar este material, por favor compártelas.
