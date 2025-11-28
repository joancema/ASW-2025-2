/**
 * LOANS MODULE (Gateway Proxy)
 * 
 * Módulo que actúa como proxy para loans-service.
 * Todas las peticiones de préstamos pasan por aquí y se
 * reenvían a loans-service via HTTP.
 * 
 * @educational Este módulo demuestra comunicación HTTP
 * entre el gateway y un microservicio interno.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoansController } from './loans.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // Más tiempo por las estrategias de resiliencia
      maxRedirects: 5,
    }),
  ],
  controllers: [LoansController],
})
export class LoansModule {}

