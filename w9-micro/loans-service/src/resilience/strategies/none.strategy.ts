/**
 * ESTRATEGIA NONE - Sin manejo de errores
 * 
 * Esta estrategia NO implementa ningún patrón de resiliencia.
 * Su propósito es DEMOSTRAR EL PROBLEMA que resuelven las otras estrategias.
 * 
 * @educational Usa esta estrategia para mostrar a los estudiantes:
 * 1. Qué pasa cuando books-service está caído
 * 2. Por qué necesitamos patrones de resiliencia
 * 3. El comportamiento "naive" de sistemas distribuidos
 * 
 * Comportamiento:
 * - Consulta books-service directamente via RabbitMQ
 * - Si books-service no responde en 5 segundos → Error
 * - Si books-service está caído → Error inmediato
 * - No hay reintentos ni protección
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class NoneStrategy implements ResilienceStrategy {
  readonly name = 'none';
  readonly description = 'Sin manejo de errores - Llamada directa a books-service';
  readonly logEmoji = '🔵';

  private readonly logger = new Logger('NoneStrategy');

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {}

  /**
   * Crear préstamo SIN ningún patrón de resiliencia
   * 
   * Flujo:
   * 1. Verificar disponibilidad del libro (RabbitMQ → books-service)
   * 2. Si está disponible, crear préstamo en loans-service
   * 3. Emitir evento para que books-service marque el libro como prestado
   * 
   * Si cualquier paso falla → Error propagado al cliente
   */
  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [NONE] Iniciando préstamo para libro: ${loanData.bookId}`);
    
    try {
      // 1. Verificar disponibilidad del libro
      this.logger.log(`${this.logEmoji} [NONE] Consultando disponibilidad...`);
      
      const response = await firstValueFrom(
        this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe(
          timeout(5000), // Timeout de 5 segundos
          catchError((error) => {
            this.logger.error(`${this.logEmoji} [NONE] Error de comunicación: ${error.message}`);
            throw new Error(`No se pudo comunicar con books-service: ${error.message}`);
          }),
        ),
      );

      this.logger.log(`${this.logEmoji} [NONE] Respuesta de books-service: ${JSON.stringify(response)}`);

      // 2. Verificar si el libro está disponible
      if (!response.success) {
        this.logger.warn(`${this.logEmoji} [NONE] Error en books-service: ${response.error}`);
        return {
          success: false,
          error: response.error || 'Error al verificar disponibilidad',
        };
      }

      if (!response.available) {
        this.logger.warn(`${this.logEmoji} [NONE] Libro no disponible: ${loanData.bookId}`);
        return {
          success: false,
          error: 'El libro no está disponible para préstamo',
        };
      }

      // 3. Crear el préstamo en estado 'active'
      this.logger.log(`${this.logEmoji} [NONE] Libro disponible, creando préstamo...`);
      const loan = await this.loansService.create(loanData, 'active');

      // 4. Emitir evento para marcar libro como prestado (fire-and-forget)
      this.logger.log(`${this.logEmoji} [NONE] Emitiendo evento book.loan.requested...`);
      this.booksClient.emit('book.loan.requested', {
        bookId: loanData.bookId,
        loanId: loan.id,
      });

      this.logger.log(`${this.logEmoji} [NONE] ✅ Préstamo creado exitosamente: ${loan.id}`);
      
      return {
        success: true,
        loan,
        details: {
          strategy: this.name,
          message: 'Préstamo creado con estrategia NONE (sin resiliencia)',
        },
      };

    } catch (error) {
      this.logger.error(`${this.logEmoji} [NONE] ❌ Error: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        details: {
          strategy: this.name,
          hint: 'Esta estrategia no tiene protección contra fallos. Considera usar circuit-breaker, saga u outbox.',
        },
      };
    }
  }

  /**
   * Estado de la estrategia (no hay estado en NONE)
   */
  getStatus() {
    return {
      strategy: this.name,
      description: this.description,
      status: 'active',
      protection: 'none',
      warning: 'Esta estrategia no ofrece protección contra fallos',
    };
  }
}

