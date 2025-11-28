/**
 * BOOKS CONTROLLER (Gateway Proxy)
 * 
 * Controlador que actúa como proxy para books-service.
 * Recibe peticiones HTTP y las traduce a mensajes RabbitMQ.
 * 
 * @educational Este es un ejemplo de "API Composition" donde
 * el gateway expone una API REST pero internamente usa
 * mensajería asíncrona para comunicarse con el servicio.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';

interface CreateBookDto {
  title: string;
  author: string;
  isbn: string;
}

@Controller('books')
export class BooksController {
  private readonly logger = new Logger('BooksProxy');

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
  ) {}

  /**
   * GET /api/books - Listar todos los libros
   */
  @Get()
  async findAll() {
    this.logger.log('📚 GET /api/books → books-service [book.find.all]');
    
    try {
      const response = await firstValueFrom(
        this.booksClient.send('book.find.all', {}).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.error(`❌ Error comunicando con books-service: ${error.message}`);
            throw new HttpException(
              'books-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      if (!response.success) {
        throw new HttpException(response.error, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`📚 Respuesta: ${response.data?.length || 0} libros`);
      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/books/available - Listar libros disponibles
   */
  @Get('available')
  async findAvailable() {
    this.logger.log('📚 GET /api/books/available → books-service [book.find.available]');
    
    try {
      const response = await firstValueFrom(
        this.booksClient.send('book.find.available', {}).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              'books-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      if (!response.success) {
        throw new HttpException(response.error, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`📚 Respuesta: ${response.data?.length || 0} libros disponibles`);
      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/books/:id - Obtener un libro por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`📚 GET /api/books/${id} → books-service [book.find.one]`);
    
    try {
      const response = await firstValueFrom(
        this.booksClient.send('book.find.one', { id }).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              'books-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      if (!response.success) {
        throw new HttpException(
          response.error || 'Libro no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /api/books - Crear un nuevo libro
   */
  @Post()
  async create(@Body() createBookDto: CreateBookDto) {
    this.logger.log(`📚 POST /api/books → books-service [book.create]`);
    this.logger.log(`📚 Libro: ${createBookDto.title}`);
    
    try {
      const response = await firstValueFrom(
        this.booksClient.send('book.create', createBookDto).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              'books-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      if (!response.success) {
        throw new HttpException(response.error, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`📚 Libro creado: ${response.data?.id}`);
      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

