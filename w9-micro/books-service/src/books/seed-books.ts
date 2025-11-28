/**
 * SEED BOOKS
 * 
 * Script para poblar la base de datos con libros de ejemplo.
 * 
 * @educational Este archivo se puede ejecutar al iniciar el servicio
 * para tener datos de prueba disponibles.
 * 
 * Uso: Importar y llamar seedBooks() desde app.module.ts o main.ts
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BooksService } from './books.service';

@Injectable()
export class BooksSeedService implements OnModuleInit {
  private readonly logger = new Logger('BooksSeed');

  constructor(private readonly booksService: BooksService) {}

  async onModuleInit() {
    await this.seedBooks();
  }

  async seedBooks() {
    const existingBooks = await this.booksService.findAll();
    
    if (existingBooks.length > 0) {
      this.logger.log('📚 Base de datos ya tiene libros, saltando seed');
      return;
    }

    this.logger.log('📚 Poblando base de datos con libros de ejemplo...');

    const booksToCreate = [
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
      },
      {
        title: 'Design Patterns',
        author: 'Gang of Four',
        isbn: '978-0201633610',
      },
      {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas, Andrew Hunt',
        isbn: '978-0135957059',
      },
      {
        title: 'Domain-Driven Design',
        author: 'Eric Evans',
        isbn: '978-0321125217',
      },
      {
        title: 'Building Microservices',
        author: 'Sam Newman',
        isbn: '978-1492034025',
      },
      {
        title: 'Microservices Patterns',
        author: 'Chris Richardson',
        isbn: '978-1617294549',
      },
      {
        title: 'Release It!',
        author: 'Michael Nygard',
        isbn: '978-1680502398',
      },
      {
        title: 'Site Reliability Engineering',
        author: 'Google SRE Team',
        isbn: '978-1491929124',
      },
    ];

    for (const bookData of booksToCreate) {
      try {
        const book = await this.booksService.create(bookData);
        this.logger.log(`  ✅ Creado: ${book.title} (${book.id})`);
      } catch (error) {
        this.logger.error(`  ❌ Error creando ${bookData.title}: ${error.message}`);
      }
    }

    this.logger.log('📚 Seed completado');
  }
}

