# Rúbrica de Evaluación - Laboratorio n8n

## Información General

- **Nombre del Laboratorio:** Automatización de Workflows con n8n
- **Curso:** Ingeniería de Software
- **Puntuación Total:** 100 puntos
- **Puntos de Bonus:** +10 puntos adicionales

---

## Criterios de Evaluación

### 1. Configuración y Setup (15 puntos)

| Criterio | Excelente (15) | Bueno (10) | Suficiente (5) | Insuficiente (0) |
|----------|---------------|------------|----------------|------------------|
| **Entorno de trabajo** | n8n correctamente iniciado, PostgreSQL conectado, todas las credenciales configuradas | n8n funcionando, alguna credencial faltante | n8n iniciado pero con errores de configuración | No logró iniciar n8n |
| **Evidencia** | Captura de n8n activo + captura de credenciales configuradas | Solo captura de n8n activo | Captura incompleta | Sin evidencia |

**Puntos:** _____/15

---

### 2. Nodo Webhook - Recepción de Datos (15 puntos)

| Criterio | Excelente (15) | Bueno (10) | Suficiente (5) | Insuficiente (0) |
|----------|---------------|------------|----------------|------------------|
| **Configuración del webhook** | Webhook configurado correctamente con path `/form-submission`, Response Mode en "Respond to Webhook" | Webhook funcional pero con configuración incompleta | Webhook creado pero no funciona | No implementó webhook |
| **Recepción de datos** | Recibe correctamente todos los campos del formulario (nombre, email, mensaje, categoría) | Recibe algunos campos con errores menores | Recibe datos parcialmente | No recibe datos |

**Puntos:** _____/15

**Evidencia requerida:**
- Captura del nodo Webhook configurado
- Captura de una ejecución mostrando los datos recibidos

---

### 3. Validación de Datos con IF (10 puntos)

| Criterio | Excelente (10) | Bueno (7) | Suficiente (4) | Insuficiente (0) |
|----------|---------------|-----------|----------------|------------------|
| **Lógica de validación** | IF configurado correctamente validando nombre y email no vacíos | Validación parcial (solo 1 campo) | IF presente pero lógica incorrecta | No implementó validación |
| **Ramificación** | Flujo TRUE y FALSE correctamente conectados | Solo una rama implementada | Ramificación incorrecta | Sin ramificación |

**Puntos:** _____/10

**Evidencia requerida:**
- Captura del nodo IF con condiciones configuradas
- Captura de ejecución mostrando rama TRUE y rama FALSE

---

### 4. Transformación de Datos (10 puntos)

| Criterio | Excelente (10) | Bueno (7) | Suficiente (4) | Insuficiente (0) |
|----------|---------------|-----------|----------------|------------------|
| **Nodo Set** | Todos los campos mapeados correctamente: nombre, email (lowercase), mensaje, categoría, timestamp | Mayoría de campos mapeados, email normalizado | Mapeo parcial sin transformaciones | No implementó Set |
| **Uso de expresiones** | Uso correcto de `{{ $json.body.campo }}`, `.toLowerCase()`, `$now.toISO()` | Uso básico de expresiones | Expresiones con errores | Sin expresiones |

**Puntos:** _____/10

**Evidencia requerida:**
- Captura del nodo Set con todos los campos configurados

---

### 5. Persistencia en PostgreSQL (20 puntos)

| Criterio | Excelente (20) | Bueno (14) | Suficiente (7) | Insuficiente (0) |
|----------|---------------|------------|----------------|------------------|
| **Inserción de datos** | INSERT funcional guardando todos los campos en la tabla `submissions` | INSERT funcional con algunos campos faltantes | INSERT con errores de mapeo | No logró insertar en PostgreSQL |
| **Actualización de resumen** | UPDATE funcional que guarda el `resumen_ia` generado por Gemini | Intentó UPDATE pero con errores | No implementó UPDATE | No realizó actualización |
| **Verificación** | Consulta SQL mostrando registros insertados con resumen_ia completo | Consulta mostrando registros sin resumen | Consulta parcial | Sin verificación |

**Puntos:** _____/20

**Evidencia requerida:**
- Captura de ambos nodos PostgreSQL (INSERT y UPDATE)
- Consulta SQL: `SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;`

---

### 6. Integración con Gemini AI (15 puntos)

| Criterio | Excelente (15) | Bueno (10) | Suficiente (5) | Insuficiente (0) |
|----------|---------------|------------|----------------|------------------|
| **HTTP Request a Gemini** | Request configurado correctamente con API key, método POST, body JSON válido | Request funcional con configuración básica | Request con errores menores | No implementó Gemini |
| **Procesamiento de respuesta** | Extrae correctamente el resumen de `candidates[0].content.parts[0].text` | Extrae datos pero con expresiones incorrectas | No logra extraer el resumen | Sin procesamiento |

**Puntos:** _____/15

**Evidencia requerida:**
- Captura del nodo HTTP Request configurado
- Captura de ejecución mostrando la respuesta de Gemini

---

### 7. Notificación por Telegram (15 puntos)

| Criterio | Excelente (15) | Bueno (10) | Suficiente (5) | Insuficiente (0) |
|----------|---------------|------------|----------------|------------------|
| **Envío de mensaje** | Mensaje enviado correctamente a Telegram con formato Markdown | Mensaje enviado sin formato adecuado | Mensaje enviado pero incompleto | No envía mensaje |
| **Contenido del mensaje** | Incluye nombre, email, categoría, mensaje completo, resumen IA, timestamp | Falta algún dato importante | Mensaje muy básico | Sin contenido relevante |
| **Formato visual** | Usa emojis, negrita (*texto*), saltos de línea apropiados | Formato básico | Sin formato | Sin formato |

**Puntos:** _____/15

**Evidencia requerida:**
- Captura del mensaje recibido en Telegram

---

### 8. Manejo de Errores (10 puntos)

| Criterio | Excelente (10) | Bueno (7) | Suficiente (4) | Insuficiente (0) |
|----------|---------------|-----------|----------------|------------------|
| **Respuesta de error** | Respond to Webhook en rama FALSE con JSON de error y código 400 | Respuesta de error sin código HTTP apropiado | Respuesta de error básica | No maneja errores |
| **Respuesta de éxito** | Respond to Webhook en rama TRUE con JSON de éxito, código 200, incluye ID y timestamp | Respuesta de éxito sin todos los datos | Respuesta básica | Sin respuesta de éxito |

**Puntos:** _____/10

**Evidencia requerida:**
- Captura de ambos nodos Respond to Webhook
- Captura del formulario mostrando respuesta de éxito

---

### 9. Organización y Documentación (5 puntos)

| Criterio | Excelente (5) | Bueno (3) | Suficiente (2) | Insuficiente (0) |
|----------|--------------|-----------|----------------|------------------|
| **Organización visual** | Workflow ordenado, nodos bien nombrados, conexiones claras | Workflow funcional pero desorganizado | Workflow difícil de seguir | Workflow caótico |
| **Documento de reflexión** | Documento completo respondiendo las 3 preguntas con análisis profundo (1-2 páginas) | Respuestas superficiales | Respuestas muy breves | Sin documento |

**Puntos:** _____/5

**Evidencia requerida:**
- Captura del workflow completo (vista panorámica)
- Documento PDF o Word con reflexiones

---

### 10. Funcionalidad End-to-End (5 puntos)

| Criterio | Excelente (5) | Bueno (3) | Suficiente (2) | Insuficiente (0) |
|----------|--------------|-----------|----------------|------------------|
| **Prueba completa** | El workflow funciona de inicio a fin: formulario → validación → DB → IA → Telegram → respuesta | Funciona con algunos errores menores | Funcionalidad parcial | No funciona |

**Puntos:** _____/5

---

## Puntuación Total

| Categoría | Puntos Obtenidos | Puntos Máximos |
|-----------|------------------|----------------|
| 1. Configuración y Setup | _____/15 | 15 |
| 2. Webhook | _____/15 | 15 |
| 3. Validación IF | _____/10 | 10 |
| 4. Transformación | _____/10 | 10 |
| 5. PostgreSQL | _____/20 | 20 |
| 6. Gemini AI | _____/15 | 15 |
| 7. Telegram | _____/15 | 15 |
| 8. Manejo de Errores | _____/10 | 10 |
| 9. Organización | _____/5 | 5 |
| 10. End-to-End | _____/5 | 5 |
| **SUBTOTAL** | **_____/120** | **120** |
| **TOTAL (sobre 100)** | **_____/100** | **100** |

---

## Puntos Bonus (+10 puntos adicionales)

Los estudiantes pueden obtener puntos adicionales implementando mejoras creativas:

| Mejora | Puntos |
|--------|--------|
| **Validación avanzada de email** (regex para verificar formato válido) | +2 |
| **Filtrado por dominio** (solo aceptar emails @uleam.edu.ec) | +2 |
| **Rate limiting** (máximo 5 submissions por minuto) | +3 |
| **Email de confirmación** al usuario que envió el formulario | +3 |
| **Dashboard de estadísticas** (segundo workflow con Schedule que envía resumen diario) | +5 |
| **Integración adicional** (Google Sheets, Slack, Discord, etc.) | +3 |
| **Mejora significativa al formulario HTML** (validación frontend, diseño mejorado) | +2 |

**Puntos Bonus Obtenidos:** _____/10

**Nota:** Los puntos bonus se suman al total, pero la calificación máxima final es 100.

---

## Escala de Calificación

| Puntos | Calificación | Letra |
|--------|--------------|-------|
| 90-100 | Excelente | A |
| 80-89 | Muy Bueno | B+ |
| 70-79 | Bueno | B |
| 60-69 | Suficiente | C |
| < 60 | Insuficiente | F |

---

## Entregables Requeridos

Para ser evaluado, el estudiante debe entregar:

1. ✅ **Archivo ZIP o repositorio Git** con:
   - Capturas de pantalla de todos los nodos
   - Captura del workflow completo
   - Captura de ejecución exitosa
   - Captura del mensaje de Telegram
   - Captura de la consulta SQL

2. ✅ **Documento de reflexión (PDF o Word)** respondiendo:
   - ¿Qué ventajas tiene usar n8n vs. programar todo en código?
   - ¿Cómo mejorarías este workflow?
   - ¿Qué otros casos de uso se te ocurren para n8n?

3. ✅ **Opcional:** Archivo JSON exportado del workflow de n8n

---

## Notas Adicionales

### Políticas de Evaluación

- **Plagio:** Se considera plagio copiar el workflow completo de otro compañero. Workflows idénticos recibirán 0 puntos.
- **Ayuda permitida:** Pueden consultar documentación, preguntar al profesor, y ayudarse entre compañeros, pero cada uno debe crear su propio workflow.
- **Retrasos:** Por cada día de retraso, se deducen 10 puntos del total.

### Criterios de Honestidad Académica

- Las capturas deben ser originales (no de internet)
- El documento de reflexión debe ser escrito con sus propias palabras
- Las ejecuciones deben mostrar sus propios datos (nombre, email personal)

---

## Comentarios del Profesor

**Fortalezas del trabajo:**

___________________________________________

___________________________________________

**Áreas de mejora:**

___________________________________________

___________________________________________

**Calificación Final:** _____/100

**Fecha de evaluación:** _______________

**Firma del profesor:** _______________

---

¡Éxito en tu laboratorio!
