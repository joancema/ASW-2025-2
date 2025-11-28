/**
 * GATEWAY-SERVICE - Módulo principal
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BooksModule } from './books/books.module';
import { LoansModule } from './loans/loans.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    // Carga variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // HTTP client para comunicarse con loans-service
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    
    // Módulos del gateway (cada uno configura su propio cliente RabbitMQ)
    GatewayModule,
    BooksModule,
    LoansModule,
  ],
})
export class AppModule {}