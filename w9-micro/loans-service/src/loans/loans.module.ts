import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ResilienceModule } from '../resilience/resilience.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, OutboxEvent]),
    
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
    
    forwardRef(() => ResilienceModule),
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService, TypeOrmModule],
})
export class LoansModule {}