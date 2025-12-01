# Tutorial: Microservicios con NestJS y Estrategias de Resiliencia

## Proyecto Educativo - ASW 2025-2

Este tutorial te guiará paso a paso en la construcción de un sistema de microservicios con NestJS, implementando **4 estrategias de resiliencia** intercambiables y un **API Gateway**.

---

## Tabla de Contenidos

1. [Objetivos de Aprendizaje](#1-objetivos-de-aprendizaje)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Prerequisitos](#3-prerequisitos)
4. [Paso 1: Crear books-service](#4-paso-1-crear-books-service)
5. [Paso 2: Crear loans-service](#5-paso-2-crear-loans-service)
6. [Patron Strategy: Interface de Resiliencia](#6-patron-strategy-interface-de-resiliencia)
7. [Estrategia NONE](#7-estrategia-none-sin-proteccion)
8. [Estrategia Circuit Breaker](#8-estrategia-circuit-breaker)
9. [Estrategia SAGA](#9-estrategia-saga)
10. [Estrategia Outbox](#10-estrategia-outbox)
11. [Patron Factory: ResilienceService](#11-patron-factory-resilienceservice)
12. [Paso 3: Crear gateway-service](#12-paso-3-crear-gateway-service)
13. [Configuracion de RabbitMQ](#13-configuracion-de-rabbitmq)
14. [Ejecutar el Sistema](#14-ejecutar-el-sistema)
15. [Ejercicios Practicos](#15-ejercicios-practicos)
16. [Preguntas de Reflexion](#16-preguntas-de-reflexion)

---

## 1. Objetivos de Aprendizaje

Al completar este tutorial, seras capaz de:

### Conceptos de Microservicios
- Diseñar sistemas con multiples servicios independientes
- Implementar comunicacion sincrona (HTTP) y asincrona (RabbitMQ)
- Entender el patron API Gateway

### Patrones de Diseño
- **Strategy Pattern**: Algoritmos intercambiables en tiempo de ejecucion
- **Factory Pattern**: Creacion de objetos basada en configuracion
- **Transactional Outbox**: Garantia de entrega de eventos

### Resiliencia en Sistemas Distribuidos
- **Circuit Breaker**: Proteccion contra cascadas de fallos
- **SAGA**: Transacciones distribuidas con compensacion
- **At-least-once delivery**: Garantizar que los eventos se entreguen

### Tecnologias
- NestJS (framework Node.js)
- TypeORM con SQLite
- RabbitMQ (CloudAMQP)
- Opossum (Circuit Breaker library)

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│                      (curl/Postman)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (puerto 3000)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GATEWAY-SERVICE                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Punto de entrada unico                                  │  │
│  │  • Logging centralizado                                    │  │
│  │  • Health checks agregados                                 │  │
│  │  • Enrutamiento a servicios                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ RabbitMQ                      │ HTTP (3002)
            ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│     BOOKS-SERVICE         │   │       LOANS-SERVICE              │
│    (Solo RabbitMQ)        │   │                                  │
│                           │   │  ┌────────────────────────────┐ │
│  @MessagePattern:         │   │  │   RESILIENCE SERVICE       │ │
│  • book.find.all          │◄──┼──┤   (Strategy Pattern)       │ │
│  • book.find.one          │   │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐│ │
│  • book.create            │   │  │ │NONE│ │ CB │ │SAGA│ │OUT ││ │
│  • book.check.availability│   │  │ └────┘ └────┘ └────┘ └────┘│ │
│                           │   │  └────────────────────────────┘ │
│  @EventPattern:           │   │               │                  │
│  • book.loan.requested    │   │               ▼                  │
│  • book.loan.returned     │   │  ┌────────────────────────────┐ │
│                           │   │  │   SQLite (loans.sqlite)    │ │
│  SQLite (books.sqlite)    │   │  │   + Outbox Events          │ │
└───────────────────────────┘   │  └────────────────────────────┘ │
                                └─────────────────────────────────┘
```

### Componentes

| Servicio | Puerto | Responsabilidad | Comunicacion |
|----------|--------|-----------------|--------------|
| **gateway-service** | 3000 | API Gateway - Punto de entrada | HTTP + RabbitMQ |
| **books-service** | - | Catalogo de libros | Solo RabbitMQ |
| **loans-service** | 3002 | Prestamos + Resiliencia | HTTP + RabbitMQ |
| **RabbitMQ** | - | Message Broker | AMQP |

### Flujo de Comunicacion

1. **Cliente → Gateway**: HTTP REST
2. **Gateway → books-service**: RabbitMQ (MessagePattern)
3. **Gateway → loans-service**: HTTP interno
4. **loans-service → books-service**: RabbitMQ (MessagePattern/EventPattern)

---

## 3. Prerequisitos

### Software Requerido
- **Node.js** v18 o superior (recomendado v20 LTS)
- **npm** (viene con Node.js)
- **NestJS CLI**: `npm install -g @nestjs/cli`
- **Editor**: VS Code con extension de NestJS

### Cuenta en CloudAMQP
1. Ve a [cloudamqp.com](https://www.cloudamqp.com/)
2. Crea una cuenta gratuita
3. Crea una instancia "Little Lemur" (gratis)
4. Copia la URL AMQP (formato: `amqps://usuario:password@servidor/vhost`)

### Estructura Final del Proyecto

```
w9-micro/
├── books-service/          # Microservicio de catalogo
│   ├── src/
│   │   ├── books/
│   │   │   ├── entities/book.entity.ts
│   │   │   ├── books.controller.ts
│   │   │   ├── books.service.ts
│   │   │   └── books.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env
├── loans-service/          # Microservicio de prestamos
│   ├── src/
│   │   ├── loans/
│   │   │   ├── entities/
│   │   │   │   ├── loan.entity.ts
│   │   │   │   └── outbox-event.entity.ts
│   │   │   ├── dto/create-loan.dto.ts
│   │   │   ├── loans.controller.ts
│   │   │   ├── loans.service.ts
│   │   │   └── loans.module.ts
│   │   ├── resilience/
│   │   │   ├── strategies/
│   │   │   │   ├── resilience-strategy.interface.ts
│   │   │   │   ├── none.strategy.ts
│   │   │   │   ├── circuit-breaker.strategy.ts
│   │   │   │   ├── saga.strategy.ts
│   │   │   │   └── outbox.strategy.ts
│   │   │   ├── resilience.service.ts
│   │   │   └── resilience.module.ts
│   │   ├── outbox/
│   │   │   ├── outbox-worker.service.ts
│   │   │   └── outbox.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env
├── gateway-service/        # API Gateway
│   ├── src/
│   │   ├── books/
│   │   ├── loans/
│   │   ├── gateway/
│   │   ├── common/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── error.filter.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env
└── README.md
```

---

## 4. Paso 1: Crear books-service

### 4.1 Inicializar el proyecto

```bash
# Crear carpeta del proyecto
mkdir w9-micro && cd w9-micro

# Crear el microservicio con NestJS CLI
nest new books-service --package-manager npm

cd books-service
```

### 4.2 Instalar dependencias

```bash
npm install @nestjs/microservices @nestjs/typeorm @nestjs/config
npm install typeorm sqlite3 amqplib amqp-connection-manager uuid
npm install -D @types/uuid
```

**Explicacion de dependencias:**
- `@nestjs/microservices`: Soporte para microservicios (RabbitMQ, etc.)
- `@nestjs/typeorm`: Integracion con TypeORM
- `typeorm`: ORM para TypeScript
- `sqlite3`: Base de datos SQLite
- `amqplib`: Cliente AMQP para RabbitMQ
- `uuid`: Generacion de IDs unicos

### 4.3 Crear la entidad Book

```typescript
// src/books/entities/book.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Estados posibles de un libro
 * - available: Disponible para prestamo
 * - loaned: Actualmente prestado
 */
export type BookStatus = 'available' | 'loaned';

@Entity('books')
export class Book {
  /**
   * Identificador unico (UUID v4)
   * @PrimaryGeneratedColumn('uuid') genera automaticamente un UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  @Column({ type: 'varchar', length: 20 })
  isbn: string;

  /**
   * Estado actual del libro
   * Por defecto es 'available' (disponible)
   */
  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: BookStatus;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 4.4 Crear el servicio

```typescript
// src/books/books.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, BookStatus } from './entities/book.entity';

export interface CreateBookDto {
  title: string;
  author: string;
  isbn: string;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    this.logger.log(`Creando libro: ${createBookDto.title}`);
    
    const book = this.bookRepository.create({
      ...createBookDto,
      status: 'available',
    });
    
    return this.bookRepository.save(book);
  }

  async findAll(): Promise<Book[]> {
    return this.bookRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAvailable(): Promise<Book[]> {
    return this.bookRepository.find({
      where: { status: 'available' },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Book | null> {
    return this.bookRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: BookStatus): Promise<Book | null> {
    const book = await this.findOne(id);
    if (!book) return null;
    
    book.status = status;
    return this.bookRepository.save(book);
  }

  async markAsLoaned(bookId: string): Promise<Book | null> {
    return this.updateStatus(bookId, 'loaned');
  }

  async markAsAvailable(bookId: string): Promise<Book | null> {
    return this.updateStatus(bookId, 'available');
  }
}
```

### 4.5 Crear el controlador con MessagePattern y EventPattern

```typescript
// src/books/books.controller.ts

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { BooksService, CreateBookDto } from './books.service';

@Controller()
export class BooksController {
  private readonly logger = new Logger(BooksController.name);

  constructor(private readonly booksService: BooksService) {}

  /**
   * Helper para confirmar el procesamiento del mensaje (ACK)
   * 
   * IMPORTANTE: En RabbitMQ, debemos "acknowledge" los mensajes
   * para indicar que fueron procesados correctamente.
   * Si no hacemos ACK, el mensaje se reencola.
   */
  private acknowledgeMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  // =========================================
  // MESSAGE PATTERNS (Request-Response)
  // =========================================
  
  /**
   * @MessagePattern: El cliente ESPERA una respuesta
   * Se usa para consultas y operaciones que necesitan confirmacion
   */
  @MessagePattern('book.find.all')
  async findAll(@Ctx() context: RmqContext) {
    this.logger.log('[book.find.all] Solicitud recibida');
    
    try {
      const books = await this.booksService.findAll();
      this.acknowledgeMessage(context);
      return { success: true, data: books };
    } catch (error) {
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('book.find.one')
  async findOne(@Payload() data: { id: string }, @Ctx() context: RmqContext) {
    this.logger.log(`[book.find.one] Buscando libro: ${data.id}`);
    
    try {
      const book = await this.booksService.findOne(data.id);
      this.acknowledgeMessage(context);
      
      if (!book) {
        return { success: false, error: 'Libro no encontrado' };
      }
      return { success: true, data: book };
    } catch (error) {
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('book.create')
  async create(@Payload() data: CreateBookDto, @Ctx() context: RmqContext) {
    this.logger.log(`[book.create] Creando libro: ${data.title}`);
    
    try {
      const book = await this.booksService.create(data);
      this.acknowledgeMessage(context);
      return { success: true, data: book };
    } catch (error) {
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  @MessagePattern('book.check.availability')
  async checkAvailability(@Payload() data: { bookId: string }, @Ctx() context: RmqContext) {
    this.logger.log(`[book.check.availability] Verificando: ${data.bookId}`);
    
    try {
      const book = await this.booksService.findOne(data.bookId);
      this.acknowledgeMessage(context);
      
      if (!book) {
        return { success: false, available: false, error: 'Libro no encontrado' };
      }
      
      return { 
        success: true, 
        available: book.status === 'available',
        book 
      };
    } catch (error) {
      this.acknowledgeMessage(context);
      return { success: false, available: false, error: error.message };
    }
  }

  // =========================================
  // EVENT PATTERNS (Fire-and-Forget)
  // =========================================
  
  /**
   * @EventPattern: El cliente NO espera respuesta
   * Se usa para notificaciones y actualizaciones asincronas
   */
  @EventPattern('book.loan.requested')
  async handleLoanRequested(
    @Payload() data: { bookId: string; loanId?: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`[book.loan.requested] Libro: ${data.bookId}`);
    
    try {
      await this.booksService.markAsLoaned(data.bookId);
      this.acknowledgeMessage(context);
      this.logger.log(`Libro ${data.bookId} marcado como prestado`);
    } catch (error) {
      this.acknowledgeMessage(context);
      this.logger.error(`Error: ${error.message}`);
    }
  }

  @EventPattern('book.loan.returned')
  async handleLoanReturned(
    @Payload() data: { bookId: string; loanId?: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`[book.loan.returned] Libro: ${data.bookId}`);
    
    try {
      await this.booksService.markAsAvailable(data.bookId);
      this.acknowledgeMessage(context);
      this.logger.log(`Libro ${data.bookId} marcado como disponible`);
    } catch (error) {
      this.acknowledgeMessage(context);
      this.logger.error(`Error: ${error.message}`);
    }
  }
}
```

### 4.6 Configurar el modulo y main.ts

```typescript
// src/books/books.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
```

```typescript
// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';
import { Book } from './books/entities/book.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_NAME || 'books.sqlite',
      entities: [Book],
      synchronize: true, // Solo en desarrollo
      logging: ['error', 'warn'],
    }),
    
    BooksModule,
  ],
})
export class AppModule {}
```

```typescript
// src/main.ts

import { config } from 'dotenv';
config(); // Cargar .env ANTES de todo

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: process.env.QUEUE_NAME || 'books_queue',
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 1,
        socketOptions: {
          heartbeatIntervalInSeconds: 60,
          reconnectTimeInSeconds: 5,
        },
      },
    },
  );

  await app.listen();
  
  console.log('BOOKS-SERVICE iniciado');
  console.log('Cola:', process.env.QUEUE_NAME || 'books_queue');
}

bootstrap();
```

### 4.7 Crear archivo .env

```bash
# books-service/.env

RABBITMQ_URL=amqps://tu-usuario:tu-password@servidor.cloudamqp.com/vhost
DATABASE_NAME=books.sqlite
QUEUE_NAME=books_queue
```

---

## 5. Paso 2: Crear loans-service

### 5.1 Inicializar el proyecto

```bash
cd .. # Volver a w9-micro/
nest new loans-service --package-manager npm
cd loans-service
```

### 5.2 Instalar dependencias

```bash
npm install @nestjs/microservices @nestjs/typeorm @nestjs/config @nestjs/schedule
npm install typeorm sqlite3 amqplib amqp-connection-manager uuid opossum
npm install -D @types/uuid
```

**Dependencias adicionales:**
- `@nestjs/schedule`: Para cron jobs (Outbox Worker)
- `opossum`: Libreria de Circuit Breaker

### 5.3 Crear entidad Loan

```typescript
// src/loans/entities/loan.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Estados posibles de un prestamo
 * 
 * IMPORTANTE para SAGA:
 * - pending: Estado inicial mientras se confirma con books-service
 * - active: Prestamo confirmado exitosamente
 * - returned: El libro fue devuelto
 * - failed: La transaccion fallo (compensacion ejecutada)
 */
export type LoanStatus = 'pending' | 'active' | 'returned' | 'failed';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del libro prestado (referencia a books-service)
   * 
   * NOTA: No usamos foreign key porque el libro
   * esta en otro microservicio. Solo guardamos el ID.
   */
  @Column({ type: 'varchar', length: 36 })
  bookId: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  /**
   * Nombre desnormalizado para evitar llamadas adicionales
   */
  @Column({ type: 'varchar', length: 255 })
  userName: string;

  @CreateDateColumn()
  loanDate: Date;

  @Column({ type: 'datetime', nullable: true })
  returnDate: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: LoanStatus;

  /**
   * Razon del fallo (solo para status='failed')
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason: string | null;
}
```

### 5.4 Crear entidad OutboxEvent

```typescript
// src/loans/entities/outbox-event.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * TRANSACTIONAL OUTBOX PATTERN
 * 
 * Esta tabla almacena eventos que deben ser enviados a RabbitMQ.
 * El worker procesa estos eventos y los envia, garantizando entrega.
 * 
 * Ventajas:
 * - No se pierden eventos aunque RabbitMQ este caido
 * - Atomicidad: prestamo + evento se crean juntos
 * - Trazabilidad: podemos ver que eventos se enviaron
 */
@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tipo de evento (ej: 'book.loan.requested')
   */
  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  /**
   * Datos del evento en formato JSON
   */
  @Column({ type: 'text' })
  payload: string;

  /**
   * Indica si el evento ya fue procesado
   */
  @Column({ type: 'boolean', default: false })
  processed: boolean;

  /**
   * Numero de intentos de envio
   */
  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  /**
   * Ultimo error (para debugging)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  processedAt: Date | null;

  getPayloadObject(): any {
    try {
      return JSON.parse(this.payload);
    } catch {
      return {};
    }
  }
}
```

### 5.5 Crear DTO

```typescript
// src/loans/dto/create-loan.dto.ts

export class CreateLoanDto {
  bookId: string;
  userId: string;
  userName: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  strategy?: string;
}
```

### 5.6 Crear el servicio

```typescript
// src/loans/loans.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
  ) {}

  async create(dto: CreateLoanDto, status: LoanStatus = 'active'): Promise<Loan> {
    const loan = this.loanRepository.create({
      bookId: dto.bookId,
      userId: dto.userId,
      userName: dto.userName,
      status,
    });
    return this.loanRepository.save(loan);
  }

  async createPending(dto: CreateLoanDto): Promise<Loan> {
    return this.create(dto, 'pending');
  }

  async findAll(): Promise<Loan[]> {
    return this.loanRepository.find({ order: { loanDate: 'DESC' } });
  }

  async findActive(): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { status: 'active' },
      order: { loanDate: 'DESC' },
    });
  }

  async findPending(): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { status: 'pending' },
      order: { loanDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Loan | null> {
    return this.loanRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: LoanStatus, failureReason?: string): Promise<Loan | null> {
    const loan = await this.findOne(id);
    if (!loan) return null;
    
    loan.status = status;
    if (failureReason) loan.failureReason = failureReason;
    if (status === 'returned') loan.returnDate = new Date();
    
    return this.loanRepository.save(loan);
  }

  async confirmLoan(id: string): Promise<Loan | null> {
    return this.updateStatus(id, 'active');
  }

  async rejectLoan(id: string, reason: string): Promise<Loan | null> {
    return this.updateStatus(id, 'failed', reason);
  }

  async returnLoan(id: string): Promise<Loan | null> {
    return this.updateStatus(id, 'returned');
  }

  // =========================================
  // OUTBOX OPERATIONS
  // =========================================

  async saveOutboxEvent(eventType: string, payload: any): Promise<OutboxEvent> {
    const event = this.outboxRepository.create({
      eventType,
      payload: JSON.stringify(payload),
      processed: false,
      retryCount: 0,
    });
    return this.outboxRepository.save(event);
  }

  async getPendingOutboxEvents(maxRetries: number = 5): Promise<OutboxEvent[]> {
    return this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
    });
  }

  async markEventProcessed(eventId: string): Promise<void> {
    await this.outboxRepository.update(eventId, {
      processed: true,
      processedAt: new Date(),
    });
  }

  async incrementRetryCount(eventId: string, error: string): Promise<void> {
    const event = await this.outboxRepository.findOne({ where: { id: eventId } });
    if (event) {
      event.retryCount += 1;
      event.lastError = error;
      await this.outboxRepository.save(event);
    }
  }
}
```

---

## 6. Patron Strategy: Interface de Resiliencia

El **Patron Strategy** permite definir una familia de algoritmos, encapsular cada uno, y hacerlos intercambiables.

### Diagrama del Patron

```
┌─────────────────────────────┐
│     ResilienceService       │
│        (Factory)            │
│                             │
│  getActiveStrategy()        │
│  createLoan(dto)            │
└─────────────┬───────────────┘
              │ usa
              ▼
┌─────────────────────────────┐
│   <<interface>>             │
│   ResilienceStrategy        │
├─────────────────────────────┤
│ + name: string              │
│ + description: string       │
│ + createLoan(): LoanResult  │
└─────────────┬───────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ NONE  │ │  CB   │ │ SAGA  │ │OUTBOX │
└───────┘ └───────┘ └───────┘ └───────┘
```

### Beneficios

1. **Open/Closed Principle**: Agregar nuevas estrategias sin modificar codigo existente
2. **Single Responsibility**: Cada estrategia en su propia clase
3. **Facil testing**: Cada estrategia se puede probar por separado
4. **Configuracion en runtime**: Cambiar estrategia con variable de entorno

### Crear la Interface

```typescript
// src/resilience/strategies/resilience-strategy.interface.ts

import { Loan } from '../../loans/entities/loan.entity';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';

export interface LoanResult {
  success: boolean;
  loan?: Loan;
  error?: string;
  details?: any;
}

export interface ResilienceStrategy {
  readonly name: string;
  readonly description: string;
  readonly logEmoji: string;

  createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
  getStatus?(): any;
}

export const RESILIENCE_STRATEGY = 'RESILIENCE_STRATEGY';
```

---

## 7. Estrategia NONE (Sin Proteccion)

### Proposito

Demostrar el **problema base** que resuelven las otras estrategias. Esta estrategia NO implementa ningun patron de resiliencia.

### Comportamiento

```
Cliente → loans-service → books-service (RabbitMQ)
                              ↓
                    Si falla → ERROR INMEDIATO
```

- Consulta books-service directamente via RabbitMQ
- Si books-service no responde en 5 segundos → Error
- Si books-service esta caido → Error inmediato
- **No hay reintentos ni proteccion**

### Implementacion

```typescript
// src/resilience/strategies/none.strategy.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class NoneStrategy implements ResilienceStrategy {
  readonly name = 'none';
  readonly description = 'Sin manejo de errores - Llamada directa';
  readonly logEmoji = '🔵';

  private readonly logger = new Logger('NoneStrategy');

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {}

  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [NONE] Iniciando prestamo: ${loanData.bookId}`);
    
    try {
      // 1. Verificar disponibilidad del libro
      this.logger.log(`${this.logEmoji} [NONE] Consultando disponibilidad...`);
      
      const response = await firstValueFrom(
        this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe(
          timeout(5000), // Timeout de 5 segundos
          catchError((error) => {
            throw new Error(`No se pudo comunicar con books-service: ${error.message}`);
          }),
        ),
      );

      // 2. Verificar respuesta
      if (!response.success) {
        return { success: false, error: response.error };
      }

      if (!response.available) {
        return { success: false, error: 'El libro no esta disponible' };
      }

      // 3. Crear el prestamo en estado 'active'
      const loan = await this.loansService.create(loanData, 'active');

      // 4. Emitir evento para marcar libro como prestado
      this.booksClient.emit('book.loan.requested', {
        bookId: loanData.bookId,
        loanId: loan.id,
      });

      this.logger.log(`${this.logEmoji} [NONE] Prestamo creado: ${loan.id}`);
      
      return { success: true, loan };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [NONE] Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        details: {
          strategy: this.name,
          hint: 'Esta estrategia no tiene proteccion. Considera usar circuit-breaker.',
        },
      };
    }
  }

  getStatus() {
    return {
      strategy: this.name,
      protection: 'none',
      warning: 'Esta estrategia no ofrece proteccion contra fallos',
    };
  }
}
```

### Cuando Usar

- **Solo para demostracion educativa**
- Para mostrar que pasa cuando NO hay resiliencia
- **NUNCA en produccion**

---

## 8. Estrategia Circuit Breaker

### Teoria

El **Circuit Breaker** funciona como un "fusible electrico" que protege contra cascadas de fallos.

### Estados del Circuito

```
                    ┌─────────────────────┐
                    │   CLOSED (🟢)       │
                    │   Normal operation  │
                    └─────────┬───────────┘
                              │ Errores > 50%
                              ▼
                    ┌─────────────────────┐
                    │   OPEN (🔴)         │
                    │   Rechaza peticiones│
                    └─────────┬───────────┘
                              │ Despues de 30 seg
                              ▼
                    ┌─────────────────────┐
                    │   HALF-OPEN (🟡)    │
                    │   Prueba peticiones │
                    └─────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │ Exito                        │ Fallo
               ▼                              ▼
        Vuelve a CLOSED                 Vuelve a OPEN
```

### Beneficios

1. **Falla rapido**: No espera timeout si el servicio esta caido
2. **Protege recursos**: No satura un servicio que esta luchando
3. **Auto-recuperacion**: Detecta cuando el servicio vuelve

### Implementacion con Opossum

```typescript
// src/resilience/strategies/circuit-breaker.strategy.ts

import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import CircuitBreaker from 'opossum';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class CircuitBreakerStrategy implements ResilienceStrategy, OnModuleInit {
  readonly name = 'circuit-breaker';
  readonly description = 'Circuit Breaker - Proteccion con opossum';
  readonly logEmoji = '🟡';

  private readonly logger = new Logger('CircuitBreakerStrategy');
  private breaker: CircuitBreaker<[string], any>;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {}

  onModuleInit() {
    this.initializeCircuitBreaker();
  }

  private initializeCircuitBreaker() {
    const options = {
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000'),
      errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50'),
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000'),
      volumeThreshold: 5,
    };

    this.logger.log(`${this.logEmoji} Configuracion:`);
    this.logger.log(`  - Timeout: ${options.timeout}ms`);
    this.logger.log(`  - Error Threshold: ${options.errorThresholdPercentage}%`);
    this.logger.log(`  - Reset Timeout: ${options.resetTimeout}ms`);

    this.breaker = new CircuitBreaker(
      (bookId: string) => this.checkBookAvailability(bookId),
      options,
    );

    // Event listeners para logs educativos
    this.breaker.on('open', () => {
      this.logger.warn(`${this.logEmoji} 🔴 CIRCUITO ABIERTO - Peticiones rechazadas`);
    });

    this.breaker.on('halfOpen', () => {
      this.logger.log(`${this.logEmoji} 🟡 CIRCUITO HALF-OPEN - Probando...`);
    });

    this.breaker.on('close', () => {
      this.logger.log(`${this.logEmoji} 🟢 CIRCUITO CERRADO - Normal`);
    });
  }

  private async checkBookAvailability(bookId: string): Promise<any> {
    const response = await firstValueFrom(
      this.booksClient.send('book.check.availability', { bookId }).pipe(
        timeout(parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000')),
        catchError((error) => {
          throw new Error(`Error de comunicacion: ${error.message}`);
        }),
      ),
    );

    if (!response.success) {
      throw new Error(response.error || 'Error en books-service');
    }

    return response;
  }

  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} Iniciando prestamo: ${loanData.bookId}`);
    this.logger.log(`${this.logEmoji} Estado del circuito: ${this.getCircuitState()}`);

    try {
      // Verificar disponibilidad A TRAVES del Circuit Breaker
      const response = await this.breaker.fire(loanData.bookId);

      if (!response.available) {
        return { success: false, error: 'El libro no esta disponible' };
      }

      // Crear el prestamo
      const loan = await this.loansService.create(loanData, 'active');

      // Emitir evento
      this.booksClient.emit('book.loan.requested', {
        bookId: loanData.bookId,
        loanId: loan.id,
      });

      return {
        success: true,
        loan,
        details: { circuitState: this.getCircuitState() },
      };

    } catch (error) {
      const isCircuitOpen = this.breaker.opened;
      
      return {
        success: false,
        error: isCircuitOpen
          ? 'Circuito abierto: books-service no disponible'
          : error.message,
        details: {
          circuitState: this.getCircuitState(),
          isCircuitOpen,
        },
      };
    }
  }

  private getCircuitState(): string {
    if (this.breaker.opened) return 'OPEN (🔴)';
    if (this.breaker.halfOpen) return 'HALF-OPEN (🟡)';
    return 'CLOSED (🟢)';
  }

  getStatus() {
    return {
      strategy: this.name,
      circuitState: this.getCircuitState(),
      stats: {
        successes: this.breaker.stats.successes,
        failures: this.breaker.stats.failures,
        rejects: this.breaker.stats.rejects,
      },
    };
  }
}
```

### Configuracion

```bash
# .env
RESILIENCE_STRATEGY=circuit-breaker
CIRCUIT_BREAKER_TIMEOUT=3000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

---

## 9. Estrategia SAGA

### Teoria

El **Patron SAGA** es una alternativa a las transacciones distribuidas (2PC) para manejar transacciones que involucran multiples microservicios.

### Por que no usar 2PC en Microservicios?

- **Bloqueo de recursos**: 2PC bloquea recursos durante la transaccion
- **Acoplamiento**: Requiere coordinacion sincrona entre servicios
- **Punto unico de fallo**: El coordinador es critico

### Flujo SAGA

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAGA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Crear prestamo (PENDING)                                     │
│     └──→ loans.create(status: 'pending')                        │
│                                                                  │
│  2. Verificar libro disponible                                   │
│     └──→ books.check.availability                                │
│                                                                  │
│  3A. Si disponible:                                              │
│      └──→ books.update.status(loaned)                           │
│      └──→ loans.update(status: 'active') ✅                     │
│                                                                  │
│  3B. Si NO disponible:                                           │
│      └──→ COMPENSACION: loans.update(status: 'failed') ❌       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementacion

```typescript
// src/resilience/strategies/saga.strategy.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
import { Loan } from '../../loans/entities/loan.entity';

@Injectable()
export class SagaStrategy implements ResilienceStrategy {
  readonly name = 'saga';
  readonly description = 'SAGA - Transacciones distribuidas con compensacion';
  readonly logEmoji = '🟣';

  private readonly logger = new Logger('SagaStrategy');
  private readonly sagaTimeout: number;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {
    this.sagaTimeout = parseInt(process.env.SAGA_TIMEOUT || '5000');
  }

  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
    this.logger.log(`${this.logEmoji} [SAGA] Iniciando SAGA para libro: ${loanData.bookId}`);

    let loan: Loan | null = null;

    try {
      // PASO 1: Verificar disponibilidad
      this.logger.log(`${this.logEmoji} [SAGA] Paso 1: Verificando disponibilidad...`);
      
      const availabilityResponse = await firstValueFrom(
        this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe(
          timeout(this.sagaTimeout),
          catchError((error) => {
            throw new Error(`No se pudo verificar disponibilidad: ${error.message}`);
          }),
        ),
      );

      if (!availabilityResponse.success || !availabilityResponse.available) {
        return {
          success: false,
          error: availabilityResponse.error || 'Libro no disponible',
          details: { step: 'availability_check' },
        };
      }

      this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 1: Libro disponible`);

      // PASO 2: Crear prestamo en estado PENDING
      this.logger.log(`${this.logEmoji} [SAGA] Paso 2: Creando prestamo (PENDING)...`);
      
      loan = await this.loansService.createPending(loanData);
      this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 2: Prestamo ${loan.id} creado`);

      // PASO 3: Solicitar reserva del libro
      this.logger.log(`${this.logEmoji} [SAGA] Paso 3: Solicitando reserva...`);
      
      const reserveResponse = await firstValueFrom(
        this.booksClient.send('book.update.status', {
          id: loanData.bookId,
          status: 'loaned',
        }).pipe(
          timeout(this.sagaTimeout),
          catchError((error) => {
            throw new Error(`Error al reservar: ${error.message}`);
          }),
        ),
      );

      if (!reserveResponse.success) {
        // COMPENSACION: Marcar prestamo como fallido
        this.logger.warn(`${this.logEmoji} [SAGA] ❌ Reserva rechazada`);
        await this.executeCompensation(loan.id, loanData.bookId, 'Reserva rechazada');
        
        return {
          success: false,
          error: 'No se pudo reservar el libro',
          details: { loanId: loan.id, compensation: 'executed' },
        };
      }

      // PASO 4: Confirmar el prestamo
      this.logger.log(`${this.logEmoji} [SAGA] Paso 4: Confirmando prestamo...`);
      
      loan = await this.loansService.confirmLoan(loan.id);

      this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
      this.logger.log(`${this.logEmoji} [SAGA] ✅ SAGA COMPLETADA EXITOSAMENTE`);

      return {
        success: true,
        loan,
        details: {
          sagaSteps: ['availability ✅', 'create pending ✅', 'reserve ✅', 'confirm ✅'],
        },
      };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [SAGA] ❌ Error: ${error.message}`);

      // Compensacion si ya se creo el prestamo
      if (loan) {
        await this.executeCompensation(loan.id, loanData.bookId, error.message);
      }

      return {
        success: false,
        error: error.message,
        details: { compensationExecuted: !!loan },
      };
    }
  }

  /**
   * COMPENSACION: Revertir operaciones cuando la SAGA falla
   */
  private async executeCompensation(loanId: string, bookId: string, reason: string): Promise<void> {
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Ejecutando compensacion...`);

    try {
      // Marcar prestamo como FAILED
      await this.loansService.rejectLoan(loanId, reason);
      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ✅ Prestamo marcado como FAILED`);

      // Emitir evento para liberar libro (por si acaso se reservo)
      this.booksClient.emit('book.loan.saga.compensate', { bookId, loanId, reason });
      
    } catch (error) {
      this.logger.error(`${this.logEmoji} [SAGA-COMPENSATE] ❌ Error: ${error.message}`);
    }
  }

  getStatus() {
    return {
      strategy: this.name,
      timeout: this.sagaTimeout,
    };
  }
}
```

### Configuracion

```bash
# .env
RESILIENCE_STRATEGY=saga
SAGA_TIMEOUT=5000
```

---

## 10. Estrategia Outbox

### Problema de la Doble Escritura

```
┌─────────────────────────────────────────────────────────────────┐
│  PROBLEMA: Escribir en BD y enviar mensaje NO es atomico        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. loans.save(loan)      ← ✅ Exitoso                          │
│  2. rabbitmq.emit(event)  ← ❌ RabbitMQ caido                   │
│                                                                  │
│  RESULTADO: El prestamo existe pero books-service               │
│             nunca se entera → INCONSISTENCIA                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Solucion: Transactional Outbox

```
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSACTIONAL OUTBOX                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. BEGIN TRANSACTION                                            │
│     └── loans.save(loan)                                        │
│     └── outbox.save(event)    ← Guardado en BD!                 │
│  2. COMMIT                    ← Atomico                         │
│                                                                  │
│  3. Worker (cron) procesa outbox:                               │
│     └── Lee eventos pendientes                                  │
│     └── Envia a RabbitMQ                                        │
│     └── Marca como procesado                                    │
│     └── Si falla, reintenta                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementacion de la Estrategia

```typescript
// src/resilience/strategies/outbox.strategy.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class OutboxStrategy implements ResilienceStrategy {
  readonly name = 'outbox';
  readonly description = 'Outbox - Garantia de entrega';
  readonly logEmoji = '🟢';

  private readonly logger = new Logger('OutboxStrategy');

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {}

  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
    this.logger.log(`${this.logEmoji} [OUTBOX] Iniciando con patron Outbox`);

    try {
      // PASO 1: Crear el prestamo
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 1: Creando prestamo...`);
      const loan = await this.loansService.create(loanData, 'active');
      this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Prestamo creado: ${loan.id}`);

      // PASO 2: Guardar evento en outbox (misma transaccion)
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 2: Guardando evento en outbox...`);
      
      const eventPayload = {
        bookId: loanData.bookId,
        loanId: loan.id,
        userId: loanData.userId,
        userName: loanData.userName,
        timestamp: new Date().toISOString(),
      };

      const outboxEvent = await this.loansService.saveOutboxEvent(
        'book.loan.requested',
        eventPayload,
      );
      
      this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento guardado: ${outboxEvent.id}`);

      // PASO 3: Intentar enviar inmediatamente (best effort)
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 3: Enviando evento (best effort)...`);
      
      try {
        this.booksClient.emit('book.loan.requested', eventPayload);
        await this.loansService.markEventProcessed(outboxEvent.id);
        this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento enviado`);
      } catch (emitError) {
        this.logger.warn(`${this.logEmoji} [OUTBOX] ⚠️ Envio fallido - Worker reintentara`);
      }

      return {
        success: true,
        loan,
        details: {
          outboxEventId: outboxEvent.id,
          hint: 'Si RabbitMQ estaba caido, el worker reenviara el evento',
        },
      };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [OUTBOX] ❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getStatus() {
    const pendingEvents = await this.loansService.getPendingOutboxEvents(5);
    return {
      strategy: this.name,
      pendingEvents: pendingEvents.length,
    };
  }
}
```

### Implementacion del Worker

```typescript
// src/outbox/outbox-worker.service.ts

import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class OutboxWorkerService implements OnModuleInit {
  private readonly logger = new Logger('OutboxWorker');
  private readonly maxRetries: number;
  private isProcessing = false;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {
    this.maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5');
  }

  onModuleInit() {
    if (process.env.RESILIENCE_STRATEGY === 'outbox') {
      this.logger.log('🔄 [OUTBOX-WORKER] Iniciado');
      this.logger.log(`🔄 [OUTBOX-WORKER] Max reintentos: ${this.maxRetries}`);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    // Solo procesar si estrategia es outbox
    if (process.env.RESILIENCE_STRATEGY !== 'outbox') return;
    
    // Evitar procesamiento concurrente
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const pendingEvents = await this.loansService.getPendingOutboxEvents(this.maxRetries);

      if (pendingEvents.length === 0) return;

      this.logger.log(`🔄 [OUTBOX-WORKER] Procesando ${pendingEvents.length} eventos...`);

      for (const event of pendingEvents) {
        if (event.retryCount >= this.maxRetries) {
          this.logger.warn(`🔄 [OUTBOX-WORKER] ⚠️ Evento ${event.id} excedio reintentos`);
          continue;
        }

        await this.processEvent(event);
      }

    } catch (error) {
      this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: any): Promise<void> {
    this.logger.log(`🔄 [OUTBOX-WORKER] Procesando: ${event.id}`);
    this.logger.log(`🔄 [OUTBOX-WORKER] Intento: ${event.retryCount + 1}/${this.maxRetries}`);

    try {
      const payload = event.getPayloadObject ? event.getPayloadObject() : JSON.parse(event.payload);
      
      this.booksClient.emit(event.eventType, payload);
      await this.loansService.markEventProcessed(event.id);
      
      this.logger.log(`🔄 [OUTBOX-WORKER] ✅ Evento ${event.id} procesado`);

    } catch (error) {
      this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error: ${error.message}`);
      await this.loansService.incrementRetryCount(event.id, error.message);
    }
  }
}
```

### Configuracion

```bash
# .env
RESILIENCE_STRATEGY=outbox
OUTBOX_RETRY_INTERVAL=5000
OUTBOX_MAX_RETRIES=5
```

---

## 11. Patron Factory: ResilienceService

El **Patron Factory** centraliza la creacion de objetos basada en configuracion.

```typescript
// src/resilience/resilience.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ResilienceStrategy, LoanResult } from './strategies/resilience-strategy.interface';
import { NoneStrategy } from './strategies/none.strategy';
import { CircuitBreakerStrategy } from './strategies/circuit-breaker.strategy';
import { SagaStrategy } from './strategies/saga.strategy';
import { OutboxStrategy } from './strategies/outbox.strategy';
import { CreateLoanDto } from '../loans/dto/create-loan.dto';

export type StrategyType = 'none' | 'circuit-breaker' | 'saga' | 'outbox';

@Injectable()
export class ResilienceService implements OnModuleInit {
  private readonly logger = new Logger('ResilienceService');
  private activeStrategy: ResilienceStrategy;
  private readonly strategyName: StrategyType;

  constructor(
    private readonly noneStrategy: NoneStrategy,
    private readonly circuitBreakerStrategy: CircuitBreakerStrategy,
    private readonly sagaStrategy: SagaStrategy,
    private readonly outboxStrategy: OutboxStrategy,
  ) {
    // Leer estrategia de variable de entorno
    this.strategyName = (process.env.RESILIENCE_STRATEGY || 'none') as StrategyType;
    this.activeStrategy = this.selectStrategy(this.strategyName);
  }

  onModuleInit() {
    this.logger.log('🎯 =========================================');
    this.logger.log('🎯 RESILIENCE SERVICE INICIALIZADO');
    this.logger.log(`🎯 Estrategia: ${this.activeStrategy.name.toUpperCase()}`);
    this.logger.log(`🎯 Descripcion: ${this.activeStrategy.description}`);
    this.logger.log('🎯 =========================================');
  }

  private selectStrategy(name: StrategyType): ResilienceStrategy {
    const strategies: Record<StrategyType, ResilienceStrategy> = {
      'none': this.noneStrategy,
      'circuit-breaker': this.circuitBreakerStrategy,
      'saga': this.sagaStrategy,
      'outbox': this.outboxStrategy,
    };

    return strategies[name] || this.noneStrategy;
  }

  getActiveStrategy(): ResilienceStrategy {
    return this.activeStrategy;
  }

  getActiveStrategyName(): string {
    return this.activeStrategy.name;
  }

  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`📚 Creando prestamo con estrategia: ${this.activeStrategy.name}`);
    return this.activeStrategy.createLoan(loanData);
  }

  getAvailableStrategies() {
    return [
      { name: 'NONE', envValue: 'none', isActive: this.strategyName === 'none' },
      { name: 'CIRCUIT BREAKER', envValue: 'circuit-breaker', isActive: this.strategyName === 'circuit-breaker' },
      { name: 'SAGA', envValue: 'saga', isActive: this.strategyName === 'saga' },
      { name: 'OUTBOX', envValue: 'outbox', isActive: this.strategyName === 'outbox' },
    ];
  }

  getStatus(): any {
    return this.activeStrategy.getStatus?.() || { strategy: this.activeStrategy.name };
  }
}
```

---

## 12. Paso 3: Crear gateway-service

### 12.1 Inicializar el proyecto

```bash
cd .. # Volver a w9-micro/
nest new gateway-service --package-manager npm
cd gateway-service
```

### 12.2 Instalar dependencias

```bash
npm install @nestjs/microservices @nestjs/config @nestjs/axios axios
npm install amqplib amqp-connection-manager
```

### 12.3 Crear Logging Interceptor

```typescript
// src/common/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Gateway');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    this.logger.log(`📥 ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`📤 ${method} ${url} - ${Date.now() - now}ms ✅`);
        },
        error: (error) => {
          this.logger.error(`📤 ${method} ${url} - ${Date.now() - now}ms ❌`);
        },
      }),
    );
  }
}
```

### 12.4 Crear Error Filter

```typescript
// src/common/error.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`);

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### 12.5 Configurar main.ts

```typescript
// src/main.ts

import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';
import { GlobalExceptionFilter } from './common/error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API GATEWAY iniciado en http://localhost:${port}/api`);
}

bootstrap();
```

---

## 13. Configuracion de RabbitMQ

### 13.1 Crear cuenta en CloudAMQP

1. Ve a [cloudamqp.com](https://www.cloudamqp.com/)
2. Registrate (gratis)
3. Crea una instancia "Little Lemur" (gratis)
4. Copia la URL AMQP

### 13.2 Configurar variables de entorno

**books-service/.env**
```bash
RABBITMQ_URL=amqps://usuario:password@servidor.cloudamqp.com/vhost
DATABASE_NAME=books.sqlite
QUEUE_NAME=books_queue
```

**loans-service/.env**
```bash
RABBITMQ_URL=amqps://usuario:password@servidor.cloudamqp.com/vhost
DATABASE_NAME=loans.sqlite
QUEUE_NAME=loans_queue
RESILIENCE_STRATEGY=none
```

**gateway-service/.env**
```bash
PORT=3000
RABBITMQ_URL=amqps://usuario:password@servidor.cloudamqp.com/vhost
LOANS_SERVICE_URL=http://localhost:3002
```

---

## 14. Ejecutar el Sistema

### 14.1 Orden de inicio

```bash
# Terminal 1: books-service
cd books-service
npm run start:dev

# Terminal 2: loans-service
cd loans-service
npm run start:dev

# Terminal 3: gateway-service
cd gateway-service
npm run start:dev
```

### 14.2 Verificar que todo funciona

```bash
# Health check
curl http://localhost:3000/api/health

# Listar libros
curl http://localhost:3000/api/books

# Crear un libro
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code","author":"Robert Martin","isbn":"978-0132350884"}'

# Ver estrategia activa
curl http://localhost:3000/api/loans/strategy
```

---

## 15. Ejercicios Practicos

### Ejercicio 1: Flujo Completo sin Resiliencia

1. Configura `RESILIENCE_STRATEGY=none` en loans-service
2. Crea 3 libros
3. Lista libros disponibles
4. Crea un prestamo
5. Verifica que el libro ya no esta disponible
6. Devuelve el libro
7. Verifica que vuelve a estar disponible

### Ejercicio 2: Circuit Breaker en Accion

1. Configura `RESILIENCE_STRATEGY=circuit-breaker`
2. Inicia todos los servicios
3. **Detén books-service**
4. Realiza 10 peticiones de prestamo seguidas
5. Observa los logs: el circuito deberia abrirse
6. **Inicia books-service de nuevo**
7. Espera 30 segundos y observa el half-open

### Ejercicio 3: SAGA con Compensacion

1. Configura `RESILIENCE_STRATEGY=saga`
2. Crea un prestamo exitoso
3. Observa los logs de ambos servicios
4. Verifica los estados: PENDING → ACTIVE
5. Intenta crear un prestamo para un libro ya prestado
6. Observa la compensacion en los logs

### Ejercicio 4: Outbox con RabbitMQ Caido

1. Configura `RESILIENCE_STRATEGY=outbox`
2. **Detén books-service**
3. Crea un prestamo
4. Verifica que se creo (el evento queda en outbox)
5. **Inicia books-service**
6. Espera 5 segundos y observa los logs del worker
7. Verifica que el libro ahora esta marcado como prestado

### Ejercicio Avanzado: Implementar Retry Strategy

Implementa una nueva estrategia que reintente N veces antes de fallar:

```typescript
// src/resilience/strategies/retry.strategy.ts
@Injectable()
export class RetryStrategy implements ResilienceStrategy {
  readonly name = 'retry';
  // Implementa logica con N reintentos
}
```

---

## 16. Preguntas de Reflexion

### Preguntas de Comprension

1. **¿Por que Circuit Breaker es mejor que reintentos infinitos?**
   - Hint: Piensa en recursos, latencia, y efecto cascada

2. **¿Cuando usarias SAGA vs Outbox?**
   - SAGA: Cuando necesitas saber el resultado inmediatamente
   - Outbox: Cuando puedes tolerar eventual consistency

3. **¿Que trade-offs tiene cada estrategia?**
   - NONE: Simple pero fragil
   - Circuit Breaker: Proteccion pero puede rechazar requests validos
   - SAGA: Consistencia pero complejidad
   - Outbox: Garantia pero latencia

4. **¿Por que @MessagePattern y @EventPattern son diferentes?**
   - MessagePattern: Espera respuesta (request-response)
   - EventPattern: Fire-and-forget

5. **¿Que pasa si el worker de Outbox falla?**
   - Los eventos quedan en la BD
   - Se reintentaran cuando el worker vuelva
   - At-least-once delivery garantizado

### Preguntas de Diseno

1. ¿Como implementarias un timeout adaptativo en Circuit Breaker?
2. ¿Como manejarias la deduplicacion de eventos en Outbox?
3. ¿Que metricas monitorear en cada estrategia?

---

## Recursos Adicionales

### Libros
- "Building Microservices" - Sam Newman
- "Microservices Patterns" - Chris Richardson
- "Release It!" - Michael Nygard

### Articulos
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [SAGA Pattern](https://microservices.io/patterns/data/saga.html)
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)

### Librerias
- [opossum](https://nodeshift.dev/opossum/) - Circuit Breaker
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)

---

## Licencia

MIT - Uso libre para fines educativos.

---

**Desarrollado para ASW 2025-2**
