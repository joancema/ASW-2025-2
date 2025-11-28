/**
 * BOOKS MODULE
 * 
 * Módulo que encapsula toda la lógica relacionada con libros.
 * 
 * @educational En NestJS, los módulos organizan el código en
 * bloques cohesivos. Cada módulo tiene sus propios:
 * - Controllers (manejan requests)
 * - Services (lógica de negocio)
 * - Entities (modelos de datos)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { BooksSeedService } from './seed-books';

@Module({
  imports: [
    // Registra la entidad Book para inyección del repositorio
    TypeOrmModule.forFeature([Book]),
  ],
  controllers: [BooksController],
  providers: [BooksService, BooksSeedService],
  exports: [BooksService], // Permite usar BooksService en otros módulos
})
export class BooksModule {}

