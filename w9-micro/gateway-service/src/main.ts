/**
 * GATEWAY-SERVICE - Punto de entrada del API Gateway
 */

import { config } from 'dotenv';
config(); // Cargar .env ANTES de todo

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
  
  console.log('');
  console.log('🚀 =========================================');
  console.log('🚀 API GATEWAY iniciado correctamente');
  console.log('🚀 =========================================');
  console.log(`🚀 URL: http://localhost:${port}/api`);
  console.log(`🚀 RabbitMQ: ${process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Default'}`);
  console.log('🚀 =========================================');
  console.log('');
}

bootstrap();