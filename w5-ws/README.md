# Tutorial: Integración REST API con WebSocket en NestJS

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requisitos Previos](#requisitos-previos)
4. [Proyecto 1: API REST](#proyecto-1-api-rest)
5. [Proyecto 2: Servidor WebSocket](#proyecto-2-servidor-websocket)
6. [Flujo de Comunicación](#flujo-de-comunicación)
7. [Código Clave Explicado](#código-clave-explicado)
8. [Ejecución de los Proyectos](#ejecución-de-los-proyectos)
9. [Conceptos Clave](#conceptos-clave)

---

## Introducción

Este proyecto demuestra cómo integrar una **API REST** con un **Servidor WebSocket** usando NestJS. El objetivo es crear un sistema donde los cambios realizados a través de la API REST se notifiquen en tiempo real a todos los clientes conectados mediante WebSockets.

### ¿Qué aprenderás?

- Crear una API REST completa con operaciones CRUD
- Implementar un servidor WebSocket con NestJS
- Conectar ambos servicios mediante webhooks
- Enviar notificaciones en tiempo real a múltiples clientes
- Entender la diferencia entre comunicación REST y WebSocket

---

## Arquitectura del Sistema

El sistema está compuesto por dos proyectos independientes que se comunican entre sí:

```
┌─────────────┐      HTTP POST        ┌──────────────┐
│   Cliente   │ ───────────────────> │   REST API   │
│  (Postman)  │                       │  (Puerto     │
└─────────────┘                       │   3000)      │
                                      └──────┬───────┘
                                             │
                                             │ Webhook
                                             │ HTTP POST
                                             ▼
                                      ┌──────────────┐
                                      │  WebSocket   │
                                      │   Server     │
                                      │  (Puerto     │
                                      │   3001)      │
                                      └──────┬───────┘
                                             │
                                             │ WebSocket
                                             │ Broadcast
                                             ▼
                              ┌──────────────────────────┐
                              │  Clientes WebSocket      │
                              │  (Navegador, Apps)       │
                              └──────────────────────────┘
```

### Roles de cada proyecto:

1. **REST API (rest/)**: API tradicional que maneja las operaciones CRUD sobre mascotas. Cuando se crea una mascota, envía un webhook al servidor WebSocket.

2. **WebSocket Server (ws/)**: Servidor que mantiene conexiones persistentes con clientes y recibe webhooks de la API REST para retransmitir eventos a todos los clientes conectados.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** (viene con Node.js)
- **NestJS CLI** instalado globalmente

Para instalar NestJS CLI globalmente:

```bash
npm install -g @nestjs/cli
```

### Conocimientos recomendados:

- Fundamentos de TypeScript
- Conceptos básicos de NestJS (módulos, controladores, servicios)
- Conocimiento básico de HTTP y APIs REST
- (Opcional) Familiaridad con Socket.io

---

## Proyecto 1: API REST

Este proyecto es una API REST tradicional que gestiona un catálogo de mascotas. La característica especial es que cuando se crea una mascota, envía una notificación al servidor WebSocket.

### Paso 1: Crear el proyecto NestJS

Abre tu terminal en la carpeta donde deseas crear los proyectos y ejecuta:

```bash
nest new rest
```

Durante la instalación, selecciona tu gestor de paquetes preferido (npm, yarn, pnpm). Para este tutorial usaremos **npm**.

### Paso 2: Instalar dependencias necesarias

Navega al directorio del proyecto:

```bash
cd rest
```

Instala las dependencias para realizar peticiones HTTP:

```bash
npm install @nestjs/axios axios
```

**¿Por qué estas dependencias?**
- `@nestjs/axios`: Módulo de NestJS que envuelve Axios para hacer peticiones HTTP
- `axios`: Cliente HTTP popular para Node.js

### Paso 3: Generar el recurso de Mascotas

NestJS CLI puede generar toda la estructura CRUD automáticamente:

```bash
nest generate resource mascotas
```

Te preguntará:
- **¿Qué capa de transporte prefieres?** Selecciona `REST API`
- **¿Generar puntos de entrada CRUD?** Selecciona `Yes`

Esto generará:
- `mascotas/mascotas.controller.ts` - Controlador con endpoints
- `mascotas/mascotas.service.ts` - Lógica de negocio
- `mascotas/mascotas.module.ts` - Módulo de NestJS
- `mascotas/entities/mascota.entity.ts` - Entidad
- `mascotas/dto/create-mascota.dto.ts` - DTO para crear
- `mascotas/dto/update-mascota.dto.ts` - DTO para actualizar

### Paso 4: Definir la entidad Mascota

Abre el archivo `src/mascotas/entities/mascota.entity.ts` y reemplaza su contenido:

```typescript
export class Mascota {
    id: number;
    nombre: string;
    tipo: string;
}
```

**Explicación:**
- `id`: Identificador único de la mascota
- `nombre`: Nombre de la mascota (ej: "Fido", "Michi")
- `tipo`: Tipo de mascota (ej: "Perro", "Gato", "Pez")

### Paso 5: Crear los DTOs

#### CreateMascotaDto

Abre `src/mascotas/dto/create-mascota.dto.ts`:

```typescript
export class CreateMascotaDto {
    nombre: string;
    tipo: string;
}
```

**¿Qué es un DTO?**
Data Transfer Object - define la estructura de datos que esperamos recibir en las peticiones.

#### UpdateMascotaDto

El archivo `update-mascota.dto.ts` ya viene configurado correctamente usando `PartialType`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateMascotaDto } from './create-mascota.dto';

export class UpdateMascotaDto extends PartialType(CreateMascotaDto) {}
```

Esto hace que todas las propiedades sean opcionales para actualizaciones.

### Paso 6: Implementar el servicio

Abre `src/mascotas/mascotas.service.ts` e implementa la lógica con un array en memoria:

```typescript
import { Injectable } from '@nestjs/common';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateMascotaDto } from './dto/update-mascota.dto';
import { Mascota } from './entities/mascota.entity';

const mascotas: Mascota[] = [
  { id: 1, nombre: "Fido", tipo: "Perro" },
  { id: 2, nombre: "Michi", tipo: "Gato" },
  { id: 3, nombre: "Nemo", tipo: "Pez" }
]

@Injectable()
export class MascotasService {
  create(createMascotaDto: CreateMascotaDto) {
    const newMascota = { id: mascotas.length + 1, ...createMascotaDto };
    mascotas.push(newMascota);
    return newMascota;
  }

  findAll(): Mascota[] {
    return mascotas;
  }

  findOne(id: number): Mascota {
    const mascotaEncontrada = mascotas.find(mascota => mascota.id === id);
    if (!mascotaEncontrada) {
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    return mascotaEncontrada;
  }

  update(id: number, updateMascotaDto: UpdateMascotaDto) {
    const indice = mascotas.findIndex(mascota => mascota.id === id);
    if (indice === -1) {
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    const mascotaActualizada = { ...mascotas[indice], ...updateMascotaDto };
    mascotas[indice] = mascotaActualizada;
    return mascotaActualizada;
  }

  remove(id: number) {
    const indice = mascotas.findIndex(mascota => mascota.id === id);
    if (indice === -1) {
      throw new Error(`Mascota con id ${id} no encontrada`);
    }
    const mascotaEliminada = mascotas.splice(indice, 1);
    return mascotaEliminada[0];
  }
}
```

**Nota importante:** Usamos un array en memoria para simplicidad. En producción usarías una base de datos.

### Paso 7: Configurar el módulo de Mascotas

Abre `src/mascotas/mascotas.module.ts` e importa el `HttpModule`:

```typescript
import { Module } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { MascotasController } from './mascotas.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [MascotasController],
  providers: [MascotasService],
})
export class MascotasModule {}
```

**¿Por qué HttpModule?**
Lo necesitamos para hacer peticiones HTTP al servidor WebSocket desde el controlador.

### Paso 8: Implementar el controlador con webhook

Abre `src/mascotas/mascotas.controller.ts` y modifica el método `create` para enviar un webhook:

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateMascotaDto } from './dto/update-mascota.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('mascotas')
export class MascotasController {
  constructor(
    private readonly httpService: HttpService,
    private readonly mascotasService: MascotasService
  ) {}

  @Post()
  async create(@Body() createMascotaDto: CreateMascotaDto) {
    const mascotaCreada = this.mascotasService.create(createMascotaDto);
    
    // Enviar webhook al servidor WebSocket
    try {
      await firstValueFrom(
        this.httpService.post(
          'http://localhost:3001/notificaciones/mascota-creada',
          mascotaCreada
        )
      );
      console.log('✅ Notificación enviada al WebSocket');
    } catch (error) {
      console.log('⚠️ WebSocket no disponible:', error.message);
    }
    
    return mascotaCreada;
  }

  @Get()
  findAll() {
    return this.mascotasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mascotasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMascotaDto: UpdateMascotaDto) {
    return this.mascotasService.update(+id, updateMascotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mascotasService.remove(+id);
  }
}
```

**Puntos clave:**
- Inyectamos `HttpService` en el constructor
- Usamos `firstValueFrom()` para convertir el Observable de RxJS a Promise
- El webhook se envía a `http://localhost:3001/notificaciones/mascota-creada`
- Usamos try-catch para que la API funcione incluso si el WebSocket no está disponible

### Paso 9: Configurar el archivo main.ts

Abre `src/main.ts` y configura CORS y el prefijo global:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**¿Qué hace cada línea?**
- `app.enableCors()`: Habilita CORS para permitir peticiones desde otros dominios
- `app.setGlobalPrefix('api')`: Todos los endpoints tendrán el prefijo `/api`
- Puerto 3000: La API escuchará en `http://localhost:3000`

### Paso 10: Verificar el módulo principal

Abre `src/app.module.ts` y verifica que el módulo de Mascotas esté importado:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MascotasModule } from './mascotas/mascotas.module';

@Module({
  imports: [MascotasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

¡Proyecto REST completado! Ahora los endpoints disponibles son:
- `POST /api/mascotas` - Crear mascota (envía webhook)
- `GET /api/mascotas` - Listar todas
- `GET /api/mascotas/:id` - Obtener una
- `PATCH /api/mascotas/:id` - Actualizar
- `DELETE /api/mascotas/:id` - Eliminar

---

## Proyecto 2: Servidor WebSocket

Este proyecto actúa como intermediario: recibe webhooks de la API REST y los retransmite a todos los clientes conectados mediante WebSocket.

### Paso 1: Crear el proyecto NestJS

Regresa a la carpeta padre (donde está el proyecto `rest`) y crea el nuevo proyecto:

```bash
cd ..
nest new ws
```

Selecciona npm como gestor de paquetes.

### Paso 2: Instalar dependencias de WebSocket

Navega al proyecto:

```bash
cd ws
```

Instala las dependencias necesarias para WebSockets:

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

**¿Qué instalamos?**
- `@nestjs/websockets`: Módulo de NestJS para WebSockets
- `@nestjs/platform-socket.io`: Adaptador para usar Socket.io (librería popular de WebSockets)

### Paso 3: Generar el recurso de Mascotas

Usamos el generador de recursos de NestJS, pero esta vez **sin generar los endpoints CRUD**:

```bash
nest generate resource mascotas
```

Te preguntará:
- **¿Qué capa de transporte prefieres?** Selecciona `WebSockets`
- **¿Generar puntos de entrada CRUD?** Selecciona `No`

Esto generará:
- `mascotas/mascotas.gateway.ts` - Gateway de WebSocket (en lugar de controlador)
- `mascotas/mascotas.service.ts` - Servicio
- `mascotas/mascotas.module.ts` - Módulo de NestJS

**Nota:** A diferencia del proyecto REST, aquí NO generamos CRUD porque el WebSocket Server solo recibirá webhooks y emitirá eventos, no manejará operaciones CRUD directamente.

### Paso 4: Implementar el Gateway de WebSocket

Abre `src/mascotas/mascotas.gateway.ts` y crea el gateway:

```typescript
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ 
  cors: { origin: '*' } 
})
export class MascotasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  emitirEvento(evento: string, mensaje: any) {
    console.log('Emitiendo evento:', evento, 'con mensaje:', mensaje);
    this.server.emit(evento, mensaje);
  }
}
```

**Explicación detallada:**

- `@WebSocketGateway()`: Decorador que convierte la clase en un gateway de WebSocket
- `cors: { origin: '*' }`: Permite conexiones desde cualquier origen (en producción, especifica dominios permitidos)
- `@WebSocketServer()`: Inyecta la instancia del servidor Socket.io
- `OnGatewayConnection`: Interface que obliga a implementar `handleConnection`
- `OnGatewayDisconnect`: Interface que obliga a implementar `handleDisconnect`
- `handleConnection()`: Se ejecuta cuando un cliente se conecta
- `handleDisconnect()`: Se ejecuta cuando un cliente se desconecta
- `emitirEvento()`: Método personalizado para enviar eventos a TODOS los clientes conectados

### Paso 5: Configurar el módulo de Mascotas

Abre `src/mascotas/mascotas.module.ts` y exporta el gateway:

```typescript
import { Module } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { MascotasGateway } from './mascotas.gateway';

@Module({
  providers: [MascotasGateway, MascotasService],
  exports: [MascotasGateway],
})
export class MascotasModule {}
```

**¿Por qué exportamos el Gateway?**
Porque necesitamos usarlo desde el módulo de Notificaciones para emitir eventos cuando recibamos webhooks.

### Paso 6: Generar el recurso de Notificaciones

Este módulo recibirá los webhooks de la API REST:

```bash
nest generate resource notificaciones
```

Te preguntará:
- **¿Qué capa de transporte prefieres?** Selecciona `REST API`
- **¿Generar puntos de entrada CRUD?** Selecciona `No`

Esto generará:
- `notificaciones/notificaciones.controller.ts` - Controlador REST
- `notificaciones/notificaciones.service.ts` - Servicio
- `notificaciones/notificaciones.module.ts` - Módulo de NestJS

**Nota:** Aunque este es un servidor WebSocket, el módulo de notificaciones usa REST porque necesita recibir webhooks HTTP desde la API REST.

### Paso 7: Implementar el controlador de Notificaciones

Abre `src/notificaciones/notificaciones.controller.ts` y reemplaza su contenido:

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { MascotasGateway } from 'src/mascotas/mascotas.gateway';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly gateway: MascotasGateway) {}

  @Post('mascota-creada')
  crearMascota(@Body() body: any) {
    // Recibimos el webhook y lo retransmitimos por WebSocket
    this.gateway.emitirEvento('mascota-creada', body);
  }
}
```

**Flujo del controlador:**
1. Recibe una petición POST en `/notificaciones/mascota-creada`
2. Obtiene los datos de la mascota del body
3. Usa el gateway para emitir el evento a todos los clientes WebSocket

### Paso 8: Configurar el módulo de Notificaciones

Abre `src/notificaciones/notificaciones.module.ts` e importa el módulo de Mascotas:

```typescript
import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { MascotasModule } from 'src/mascotas/mascotas.module';

@Module({
  imports: [MascotasModule],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
})
export class NotificacionesModule {}
```

**¿Por qué importar MascotasModule?**
Para poder inyectar el `MascotasGateway` en el controlador de notificaciones.

### Paso 9: Configurar el archivo main.ts

Abre `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
  console.log('🚀 Servidor en http://localhost:3001');
}
bootstrap();
```

**Nota:** Este servidor corre en el puerto **3001** (diferente del REST que usa 3000).

### Paso 10: Verificar el módulo principal

Abre `src/app.module.ts` y verifica que ambos módulos estén importados:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MascotasModule } from './mascotas/mascotas.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [MascotasModule, NotificacionesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

¡Servidor WebSocket completado! Ahora tenemos:
- Gateway WebSocket en el puerto 3001
- Endpoint REST `/notificaciones/mascota-creada` para recibir webhooks
- Capacidad de emitir eventos a todos los clientes conectados

---

## Flujo de Comunicación

Ahora que ambos proyectos están creados, veamos cómo se comunican paso a paso:

### Flujo completo:

```
1. Cliente → REST API
   POST http://localhost:3000/api/mascotas
   Body: { "nombre": "Rex", "tipo": "Perro" }

2. REST API procesa la petición
   - MascotasService.create() agrega la mascota al array
   - Retorna: { "id": 4, "nombre": "Rex", "tipo": "Perro" }

3. REST API → WebSocket Server (Webhook)
   POST http://localhost:3001/notificaciones/mascota-creada
   Body: { "id": 4, "nombre": "Rex", "tipo": "Perro" }

4. WebSocket Server recibe el webhook
   - NotificacionesController.crearMascota() recibe los datos
   - Llama a MascotasGateway.emitirEvento()

5. WebSocket Server → Clientes WebSocket
   - server.emit('mascota-creada', { id: 4, nombre: "Rex", tipo: "Perro" })
   - TODOS los clientes conectados reciben el evento instantáneamente

6. Clientes WebSocket manejan el evento
   - En navegadores, aplicaciones móviles, etc.
   - Pueden mostrar notificaciones, actualizar UI, etc.
```

### Ventajas de esta arquitectura:

- **Desacoplamiento**: REST API y WebSocket Server son independientes
- **Escalabilidad**: Puedes escalar cada servicio por separado
- **Flexibilidad**: Múltiples servicios pueden enviar webhooks al WebSocket Server
- **Tiempo real**: Los clientes reciben actualizaciones instantáneas sin necesidad de hacer polling

---

## Código Clave Explicado

### 1. Configuración del HttpModule en REST

En `rest/src/mascotas/mascotas.module.ts`:

```typescript
@Module({
  imports: [HttpModule],  // Permite hacer peticiones HTTP
  controllers: [MascotasController],
  providers: [MascotasService],
})
```

El `HttpModule` proporciona el `HttpService` que usamos en el controlador.

### 2. Uso de firstValueFrom

En `rest/src/mascotas/mascotas.controller.ts`:

```typescript
await firstValueFrom(
  this.httpService.post('http://localhost:3001/notificaciones/mascota-creada', mascotaCreada)
);
```

**¿Por qué firstValueFrom?**
- `httpService.post()` retorna un Observable (RxJS)
- `firstValueFrom()` convierte el Observable a Promise
- Podemos usar `await` para esperar la respuesta del webhook

### 3. Configuración del WebSocketGateway

En `ws/src/mascotas/mascotas.gateway.ts`:

```typescript
@WebSocketGateway({ 
  cors: { origin: '*' } 
})
```

**Opciones importantes:**
- `cors`: Configuración de CORS para WebSocket
- `origin: '*'`: Permite cualquier origen (cuidado en producción)
- Puedes agregar `namespace`, `path`, `transports`, etc.

### 4. Decorador @WebSocketServer()

```typescript
@WebSocketServer()
server: Server;
```

**¿Qué hace?**
- Inyecta la instancia del servidor Socket.io
- Nos da acceso a métodos como `emit()`, `to()`, `in()`, etc.
- Es como el "broadcaster" que envía mensajes a los clientes

### 5. Método server.emit()

```typescript
this.server.emit(evento, mensaje);
```

**Comportamiento:**
- Envía el evento a **TODOS** los clientes conectados
- Otros métodos útiles:
  - `server.to(room).emit()` - Envía solo a una sala específica
  - `client.emit()` - Envía solo a un cliente específico
  - `client.broadcast.emit()` - Envía a todos excepto al emisor

### 6. Inyección del Gateway en el controlador

En `ws/src/notificaciones/notificaciones.controller.ts`:

```typescript
constructor(private readonly gateway: MascotasGateway) {}
```

**¿Cómo funciona?**
1. `MascotasModule` exporta `MascotasGateway`
2. `NotificacionesModule` importa `MascotasModule`
3. NestJS inyecta automáticamente el gateway en el controlador

Esto es **Inyección de Dependencias**, un patrón clave en NestJS.

### 7. Manejo de errores en el webhook

```typescript
try {
  await firstValueFrom(this.httpService.post(...));
  console.log('✅ Notificación enviada');
} catch (error) {
  console.log('⚠️ WebSocket no disponible:', error.message);
}
```

**¿Por qué try-catch?**
- Si el WebSocket Server no está corriendo, la API REST seguirá funcionando
- Los errores se registran pero no detienen la ejecución
- Esto hace el sistema más robusto

---

## Ejecución de los Proyectos

### Orden de inicio

Es importante iniciar los proyectos en el orden correcto:

**1. Primero, inicia el Servidor WebSocket:**

```bash
cd ws
npm run start:dev
```

Deberías ver:
```
🚀 Servidor en http://localhost:3001
```

**2. Luego, inicia la API REST:**

Abre otra terminal:

```bash
cd rest
npm run start:dev
```

Deberías ver:
```
[Nest] Application successfully started
```

### ¿Por qué este orden?

Si inicias la API REST primero e intentas crear una mascota, el webhook fallará porque el servidor WebSocket no está escuchando. Aunque la API seguirá funcionando gracias al try-catch, no se enviará la notificación.

### Comandos útiles

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod

# Ver logs detallados
npm run start:dev -- --debug
```

### Verificar que todo funciona

1. **Verifica el REST API:**
   ```bash
   curl http://localhost:3000/api/mascotas
   ```

2. **Verifica el WebSocket Server:**
   - El servidor debe estar escuchando en el puerto 3001
   - Puedes conectarte con un cliente Socket.io

---

## Conceptos Clave

### 1. Diferencia entre REST y WebSocket

| Característica | REST API | WebSocket |
|---------------|----------|-----------|
| **Protocolo** | HTTP/HTTPS | WS/WSS |
| **Comunicación** | Unidireccional (cliente → servidor) | Bidireccional (cliente ↔ servidor) |
| **Conexión** | Sin estado, se cierra después de cada petición | Persistente, conexión abierta |
| **Uso típico** | CRUD, operaciones bajo demanda | Notificaciones en tiempo real, chat |
| **Overhead** | Mayor (headers HTTP en cada petición) | Menor (conexión persistente) |
| **Escala** | Fácil de escalar (stateless) | Más complejo (conexiones persistentes) |

**Cuándo usar cada uno:**
- **REST**: Operaciones CRUD, consultas, autenticación
- **WebSocket**: Chat, notificaciones, actualizaciones en tiempo real, juegos multijugador

### 2. ¿Qué es un Webhook?

Un **webhook** es una petición HTTP que un sistema envía a otro cuando ocurre un evento específico.

**Características:**
- Es una forma de comunicación "push" (el servidor envía datos sin que se lo pidan)
- Normalmente es una petición POST con datos en JSON
- Permite integrar sistemas de manera desacoplada

**En nuestro proyecto:**
- La API REST envía un webhook al WebSocket Server
- URL del webhook: `http://localhost:3001/notificaciones/mascota-creada`
- Payload: Los datos de la mascota creada

### 3. Patrón Observer en WebSockets

WebSockets implementan el **patrón Observer**:

```
                    ┌─────────────┐
                    │   Subject   │
                    │  (Gateway)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │ Observer │    │ Observer │   │ Observer │
    │ Cliente1 │    │ Cliente2 │   │ Cliente3 │
    └──────────┘    └──────────┘   └──────────┘
```

**¿Cómo funciona?**
1. Los clientes se "suscriben" al gateway (se conectan)
2. Cuando ocurre un evento, el gateway "notifica" a todos los observadores
3. Los clientes reciben el evento y reaccionan

### 4. Comunicación Bidireccional vs Unidireccional

**Unidireccional (REST):**
```
Cliente → Servidor: "Dame los datos"
Servidor → Cliente: "Aquí están"
[Conexión cerrada]
```

**Bidireccional (WebSocket):**
```
Cliente → Servidor: [Conexión establecida]
Cliente ← Servidor: "Bienvenido"
Cliente → Servidor: "Envíame notificaciones"
Servidor → Cliente: "Nueva mascota creada"
Servidor → Cliente: "Usuario conectado"
Cliente → Servidor: "Escribiendo mensaje..."
[Conexión permanece abierta]
```

### 5. Ventajas y Desventajas de WebSockets

**Ventajas:**
- ✅ Latencia muy baja (milisegundos)
- ✅ Menos overhead (sin headers HTTP repetidos)
- ✅ Comunicación bidireccional
- ✅ Ideal para aplicaciones en tiempo real

**Desventajas:**
- ❌ Más complejo de implementar
- ❌ Más difícil de escalar (conexiones con estado)
- ❌ Requiere más recursos del servidor
- ❌ Problemas con proxies y firewalls antiguos

### 6. ¿Por qué separar REST y WebSocket?

**Razones arquitectónicas:**

1. **Separación de responsabilidades**
   - REST: Maneja operaciones CRUD y lógica de negocio
   - WebSocket: Maneja comunicación en tiempo real

2. **Escalabilidad**
   - Puedes escalar cada servicio independientemente
   - Ejemplo: 5 instancias REST, 2 instancias WebSocket

3. **Mantenibilidad**
   - Cada servicio tiene un propósito claro
   - Más fácil de testear y debuggear

4. **Flexibilidad**
   - Múltiples servicios pueden usar el mismo WebSocket Server
   - El REST API puede funcionar sin WebSocket

---

## Resumen

Has aprendido a:

✅ Crear una API REST completa con NestJS  
✅ Implementar un servidor WebSocket con Socket.io  
✅ Conectar ambos servicios mediante webhooks  
✅ Enviar notificaciones en tiempo real a múltiples clientes  
✅ Entender cuándo usar REST vs WebSocket  
✅ Aplicar el patrón Observer en aplicaciones web  

### Próximos pasos

Para profundizar más, puedes:

1. **Agregar autenticación**: Validar tokens JWT en el gateway
2. **Implementar salas (rooms)**: Notificar solo a grupos específicos
3. **Persistencia**: Usar una base de datos real (PostgreSQL, MongoDB)
4. **Cliente web**: Crear una interfaz HTML/JS que se conecte al WebSocket
5. **Manejo de reconexiones**: Implementar lógica para reconectar clientes
6. **Tests**: Escribir tests unitarios y e2e para ambos servicios

---

## Estructura Final del Proyecto

```
w5-ws/
├── rest/                          # API REST (Puerto 3000)
│   ├── src/
│   │   ├── mascotas/
│   │   │   ├── dto/
│   │   │   │   ├── create-mascota.dto.ts
│   │   │   │   └── update-mascota.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── mascota.entity.ts
│   │   │   ├── mascotas.controller.ts    # Envía webhook
│   │   │   ├── mascotas.service.ts       # CRUD en memoria
│   │   │   └── mascotas.module.ts        # Importa HttpModule
│   │   ├── app.module.ts
│   │   └── main.ts                       # Puerto 3000, CORS, prefijo /api
│   └── package.json                      # @nestjs/axios, axios
│
└── ws/                            # WebSocket Server (Puerto 3001)
    ├── src/
    │   ├── mascotas/
    │   │   ├── mascotas.gateway.ts       # Gateway WebSocket
    │   │   ├── mascotas.service.ts
    │   │   └── mascotas.module.ts        # Exporta Gateway
    │   ├── notificaciones/
    │   │   ├── notificaciones.controller.ts  # Recibe webhook
    │   │   ├── notificaciones.service.ts
    │   │   └── notificaciones.module.ts      # Importa MascotasModule
    │   ├── app.module.ts
    │   └── main.ts                       # Puerto 3001, CORS
    └── package.json                      # @nestjs/websockets, socket.io
```

---

**¡Felicidades!** 🎉 Has completado el tutorial de integración REST con WebSocket en NestJS.

