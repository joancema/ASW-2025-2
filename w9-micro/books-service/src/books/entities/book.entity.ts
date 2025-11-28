/**
 * ENTIDAD BOOK
 * 
 * Representa un libro en el catálogo de la biblioteca.
 * 
 * @educational Los decoradores de TypeORM definen cómo se mapea
 * esta clase a una tabla en la base de datos SQLite.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Estados posibles de un libro
 * - available: Disponible para préstamo
 * - loaned: Actualmente prestado
 */
export type BookStatus = 'available' | 'loaned';

@Entity('books')
export class Book {
  /**
   * Identificador único (UUID v4)
   * Se genera automáticamente al crear el libro
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Título del libro
   */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * Autor del libro
   */
  @Column({ type: 'varchar', length: 255 })
  author: string;

  /**
   * ISBN (International Standard Book Number)
   * Identificador único del libro a nivel mundial
   */
  @Column({ type: 'varchar', length: 20 })
  isbn: string;

  /**
   * Estado actual del libro
   * Por defecto es 'available' (disponible)
   */
  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: BookStatus;

  /**
   * Fecha de creación del registro
   * Se establece automáticamente
   */
  @CreateDateColumn()
  createdAt: Date;
}

