/**
 * BOOKS SERVICE
 * 
 * Servicio que contiene la lógica de negocio para gestionar libros.
 * 
 * @educational Este servicio es independiente del transporte (HTTP, RabbitMQ, etc).
 * El controlador decide cómo exponer estas funcionalidades.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, BookStatus } from './entities/book.entity';

/**
 * DTO para crear un libro
 */
export interface CreateBookDto {
  title: string;
  author: string;
  isbn: string;
}

/**
 * DTO para actualizar el estado de un libro
 */
export interface UpdateBookStatusDto {
  id: string;
  status: BookStatus;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  /**
   * Crear un nuevo libro
   * @param createBookDto Datos del libro a crear
   * @returns El libro creado con su ID generado
   */
  async create(createBookDto: CreateBookDto): Promise<Book> {
    this.logger.log(`📗 Creando libro: ${createBookDto.title}`);
    
    const book = this.bookRepository.create({
      ...createBookDto,
      status: 'available',
    });
    
    const savedBook = await this.bookRepository.save(book);
    this.logger.log(`📗 Libro creado con ID: ${savedBook.id}`);
    
    return savedBook;
  }

  /**
   * Obtener todos los libros
   * @returns Lista de todos los libros
   */
  async findAll(): Promise<Book[]> {
    this.logger.log('📚 Consultando todos los libros');
    return this.bookRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener solo libros disponibles
   * @returns Lista de libros con status 'available'
   */
  async findAvailable(): Promise<Book[]> {
    this.logger.log('📚 Consultando libros disponibles');
    return this.bookRepository.find({
      where: { status: 'available' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Buscar un libro por ID
   * @param id UUID del libro
   * @returns El libro encontrado o null
   */
  async findOne(id: string): Promise<Book | null> {
    this.logger.log(`📖 Buscando libro: ${id}`);
    return this.bookRepository.findOne({ where: { id } });
  }

  /**
   * Actualizar el estado de un libro
   * @param id UUID del libro
   * @param status Nuevo estado ('available' | 'loaned')
   * @returns El libro actualizado o null si no existe
   */
  async updateStatus(id: string, status: BookStatus): Promise<Book | null> {
    this.logger.log(`📝 Actualizando estado del libro ${id} a ${status}`);
    
    const book = await this.findOne(id);
    if (!book) {
      this.logger.warn(`⚠️ Libro no encontrado: ${id}`);
      return null;
    }
    
    book.status = status;
    const updatedBook = await this.bookRepository.save(book);
    this.logger.log(`✅ Libro ${id} actualizado a ${status}`);
    
    return updatedBook;
  }

  /**
   * Marcar un libro como prestado
   * @param bookId UUID del libro
   * @returns El libro actualizado o null
   */
  async markAsLoaned(bookId: string): Promise<Book | null> {
    return this.updateStatus(bookId, 'loaned');
  }

  /**
   * Marcar un libro como disponible
   * @param bookId UUID del libro
   * @returns El libro actualizado o null
   */
  async markAsAvailable(bookId: string): Promise<Book | null> {
    return this.updateStatus(bookId, 'available');
  }

  /**
   * Verificar si un libro está disponible
   * @param bookId UUID del libro
   * @returns true si está disponible, false si no existe o está prestado
   */
  async isAvailable(bookId: string): Promise<boolean> {
    const book = await this.findOne(bookId);
    return book?.status === 'available';
  }
}

