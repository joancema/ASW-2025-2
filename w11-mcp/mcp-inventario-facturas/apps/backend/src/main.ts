import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors();

  const port = 3002;
  await app.listen(port);

  logger.log('');
  logger.log('🚀 ================================================');
  logger.log('🚀 BACKEND REST API - INVENTARIO');
  logger.log('🚀 ================================================');
  logger.log(`🚀 Servidor ejecutándose en: http://localhost:${port}`);
  logger.log('🚀 ================================================');
  logger.log('🚀 Endpoints disponibles:');
  logger.log('🚀   GET    /productos              - Listar productos');
  logger.log('🚀   GET    /productos/buscar?q=... - Buscar productos');
  logger.log('🚀   GET    /productos/:id          - Obtener producto');
  logger.log('🚀   POST   /productos              - Crear producto');
  logger.log('🚀   POST   /productos/:id/stock    - Actualizar stock');
  logger.log('🚀   GET    /egresos                - Listar egresos');
  logger.log('🚀   GET    /egresos/:id            - Obtener egreso');
  logger.log('🚀   POST   /egresos                - Crear egreso');
  logger.log('🚀 ================================================');
  logger.log('');
}

bootstrap();
