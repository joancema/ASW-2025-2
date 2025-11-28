import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ResilienceService } from './resilience.service';
import { NoneStrategy } from './strategies/none.strategy';
import { CircuitBreakerStrategy } from './strategies/circuit-breaker.strategy';
import { SagaStrategy } from './strategies/saga.strategy';
import { OutboxStrategy } from './strategies/outbox.strategy';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [
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
    
    forwardRef(() => LoansModule),
  ],
  providers: [
    NoneStrategy,
    CircuitBreakerStrategy,
    SagaStrategy,
    OutboxStrategy,
    ResilienceService,
  ],
  exports: [
    ResilienceService,
    NoneStrategy,
    CircuitBreakerStrategy,
    SagaStrategy,
    OutboxStrategy,
  ],
})
export class ResilienceModule {}