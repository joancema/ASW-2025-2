/**
 * BOOKS-SERVICE - Módulo principal
 * 
 * Configura:
 * - TypeORM con SQLite para persistencia
 * - ConfigModule para variables de entorno
 * - BooksModule para la lógica de negocio
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';
import { Book } from './books/entities/book.entity';

@Module({
  imports: [
    // Carga variables de entorno desde .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Configuración de TypeORM con SQLite
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_NAME || 'books.sqlite',
      entities: [Book],
      synchronize: true, // Auto-crear tablas (solo desarrollo)
      logging: ['error', 'warn'], // Logs de errores
    }),
    
    // Módulo de libros
    BooksModule,
  ],
})
export class AppModule {}

