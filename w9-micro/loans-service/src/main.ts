/**
 * LOANS-SERVICE - Punto de entrada del microservicio
 */

import { config } from 'dotenv';
config(); // Cargar .env ANTES de todo

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Crear aplicación HTTP (REST API)
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para desarrollo
  app.enableCors();
  
  // 2. Conectar microservicio RabbitMQ para escuchar eventos
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.QUEUE_NAME || 'loans_queue',
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
  });
  
  // 3. Iniciar microservicio y servidor HTTP
  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  // Obtener estrategia activa
  const strategy = process.env.RESILIENCE_STRATEGY || 'none';
  
  console.log('');
  console.log('📖 =========================================');
  console.log('📖 LOANS-SERVICE iniciado correctamente');
  console.log('📖 =========================================');
  console.log(`📖 REST API: http://localhost:${port}`);
  console.log(`📖 RabbitMQ: ${process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Default'}`);
  console.log('📖 -----------------------------------------');
  console.log(`📖 Estrategia de Resiliencia: ${strategy.toUpperCase()}`);
  console.log('📖 =========================================');
  console.log('');
}

bootstrap();