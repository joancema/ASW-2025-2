/**
 * ESTRATEGIA SAGA - Transacciones distribuidas con compensación
 * 
 * Implementa el patrón SAGA para manejar transacciones que involucran
 * múltiples microservicios.
 * 
 * @educational El patrón SAGA es una alternativa a las transacciones
 * distribuidas (2PC) que funciona así:
 * 
 * 1. Cada paso es una transacción local
 * 2. Si un paso falla, se ejecutan "compensaciones" para revertir
 * 3. El estado final es consistente eventualmente
 * 
 * En este ejemplo:
 * - Paso 1: Crear préstamo en estado PENDING
 * - Paso 2: Solicitar a books-service que marque el libro
 * - Paso 3A (éxito): books-service confirma → préstamo pasa a ACTIVE
 * - Paso 3B (fallo): books-service rechaza → préstamo pasa a FAILED (compensación)
 * 
 * Beneficios:
 * - No bloquea recursos durante la transacción
 * - Cada servicio mantiene su autonomía
 * - Trazabilidad: podemos ver el estado de la transacción
 * 
 * Desventajas:
 * - Complejidad: hay que implementar compensaciones
 * - Consistencia eventual: durante un tiempo el estado es inconsistente
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
import { Loan } from '../../loans/entities/loan.entity';

@Injectable()
export class SagaStrategy implements ResilienceStrategy {
  readonly name = 'saga';
  readonly description = 'SAGA - Transacciones distribuidas con compensación';
  readonly logEmoji = '🟣';

  private readonly logger = new Logger('SagaStrategy');
  private readonly sagaTimeout: number;
  
  // Mapa para rastrear SAGAs en progreso
  private pendingSagas: Map<string, {
    loanId: string;
    bookId: string;
    startTime: Date;
    status: 'pending' | 'confirmed' | 'rejected';
  }> = new Map();

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {
    this.sagaTimeout = parseInt(process.env.SAGA_TIMEOUT || '5000');
    this.logger.log(`${this.logEmoji} [SAGA] Timeout configurado: ${this.sagaTimeout}ms`);
  }

  /**
   * Crear préstamo usando el patrón SAGA
   * 
   * Flujo:
   * 1. Verificar que el libro existe y está disponible
   * 2. Crear préstamo en estado PENDING (transacción local 1)
   * 3. Solicitar a books-service que reserve el libro (transacción local 2)
   * 4. Esperar confirmación o rechazo
   * 5A. Si confirma → Actualizar a ACTIVE
   * 5B. Si rechaza → Actualizar a FAILED (compensación)
   */
  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
    this.logger.log(`${this.logEmoji} [SAGA] Iniciando SAGA para libro: ${loanData.bookId}`);
    this.logger.log(`${this.logEmoji} [SAGA] ========================================`);

    let loan: Loan | null = null;

    try {
      // PASO 1: Verificar disponibilidad del libro
      this.logger.log(`${this.logEmoji} [SAGA] Paso 1: Verificando disponibilidad...`);
      
      const availabilityResponse = await firstValueFrom(
        this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe(
          timeout(this.sagaTimeout),
          catchError((error) => {
            throw new Error(`No se pudo verificar disponibilidad: ${error.message}`);
          }),
        ),
      );

      if (!availabilityResponse.success) {
        this.logger.warn(`${this.logEmoji} [SAGA] Libro no encontrado: ${loanData.bookId}`);
        return {
          success: false,
          error: availabilityResponse.error || 'Libro no encontrado',
          details: { strategy: this.name, step: 'availability_check' },
        };
      }

      if (!availabilityResponse.available) {
        this.logger.warn(`${this.logEmoji} [SAGA] Libro no disponible: ${loanData.bookId}`);
        return {
          success: false,
          error: 'El libro no está disponible para préstamo',
          details: { strategy: this.name, step: 'availability_check' },
        };
      }

      this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 1 completado: Libro disponible`);

      // PASO 2: Crear préstamo en estado PENDING (transacción local)
      this.logger.log(`${this.logEmoji} [SAGA] Paso 2: Creando préstamo en estado PENDING...`);
      
      loan = await this.loansService.createPending(loanData);
      
      this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 2 completado: Préstamo ${loan.id} creado (PENDING)`);

      // Registrar SAGA en progreso
      this.pendingSagas.set(loan.id, {
        loanId: loan.id,
        bookId: loanData.bookId,
        startTime: new Date(),
        status: 'pending',
      });

      // PASO 3: Solicitar reserva del libro a books-service
      this.logger.log(`${this.logEmoji} [SAGA] Paso 3: Solicitando reserva a books-service...`);
      
      // Usar MessagePattern para obtener respuesta síncrona
      const reserveResponse = await firstValueFrom(
        this.booksClient.send('book.update.status', {
          id: loanData.bookId,
          status: 'loaned',
        }).pipe(
          timeout(this.sagaTimeout),
          catchError((error) => {
            throw new Error(`Error al reservar libro: ${error.message}`);
          }),
        ),
      );

      if (!reserveResponse.success) {
        // COMPENSACIÓN: Marcar préstamo como fallido
        this.logger.warn(`${this.logEmoji} [SAGA] ❌ books-service rechazó la reserva`);
        this.logger.log(`${this.logEmoji} [SAGA] Ejecutando compensación...`);
        
        await this.executeCompensation(loan.id, loanData.bookId, 'books-service rechazó la reserva');
        
        return {
          success: false,
          error: 'No se pudo reservar el libro',
          details: {
            strategy: this.name,
            step: 'book_reservation',
            loanId: loan.id,
            compensation: 'Préstamo marcado como FAILED',
          },
        };
      }

      // PASO 4: Confirmar el préstamo (transacción completada)
      this.logger.log(`${this.logEmoji} [SAGA] Paso 4: Confirmando préstamo...`);
      
      loan = await this.loansService.confirmLoan(loan.id);
      
      // Actualizar registro de SAGA
      const sagaRecord = this.pendingSagas.get(loan.id);
      if (sagaRecord) {
        sagaRecord.status = 'confirmed';
      }

      this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
      this.logger.log(`${this.logEmoji} [SAGA] ✅ SAGA COMPLETADA EXITOSAMENTE`);
      this.logger.log(`${this.logEmoji} [SAGA] Préstamo: ${loan.id}`);
      this.logger.log(`${this.logEmoji} [SAGA] Estado final: ${loan.status}`);
      this.logger.log(`${this.logEmoji} [SAGA] ========================================`);

      return {
        success: true,
        loan,
        details: {
          strategy: this.name,
          sagaSteps: [
            '1. Verificación de disponibilidad ✅',
            '2. Creación de préstamo (PENDING) ✅',
            '3. Reserva de libro ✅',
            '4. Confirmación de préstamo ✅',
          ],
          message: 'SAGA completada exitosamente',
        },
      };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [SAGA] ❌ Error en SAGA: ${error.message}`);

      // Si ya se creó el préstamo, ejecutar compensación
      if (loan) {
        this.logger.log(`${this.logEmoji} [SAGA] Ejecutando compensación por error...`);
        await this.executeCompensation(loan.id, loanData.bookId, error.message);
      }

      return {
        success: false,
        error: error.message,
        details: {
          strategy: this.name,
          loanId: loan?.id,
          compensationExecuted: !!loan,
          hint: 'La SAGA falló y se ejecutó compensación para mantener consistencia',
        },
      };
    }
  }

  /**
   * Ejecutar compensación cuando la SAGA falla
   * 
   * @educational La compensación es el "undo" de las operaciones realizadas.
   * En nuestro caso:
   * - Marcar el préstamo como FAILED
   * - Notificar a books-service para liberar el libro (si fue reservado)
   */
  private async executeCompensation(loanId: string, bookId: string, reason: string): Promise<void> {
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Iniciando compensación`);
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Préstamo: ${loanId}`);
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Razón: ${reason}`);
    this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);

    try {
      // 1. Marcar préstamo como FAILED
      await this.loansService.rejectLoan(loanId, reason);
      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ✅ Préstamo ${loanId} marcado como FAILED`);

      // 2. Emitir evento para liberar el libro (por si acaso se reservó)
      this.booksClient.emit('book.loan.saga.compensate', {
        bookId,
        loanId,
        reason,
      });
      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ✅ Evento de compensación emitido a books-service`);

      // 3. Actualizar registro de SAGA
      const sagaRecord = this.pendingSagas.get(loanId);
      if (sagaRecord) {
        sagaRecord.status = 'rejected';
      }

      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Compensación completada`);
      this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);

    } catch (error) {
      this.logger.error(`${this.logEmoji} [SAGA-COMPENSATE] ❌ Error en compensación: ${error.message}`);
      // En producción, aquí podríamos guardar el error para retry manual
    }
  }

  /**
   * Manejar confirmación de préstamo desde books-service
   * (Llamado desde el controller cuando llega el evento)
   */
  async handleLoanConfirmed(loanId: string): Promise<void> {
    this.logger.log(`${this.logEmoji} [SAGA] Recibida confirmación para préstamo: ${loanId}`);
    
    const loan = await this.loansService.confirmLoan(loanId);
    if (loan) {
      this.logger.log(`${this.logEmoji} [SAGA] ✅ Préstamo ${loanId} confirmado (ACTIVE)`);
      
      const sagaRecord = this.pendingSagas.get(loanId);
      if (sagaRecord) {
        sagaRecord.status = 'confirmed';
      }
    }
  }

  /**
   * Manejar rechazo de préstamo desde books-service
   * (Llamado desde el controller cuando llega el evento)
   */
  async handleLoanRejected(loanId: string, reason: string): Promise<void> {
    this.logger.log(`${this.logEmoji} [SAGA] Recibido rechazo para préstamo: ${loanId}`);
    this.logger.log(`${this.logEmoji} [SAGA] Razón: ${reason}`);
    
    const loan = await this.loansService.rejectLoan(loanId, reason);
    if (loan) {
      this.logger.log(`${this.logEmoji} [SAGA] ❌ Préstamo ${loanId} rechazado (FAILED)`);
      
      const sagaRecord = this.pendingSagas.get(loanId);
      if (sagaRecord) {
        sagaRecord.status = 'rejected';
      }
    }
  }

  /**
   * Estado de la estrategia
   */
  getStatus() {
    const pendingArray = Array.from(this.pendingSagas.values());
    
    return {
      strategy: this.name,
      description: this.description,
      timeout: this.sagaTimeout,
      pendingSagas: pendingArray.filter(s => s.status === 'pending').length,
      confirmedSagas: pendingArray.filter(s => s.status === 'confirmed').length,
      rejectedSagas: pendingArray.filter(s => s.status === 'rejected').length,
      recentSagas: pendingArray.slice(-5), // Últimas 5 SAGAs
    };
  }
}

