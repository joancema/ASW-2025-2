/**
 * BOOKS-SERVICE - Punto de entrada del microservicio
 */

import { config } from 'dotenv';
config(); // Cargar .env ANTES de todo

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crear microservicio con transporte RabbitMQ
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: process.env.QUEUE_NAME || 'books_queue',
        queueOptions: {
          durable: true,
        },
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
  
  console.log('📚 =========================================');
  console.log('📚 BOOKS-SERVICE iniciado correctamente');
  console.log('📚 Escuchando en cola:', process.env.QUEUE_NAME || 'books_queue');
  console.log('📚 RabbitMQ URL:', process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Usando default');
  console.log('📚 =========================================');
}

bootstrap();