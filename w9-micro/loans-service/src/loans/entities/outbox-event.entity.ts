/**
 * ENTIDAD OUTBOX EVENT
 * 
 * Implementa el patrón "Transactional Outbox" para garantizar
 * la entrega de eventos incluso si RabbitMQ está temporalmente caído.
 * 
 * @educational El patrón Outbox funciona así:
 * 1. Al crear un préstamo, también se guarda un evento en esta tabla
 * 2. Un worker (cron job) procesa eventos pendientes
 * 3. Si el envío falla, se reintenta hasta MAX_RETRIES
 * 4. Esto garantiza "at-least-once delivery" (entrega garantizada)
 * 
 * Ventajas:
 * - No se pierden eventos aunque RabbitMQ esté caído
 * - La transacción de BD es atómica (préstamo + evento)
 * - Trazabilidad: podemos ver qué eventos se enviaron
 * 
 * Desventajas:
 * - Mayor latencia (no es instantáneo)
 * - Requiere limpieza periódica de eventos procesados
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('outbox_events')
export class OutboxEvent {
  /**
   * Identificador único del evento
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Tipo de evento (ej: 'book.loan.requested', 'book.loan.returned')
   */
  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  /**
   * Datos del evento en formato JSON
   * 
   * @educational 'simple-json' en TypeORM serializa/deserializa
   * automáticamente objetos JavaScript a JSON string.
   */
  @Column({ type: 'text' })
  payload: string;

  /**
   * Indica si el evento ya fue procesado (enviado exitosamente)
   */
  @Column({ type: 'boolean', default: false })
  processed: boolean;

  /**
   * Número de intentos de envío realizados
   */
  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  /**
   * Último error al intentar enviar (para debugging)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  /**
   * Fecha de creación del evento
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha en que fue procesado exitosamente
   */
  @Column({ type: 'datetime', nullable: true })
  processedAt: Date | null;

  /**
   * Helper para obtener el payload como objeto
   */
  getPayloadObject(): any {
    try {
      return JSON.parse(this.payload);
    } catch {
      return {};
    }
  }

  /**
   * Helper para establecer el payload desde un objeto
   */
  setPayloadObject(data: any): void {
    this.payload = JSON.stringify(data);
  }
}

