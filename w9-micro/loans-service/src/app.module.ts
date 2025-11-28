/**
 * LOANS-SERVICE - Módulo principal
 * 
 * Configura:
 * - TypeORM con SQLite para persistencia
 * - ConfigModule para variables de entorno
 * - ScheduleModule para el Outbox Worker
 * - RabbitMQ client para comunicación con books-service
 * - Módulos de préstamos, resiliencia y outbox
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoansModule } from './loans/loans.module';
import { ResilienceModule } from './resilience/resilience.module';
import { OutboxModule } from './outbox/outbox.module';
import { Loan } from './loans/entities/loan.entity';
import { OutboxEvent } from './loans/entities/outbox-event.entity';

@Module({
  imports: [
    // Carga variables de entorno desde .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Programador de tareas (para Outbox Worker)
    ScheduleModule.forRoot(),
    
    // Configuración de TypeORM con SQLite
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_NAME || 'loans.sqlite',
      entities: [Loan, OutboxEvent],
      synchronize: true,
      logging: ['error', 'warn'],
    }),
    
    // Cliente RabbitMQ para comunicarse con books-service
    ClientsModule.register([
      {
        name: 'BOOKS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'books_queue', // Cola donde escucha books-service
          queueOptions: {
            durable: true,
          },
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
            reconnectTimeInSeconds: 5,
          },
        },
      },
    ]),
    
    // Módulos de la aplicación
    LoansModule,
    ResilienceModule,
    OutboxModule,
  ],
})
export class AppModule {}

