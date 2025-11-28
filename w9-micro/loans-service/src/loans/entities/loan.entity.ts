/**
 * ENTIDAD LOAN
 * 
 * Representa un préstamo de libro en el sistema.
 * 
 * @educational Los estados del préstamo permiten implementar
 * diferentes estrategias de resiliencia:
 * - 'pending': Para SAGA, indica transacción en progreso
 * - 'active': Préstamo confirmado y activo
 * - 'returned': Libro devuelto
 * - 'failed': Para SAGA, indica transacción fallida
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Estados posibles de un préstamo
 * 
 * @educational Este enum es crucial para el patrón SAGA:
 * - pending: Estado inicial mientras se confirma con books-service
 * - active: Préstamo confirmado exitosamente
 * - returned: El libro fue devuelto
 * - failed: La transacción falló (compensación ejecutada)
 */
export type LoanStatus = 'pending' | 'active' | 'returned' | 'failed';

@Entity('loans')
export class Loan {
  /**
   * Identificador único (UUID v4)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del libro prestado (referencia a books-service)
   * 
   * @educational No usamos una relación de BD porque el libro
   * está en otro microservicio. Solo guardamos el ID.
   */
  @Column({ type: 'varchar', length: 36 })
  bookId: string;

  /**
   * ID del usuario que solicita el préstamo
   */
  @Column({ type: 'varchar', length: 100 })
  userId: string;

  /**
   * Nombre del usuario (desnormalizado para consultas rápidas)
   * 
   * @educational La desnormalización es común en microservicios
   * para evitar llamadas adicionales entre servicios.
   */
  @Column({ type: 'varchar', length: 255 })
  userName: string;

  /**
   * Fecha en que se realizó el préstamo
   */
  @CreateDateColumn()
  loanDate: Date;

  /**
   * Fecha de devolución (null si aún no se devuelve)
   */
  @Column({ type: 'datetime', nullable: true })
  returnDate: Date | null;

  /**
   * Estado actual del préstamo
   */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: LoanStatus;

  /**
   * Razón del fallo (solo para status='failed')
   * 
   * @educational Útil para debugging y para mostrar al usuario
   * por qué falló su solicitud.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason: string | null;
}

