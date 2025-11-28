# Microservicios con Estrategias de Resiliencia

## Proyecto Educativo - ASW 2025-2

Este proyecto demuestra conceptos fundamentales de arquitectura de microservicios, con énfasis en **estrategias de resiliencia** y el patrón **API Gateway**.

---

## Tabla de Contenidos

1. [Objetivo Educativo](#objetivo-educativo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estrategias de Resiliencia](#estrategias-de-resiliencia)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Ejecución](#ejecución)
6. [API Reference](#api-reference)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Ejercicios Propuestos](#ejercicios-propuestos)
9. [Recursos Adicionales](#recursos-adicionales)

---

## Objetivo Educativo

Este proyecto está diseñado para enseñar a estudiantes de Ingeniería de Software:

1. **Patrón API Gateway**: Punto de entrada único para microservicios
2. **Comunicación entre Microservicios**: Síncrona (HTTP) y asíncrona (RabbitMQ)
3. **Patrones de Diseño**: Strategy Pattern para algoritmos intercambiables
4. **Resiliencia en Sistemas Distribuidos**: Cómo manejar fallos de servicios
5. **Transactional Outbox**: Garantizar entrega de eventos
6. **Circuit Breaker**: Protección contra cascadas de fallos
7. **SAGA Pattern**: Transacciones distribuidas con compensación

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│                      (curl/Postman)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GATEWAY-SERVICE                              │
│                      (Puerto 3000)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Punto de entrada único                                  │  │
│  │  • Logging centralizado                                    │  │
│  │  • Health checks agregados                                 │  │
│  │  • Enrutamiento a servicios internos                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ RabbitMQ                      │ HTTP
            ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│     BOOKS-SERVICE         │   │       LOANS-SERVICE              │
│    (Solo RabbitMQ)        │   │       (Puerto 3002)              │
│                           │   │                                  │
│  ┌─────────────────────┐  │   │  ┌────────────────────────────┐ │
│  │ MessagePatterns:    │  │   │  │ REST Controller            │ │
│  │ • book.find.all     │  │   │  │ + Event Listeners          │ │
│  │ • book.find.one     │  │   │  └────────────────────────────┘ │
│  │ • book.create       │  │   │               │                  │
│  │ • book.check.avail. │  │   │               ▼                  │
│  └─────────────────────┘  │   │  ┌────────────────────────────┐ │
│           │               │   │  │   RESILIENCE SERVICE       │ │
│           ▼               │   │  │   (Strategy Pattern)       │ │
│  ┌─────────────────────┐  │   │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐│ │
│  │      SQLite         │  │◄──┼──┤ │NONE│ │ CB │ │SAGA│ │OUT ││ │
│  │   books.sqlite      │  │   │  │ └────┘ └────┘ └────┘ └────┘│ │
│  └─────────────────────┘  │   │  └────────────────────────────┘ │
└───────────────────────────┘   │               │                  │
                                │               ▼                  │
                                │  ┌────────────────────────────┐ │
                                │  │      SQLite                │ │
                                │  │   loans.sqlite             │ │
                                │  └────────────────────────────┘ │
                                └─────────────────────────────────┘
```

### Componentes

| Servicio | Puerto | Responsabilidad | Comunicación |
|----------|--------|-----------------|--------------|
| **gateway-service** | 3000 | API Gateway - Punto de entrada único | HTTP (entrada) + HTTP/RabbitMQ (salida) |
| **books-service** | - | Catálogo de libros | RabbitMQ |
| **loans-service** | 3002 | Gestión de préstamos con resiliencia | HTTP + RabbitMQ |
| **RabbitMQ** | - | Message Broker | AMQP |

---

## Estrategias de Resiliencia

El proyecto implementa **4 estrategias** que se pueden intercambiar mediante variables de entorno:

### 1. NONE (Sin Protección)

```env
RESILIENCE_STRATEGY=none
```

**Propósito**: Demostrar el problema base.

**Comportamiento**:
- Llamada directa a books-service via RabbitMQ
- Si books-service está caído → Error inmediato
- Sin reintentos ni protección

```
Cliente → Gateway → loans-service → books-service
                                         ↓
                               Si falla → ERROR
```

---

### 2. CIRCUIT BREAKER (Protección contra Cascadas)

```env
RESILIENCE_STRATEGY=circuit-breaker
CIRCUIT_BREAKER_TIMEOUT=3000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

**Propósito**: Evitar que un servicio caído afecte a todo el sistema.

**Estados del Circuito**:
- 🟢 **CLOSED**: Todo funciona normal
- 🔴 **OPEN**: Demasiados errores, rechaza peticiones inmediatamente
- 🟡 **HALF-OPEN**: Probando si el servicio se recuperó

```
                    ┌─────────────────────┐
                    │   CLOSED (normal)   │
                    └─────────┬───────────┘
                              │ Errores > 50%
                              ▼
                    ┌─────────────────────┐
                    │   OPEN (protección) │
                    └─────────┬───────────┘
                              │ Después de 30 seg
                              ▼
                    ┌─────────────────────┐
                    │  HALF-OPEN (prueba) │
                    └─────────────────────┘
```

---

### 3. SAGA (Transacciones Distribuidas)

```env
RESILIENCE_STRATEGY=saga
SAGA_TIMEOUT=5000
```

**Propósito**: Mantener consistencia en operaciones que involucran múltiples servicios.

**Flujo**:
1. Crear préstamo en estado `PENDING`
2. Solicitar a books-service que reserve el libro
3. Si tiene éxito → `ACTIVE`
4. Si falla → Ejecutar compensación → `FAILED`

---

### 4. OUTBOX (Garantía de Entrega)

```env
RESILIENCE_STRATEGY=outbox
OUTBOX_RETRY_INTERVAL=5000
OUTBOX_MAX_RETRIES=5
```

**Propósito**: Garantizar que ningún evento se pierda, incluso si RabbitMQ está caído.

**Flujo**:
1. Crear préstamo Y guardar evento en tabla `outbox` (misma transacción)
2. Intentar enviar evento inmediatamente
3. Si falla, el worker reintenta cada 5 segundos
4. Máximo 5 reintentos

---

## Instalación y Configuración

### Prerequisitos

- Node.js v18+ (recomendado v20 LTS)
- npm
- Cuenta en CloudAMQP (https://www.cloudamqp.com/)

### 1. Instalar dependencias en cada servicio

```bash
# Gateway
cd w9-micro/gateway-service
npm install

# Books Service
cd ../books-service
npm install

# Loans Service
cd ../loans-service
npm install
```

### 2. Configurar variables de entorno

```bash
# En cada servicio, copiar env.example a .env
cp env.example .env
```

### 3. Configurar RabbitMQ

1. Crear cuenta en https://www.cloudamqp.com/
2. Crear instancia (plan gratuito "Little Lemur")
3. Copiar URL AMQP a los archivos `.env`

---

## Ejecución

### Iniciar los 3 servicios (en terminales separadas)

```bash
# Terminal 1 - Gateway (Puerto 3000)
cd gateway-service
npm run start:dev

# Terminal 2 - Books Service (RabbitMQ)
cd books-service
npm run start:dev

# Terminal 3 - Loans Service (Puerto 3002)
cd loans-service
npm run start:dev
```

### Cambiar estrategia de resiliencia

Edita `loans-service/.env`:

```env
RESILIENCE_STRATEGY=circuit-breaker
```

Reinicia loans-service para aplicar el cambio.

---

## API Reference

### Gateway (Puerto 3000)

Todos los endpoints usan el prefijo `/api`

#### Libros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/books` | Listar todos los libros |
| GET | `/api/books/available` | Listar libros disponibles |
| GET | `/api/books/:id` | Obtener libro por ID |
| POST | `/api/books` | Crear nuevo libro |

#### Préstamos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/loans` | Listar todos los préstamos |
| GET | `/api/loans/active` | Listar préstamos activos |
| GET | `/api/loans/pending` | Listar préstamos pendientes (SAGA) |
| GET | `/api/loans/strategy` | Ver estrategia de resiliencia activa |
| GET | `/api/loans/:id` | Obtener préstamo por ID |
| POST | `/api/loans` | Crear préstamo |
| POST | `/api/loans/:id/return` | Devolver libro |

#### Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check de todos los servicios |
| GET | `/api/info` | Información del sistema |

---

## Ejemplos de Uso

### Crear un libro

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884"
  }'
```

### Listar libros disponibles

```bash
curl http://localhost:3000/api/books/available
```

### Crear un préstamo

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "UUID-DEL-LIBRO",
    "userId": "user123",
    "userName": "Juan Pérez"
  }'
```

### Ver estrategia activa

```bash
curl http://localhost:3000/api/loans/strategy
```

### Devolver un libro

```bash
curl -X POST http://localhost:3000/api/loans/UUID-DEL-PRESTAMO/return
```

### Health check

```bash
curl http://localhost:3000/api/health
```

---

## Ejercicios Propuestos

### Ejercicio 1: Flujo completo

1. Crear 3 libros usando el endpoint POST /api/books
2. Listar libros disponibles
3. Crear un préstamo para uno de los libros
4. Verificar que el libro ya no aparece como disponible
5. Devolver el libro
6. Verificar que vuelve a estar disponible

### Ejercicio 2: Observar comportamiento sin resiliencia

1. Configura `RESILIENCE_STRATEGY=none`
2. Detén books-service
3. Intenta crear un préstamo
4. Observa el error
5. **Pregunta**: ¿Qué problemas causa esto en producción?

### Ejercicio 3: Circuit Breaker en acción

1. Configura `RESILIENCE_STRATEGY=circuit-breaker`
2. Inicia ambos servicios
3. Detén books-service
4. Realiza 10 peticiones seguidas
5. Observa cómo el circuito se abre
6. **Pregunta**: ¿Por qué es mejor fallar rápido?

### Ejercicio 4: Consistencia con SAGA

1. Configura `RESILIENCE_STRATEGY=saga`
2. Crea un préstamo
3. Observa los logs de ambos servicios
4. Verifica los estados del préstamo (PENDING → ACTIVE)
5. **Pregunta**: ¿Cómo funciona la compensación?

### Ejercicio 5: Garantía con Outbox

1. Configura `RESILIENCE_STRATEGY=outbox`
2. Detén books-service
3. Crea un préstamo
4. Verifica que se creó (en estado active pero evento pendiente)
5. Inicia books-service
6. Espera 5 segundos y verifica los logs del worker
7. **Pregunta**: ¿Por qué el outbox garantiza la entrega?

### Ejercicio 6: Health Check

1. Con todos los servicios corriendo, llama a `/api/health`
2. Detén books-service y llama de nuevo
3. Observa el estado "degraded"
4. **Pregunta**: ¿Por qué es útil el health check agregado?

---

## Recursos Adicionales

### Libros
- "Building Microservices" - Sam Newman
- "Microservices Patterns" - Chris Richardson
- "Release It!" - Michael Nygard

### Artículos
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [SAGA Pattern](https://microservices.io/patterns/data/saga.html)
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)

### Librerías utilizadas
- [opossum](https://nodeshift.dev/opossum/) - Circuit Breaker para Node.js
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [TypeORM](https://typeorm.io/) - ORM para TypeScript

---

## Licencia

MIT - Uso libre para fines educativos.
