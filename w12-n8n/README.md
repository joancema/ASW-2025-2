# Laboratorio n8n - Automatización de Workflows

Proyecto educativo completo para aprender n8n mediante la creación de un workflow que integra webhooks, PostgreSQL, Gemini AI y Telegram.

![n8n](https://img.shields.io/badge/n8n-Latest-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Required-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Descripción del Proyecto

Este laboratorio está diseñado para estudiantes de Ingeniería de Software que desean aprender **n8n**, una plataforma de automatización de workflows de código abierto.

### ¿Qué construirás?

Un workflow completo que:

1. Recibe datos de un formulario web vía **webhook**
2. Valida que los campos requeridos existan
3. Almacena los datos en **PostgreSQL**
4. Genera un resumen inteligente con **Gemini AI**
5. Envía una notificación formateada por **Telegram**
6. Responde al webhook con confirmación JSON

### Arquitectura del Sistema

```
┌─────────────────┐
│  Formulario Web │
│   (HTML/CSS)    │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        n8n Workflow                         │
│  ┌──────────┐   ┌──────┐   ┌──────┐   ┌────────────┐      │
│  │ Webhook  │──▶│  IF  │──▶│ Set  │──▶│ PostgreSQL │      │
│  └──────────┘   └──┬───┘   └──────┘   └─────┬──────┘      │
│                    │                          │              │
│                    │ FALSE                    ▼              │
│                    │                   ┌────────────┐        │
│                    │                   │ Gemini AI  │        │
│                    │                   └─────┬──────┘        │
│                    │                          │              │
│                    │                          ▼              │
│                    │                   ┌────────────┐        │
│                    │                   │  Telegram  │        │
│                    │                   └─────┬──────┘        │
│                    │                          │              │
│                    ▼                          ▼              │
│            ┌──────────────┐          ┌──────────────┐       │
│            │ Respond 400  │          │ Respond 200  │       │
│            └──────────────┘          └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- PostgreSQL corriendo en `localhost:5432`
- Navegador web moderno
- 2 horas de tiempo disponible

### Instalación en 3 Pasos

#### 1. Crear la tabla en PostgreSQL

```bash
docker exec -i postgres-container psql -U postgres -d n8n < init-db/01-schema.sql
```

**Nota:** Reemplaza `postgres-container` con el nombre de tu contenedor de PostgreSQL.

#### 2. Iniciar n8n

```bash
docker-compose up -d
```

#### 3. Acceder a n8n

Abre tu navegador en: `http://localhost:5678`

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## Estructura del Proyecto

```
.
├── docker-compose.yml        # Configuración de n8n
├── .env                      # Variables de entorno (credenciales reales)
├── init-db/
│   └── 01-schema.sql         # Schema de PostgreSQL
├── test-client/
│   ├── index.html            # Formulario de prueba
│   └── styles.css            # Estilos adicionales
├── workflow/
│   └── workflow-solucion.json # Workflow completo importable
├── docs/
│   ├── GUIA-ESTUDIANTE.md    # Guía paso a paso detallada
│   ├── GUIA-PROFESOR.md      # Instrucciones para el profesor
│   └── RUBRICA.md            # Criterios de evaluación
└── README.md                 # Este archivo
```

---

## Guías Disponibles

### Para Estudiantes

Lee la **[Guía del Estudiante](docs/GUIA-ESTUDIANTE.md)** para instrucciones paso a paso completas.

Incluye:
- Configuración del entorno
- Creación del workflow nodo por nodo
- Pruebas con el formulario
- Troubleshooting de problemas comunes

### Para Profesores

Lee la **[Guía del Profesor](docs/GUIA-PROFESOR.md)** para preparar la clase.

Incluye:
- Plan de clase estructurado (2 horas)
- Scripts de demostración
- Problemas comunes de estudiantes
- Criterios de evaluación

### Rúbrica de Evaluación

Consulta la **[Rúbrica](docs/RUBRICA.md)** para conocer los criterios de calificación.

Total: **100 puntos** + hasta **10 puntos bonus**

---

## Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **n8n** | Latest | Plataforma de automatización de workflows |
| **PostgreSQL** | 15+ | Base de datos relacional |
| **Docker** | 20+ | Contenedorización |
| **Gemini AI** | 1.5 Flash | Generación de resúmenes con IA |
| **Telegram Bot API** | v6+ | Notificaciones en tiempo real |
| **Tailwind CSS** | 3.x | Estilos del formulario |

---

## Configuración Rápida

### Variables de Entorno

El archivo `.env` ya incluye todas las credenciales configuradas:

```env
# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123
N8N_PORT=5678

# PostgreSQL (existente)
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=MysecretPassword

# APIs
GEMINI_API_KEY=AIzaSyB7UEBLyyyB6nCsMLLHlJbusgUfEktD1tU
TELEGRAM_BOT_TOKEN=8491732916:AAFtLJooAImrdPniePxB6RFd8q7cHyLuslg
TELEGRAM_CHAT_ID=8412407901
```

---

## Uso del Formulario de Prueba

1. Abre `test-client/index.html` en tu navegador
2. Completa los campos:
   - Nombre
   - Email
   - Categoría (consulta/queja/sugerencia)
   - Mensaje
3. Haz clic en "Enviar Formulario"
4. Verifica:
   - Respuesta en el navegador
   - Notificación en Telegram
   - Registro en PostgreSQL

---

## Importar la Solución

Si quieres ver el workflow completo funcionando:

1. Accede a n8n: `http://localhost:5678`
2. Click en el menú → **"Import from File"**
3. Selecciona: `workflow/workflow-solucion.json`
4. Configura las credenciales:
   - PostgreSQL Lab
   - Telegram Bot
5. Activa el workflow

---

## Comandos Útiles

### Docker

```bash
# Iniciar n8n
docker-compose up -d

# Ver logs
docker-compose logs -f n8n

# Detener n8n
docker-compose down

# Reiniciar n8n
docker-compose restart n8n
```

### PostgreSQL

```bash
# Conectar a PostgreSQL
docker exec -it postgres-container psql -U postgres -d n8n

# Ver registros
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 10;

# Contar registros
SELECT COUNT(*) FROM submissions;

# Buscar por categoría
SELECT * FROM submissions WHERE categoria = 'consulta';
```

### Verificar Servicios

```bash
# Ver puertos en uso
lsof -i :5678  # n8n
lsof -i :5432  # PostgreSQL

# Ver contenedores corriendo
docker ps
```

---

## Troubleshooting

### Problema: n8n no inicia

**Solución:**
```bash
docker-compose logs n8n
# Verificar que el puerto 5678 no esté ocupado
```

### Problema: No conecta a PostgreSQL

**Solución:**
- Verificar que PostgreSQL esté corriendo
- Verificar `network_mode: host` en docker-compose.yml
- Verificar credenciales en `.env`

### Problema: Webhook no responde

**Solución:**
- Verificar que el workflow esté **activo** (toggle verde)
- Verificar la URL del webhook
- Revisar ejecuciones en n8n

### Problema: No llega notificación a Telegram

**Solución:**
- Iniciar el bot enviando `/start` en Telegram
- Verificar el token y Chat ID
- Revisar logs de ejecución en n8n

---

## Objetivos de Aprendizaje

Al completar este laboratorio, habrás aprendido a:

- ✅ Configurar y usar n8n para automatización
- ✅ Crear y consumir webhooks
- ✅ Implementar validaciones y transformaciones de datos
- ✅ Integrar bases de datos PostgreSQL
- ✅ Consumir APIs REST (Gemini)
- ✅ Enviar notificaciones automatizadas
- ✅ Manejar errores y respuestas HTTP
- ✅ Diseñar workflows event-driven

---

## Casos de Uso Adicionales

Una vez domines este laboratorio, puedes usar n8n para:

- Automatizar procesos de marketing (CRM → Email → Analytics)
- Sincronizar datos entre sistemas (Sheets → Database → Slack)
- Procesar formularios de contacto
- Monitorear APIs y alertar en caso de errores
- Generar reportes automáticos
- Integrar servicios de pago con notificaciones
- Pipelines de datos para BI

---

## Recursos Adicionales

### Documentación

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Workflow Library](https://n8n.io/workflows)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### Comunidad

- [n8n Community Forum](https://community.n8n.io/)
- [n8n Discord](https://discord.gg/n8n)
- [n8n YouTube Channel](https://www.youtube.com/c/n8n-io)

### Tutoriales

- [n8n for Beginners](https://docs.n8n.io/getting-started/)
- [Building Workflows](https://docs.n8n.io/workflows/)
- [Using Expressions](https://docs.n8n.io/code-examples/expressions/)

---

## Contribuir

Este es un proyecto educativo. Si encuentras errores o tienes sugerencias:

1. Abre un issue
2. Propone mejoras
3. Comparte tus workflows creativos

---

## Licencia

MIT License - Libre para uso educativo y comercial.

---

## Créditos

Desarrollado para el curso de Ingeniería de Software - **ULEAM, Ecuador**

**Profesor:** Tu Nombre
**Año:** 2024-2025

---

## Contacto y Soporte

Si tienes preguntas durante el laboratorio:

1. Consulta la sección de **Troubleshooting**
2. Revisa las **ejecuciones** en n8n para ver errores
3. Pregunta al profesor
4. Consulta la documentación oficial de n8n

---

¡Disfruta aprendiendo n8n!

**Happy Automating!**
