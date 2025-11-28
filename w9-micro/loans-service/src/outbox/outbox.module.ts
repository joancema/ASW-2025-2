/**
 * OUTBOX MODULE
 * 
 * Módulo que contiene el worker para procesar eventos pendientes.
 * 
 * @educational Este módulo implementa la parte "polling" del patrón Outbox:
 * Un cron job revisa periódicamente la tabla outbox y reenvía
 * los eventos que no se pudieron entregar.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OutboxWorkerService } from './outbox-worker.service';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
    // Cliente RabbitMQ para enviar eventos
    ClientsModule.registerAsync([
      {
        name: 'BOOKS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'books_queue',
            queueOptions: { durable: true },
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    
    // Módulo de préstamos (para acceder a la tabla outbox)
    forwardRef(() => LoansModule),
  ],
  providers: [OutboxWorkerService],
  exports: [OutboxWorkerService],
})
export class OutboxModule {}