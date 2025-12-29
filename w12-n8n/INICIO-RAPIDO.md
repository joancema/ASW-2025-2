# Inicio Rápido - Profesor

Esta guía te permite poner en marcha el laboratorio en 5 minutos.

## Pasos Previos (Una sola vez)

### 1. Verificar PostgreSQL
```bash
docker ps | grep postgres
```

Si no está corriendo:
```bash
docker start postgres-container  # Reemplaza con tu nombre de contenedor
```

### 2. Crear base de datos y tabla
```bash
# Reemplaza "estudiantesdb" con el nombre de tu contenedor PostgreSQL
# Para ver el nombre: docker ps | grep postgres

# Crear database (si no existe)
docker exec estudiantesdb psql -U postgres -c "DROP DATABASE IF EXISTS n8n; CREATE DATABASE n8n;"

# Crear tabla submissions
docker exec -i estudiantesdb psql -U postgres -d n8n < init-db/01-schema.sql
```

Deberías ver: `Tabla submissions creada exitosamente con 3 registros de ejemplo`

## Iniciar el Laboratorio

### 1. Levantar n8n
```bash
docker-compose up -d
```

### 2. Verificar que esté corriendo
```bash
docker-compose ps
```

Deberías ver:
```
NAME        IMAGE               STATUS
n8n-lab     n8nio/n8n:latest    Up X seconds
```

### 3. Acceder a n8n
Abre: http://localhost:5678

**Login:**
- Usuario: `admin`
- Contraseña: `admin123`

### 4. Importar la solución (para demostración)

1. En n8n, click en el menú (≡) → **"Import from File"**
2. Selecciona: `workflow/workflow-solucion.json`
3. Configura credenciales:

#### PostgreSQL:
- Name: `PostgreSQL Lab`
- Host: `host.docker.internal`
- Database: `n8n`
- User: `postgres`
- Password: `MysecretPassword`
- Port: `5432`
- SSL: `disabled`

#### Telegram:
- Name: `Telegram Bot`
- Access Token: `8491732916:AAFtLJooAImrdPniePxB6RFd8q7cHyLuslg`

4. **Activar el workflow** (toggle verde)

### 5. Probar con el formulario

Abre en navegador:
```bash
open test-client/index.html
# o
xdg-open test-client/index.html  # Linux
```

Completa el formulario y envía. Deberías recibir mensaje en Telegram.

## Verificar Funcionamiento

### Ver datos en PostgreSQL:
```bash
docker exec estudiantesdb psql -U postgres -d n8n -c "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 3;"
```

### Ver logs de n8n:
```bash
docker-compose logs -f n8n
```

### Ver ejecuciones en n8n:
En la interfaz de n8n → **"Executions"** (menú izquierdo)

## Detener el Laboratorio

```bash
docker-compose down
```

Los datos en PostgreSQL persisten (está fuera de este docker-compose).

## Troubleshooting Rápido

**n8n no inicia:**
```bash
docker-compose logs n8n
```

**No conecta a PostgreSQL:**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Verificar que n8n tenga acceso al host
docker exec n8n-lab ping -c 1 host.docker.internal
```

**Webhook no responde:**
- Verificar que el workflow esté **ACTIVO** (toggle verde en n8n)

**No llega Telegram:**
- Iniciar el bot: Envía `/start` al bot en Telegram

## Para la Clase

### Antes de empezar:
1. Asegúrate de que n8n esté corriendo
2. Importa la solución (para tu referencia)
3. Prueba el formulario una vez
4. Ten abierto Telegram en tu móvil

### Durante la clase:
1. Muestra la demo (15 min) usando la solución importada
2. Pide a los estudiantes que sigan docs/GUIA-ESTUDIANTE.md
3. Circula ayudando con problemas

### Comandos útiles durante la clase:

```bash
# Ver si n8n está corriendo
docker-compose ps

# Reiniciar n8n
docker-compose restart n8n

# Ver logs en tiempo real
docker-compose logs -f n8n

# Verificar PostgreSQL
docker exec -it postgres-container psql -U postgres -d n8n -c "SELECT COUNT(*) FROM submissions;"
```

## Credenciales Importantes

Todas están en el archivo `.env`, pero aquí un resumen:

- **n8n:** admin / admin123
- **PostgreSQL:** postgres / MysecretPassword
- **Gemini API Key:** AIzaSyB7UEBLyyyB6nCsMLLHlJbusgUfEktD1tU
- **Telegram Token:** 8491732916:AAFtLJooAImrdPniePxB6RFd8q7cHyLuslg
- **Chat ID:** 8412407901

---

Listo para empezar. ¡Suerte con tu clase!
