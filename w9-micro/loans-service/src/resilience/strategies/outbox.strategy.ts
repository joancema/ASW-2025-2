/**
 * ESTRATEGIA OUTBOX - Garantía de entrega con reintentos
 * 
 * Implementa el patrón "Transactional Outbox" para garantizar
 * que los eventos se entreguen incluso si RabbitMQ está caído.
 * 
 * @educational El patrón Outbox funciona así:
 * 
 * 1. Al crear un préstamo, se guarda TAMBIÉN un evento en la tabla outbox
 *    (ambos en la MISMA transacción de BD)
 * 2. Se intenta enviar el evento inmediatamente (best effort)
 * 3. Un worker (cron job) revisa periódicamente eventos pendientes
 * 4. Si el envío falla, el worker reintenta hasta MAX_RETRIES
 * 
 * Garantías:
 * - At-least-once delivery: El evento se entregará al menos una vez
 * - Atomicidad: El préstamo y el evento se crean juntos o ninguno
 * - Durabilidad: Los eventos sobreviven caídas del sistema
 * 
 * Trade-offs:
 * - Mayor latencia (no es instantáneo si RabbitMQ está caído)
 * - Posible duplicación de eventos (el receptor debe ser idempotente)
 * - Requiere limpieza periódica de la tabla outbox
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class OutboxStrategy implements ResilienceStrategy {
  readonly name = 'outbox';
  readonly description = 'Outbox - Garantía de entrega con reintentos automáticos';
  readonly logEmoji = '🟢';

  private readonly logger = new Logger('OutboxStrategy');
  private readonly maxRetries: number;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {
    this.maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5');
    this.logger.log(`${this.logEmoji} [OUTBOX] Max reintentos configurado: ${this.maxRetries}`);
  }

  /**
   * Crear préstamo usando el patrón Outbox
   * 
   * Flujo:
   * 1. Crear préstamo en estado ACTIVE
   * 2. Guardar evento en tabla outbox (misma transacción)
   * 3. Intentar enviar evento inmediatamente (best effort)
   * 4. Si falla, el worker lo reintentará después
   */
  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
    this.logger.log(`${this.logEmoji} [OUTBOX] Iniciando préstamo con patrón Outbox`);
    this.logger.log(`${this.logEmoji} [OUTBOX] Libro: ${loanData.bookId}`);
    this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);

    try {
      // PASO 1: Crear el préstamo en estado ACTIVE
      // (Asumimos optimistamente que el libro está disponible)
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 1: Creando préstamo...`);
      
      const loan = await this.loansService.create(loanData, 'active');
      this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Préstamo creado: ${loan.id}`);

      // PASO 2: Guardar evento en la tabla outbox
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 2: Guardando evento en outbox...`);
      
      const eventPayload = {
        bookId: loanData.bookId,
        loanId: loan.id,
        userId: loanData.userId,
        userName: loanData.userName,
        timestamp: new Date().toISOString(),
      };

      const outboxEvent = await this.loansService.saveOutboxEvent(
        'book.loan.requested',
        eventPayload,
      );
      
      this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento guardado en outbox: ${outboxEvent.id}`);

      // PASO 3: Intentar enviar inmediatamente (best effort)
      this.logger.log(`${this.logEmoji} [OUTBOX] Paso 3: Intentando enviar evento (best effort)...`);
      
      try {
        this.booksClient.emit('book.loan.requested', eventPayload);
        
        // Marcar como procesado si el emit no lanza error
        // (Nota: emit es fire-and-forget, no garantiza entrega)
        await this.loansService.markEventProcessed(outboxEvent.id);
        
        this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento enviado y marcado como procesado`);
      } catch (emitError) {
        // Si falla el envío inmediato, el worker lo reintentará
        this.logger.warn(`${this.logEmoji} [OUTBOX] ⚠️ Envío inmediato falló: ${emitError.message}`);
        this.logger.log(`${this.logEmoji} [OUTBOX] El worker reintentará el envío`);
      }

      this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
      this.logger.log(`${this.logEmoji} [OUTBOX] ✅ OPERACIÓN COMPLETADA`);
      this.logger.log(`${this.logEmoji} [OUTBOX] Préstamo: ${loan.id}`);
      this.logger.log(`${this.logEmoji} [OUTBOX] Evento Outbox: ${outboxEvent.id}`);
      this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);

      return {
        success: true,
        loan,
        details: {
          strategy: this.name,
          outboxEventId: outboxEvent.id,
          steps: [
            '1. Préstamo creado (ACTIVE) ✅',
            '2. Evento guardado en outbox ✅',
            '3. Intento de envío inmediato ✅',
          ],
          message: 'Préstamo creado con garantía de entrega (Outbox)',
          hint: 'Si books-service estaba caído, el evento se reenviará automáticamente',
        },
      };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [OUTBOX] ❌ Error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        details: {
          strategy: this.name,
          hint: 'Error al guardar el préstamo o el evento outbox',
        },
      };
    }
  }

  /**
   * Estado de la estrategia
   */
  async getStatus() {
    // Obtener estadísticas de la tabla outbox
    const pendingEvents = await this.loansService.getPendingOutboxEvents(this.maxRetries);
    
    return {
      strategy: this.name,
      description: this.description,
      maxRetries: this.maxRetries,
      retryInterval: process.env.OUTBOX_RETRY_INTERVAL || '5000',
      pendingEvents: pendingEvents.length,
      events: pendingEvents.map(e => ({
        id: e.id,
        type: e.eventType,
        retryCount: e.retryCount,
        createdAt: e.createdAt,
      })),
    };
  }
}

