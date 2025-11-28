/**
 * LOANS SERVICE
 * 
 * Servicio con la lógica de negocio para gestionar préstamos.
 * 
 * @educational Este servicio proporciona operaciones básicas de CRUD.
 * La lógica de resiliencia se delega a las estrategias en ResilienceModule.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
  ) {}

  /**
   * Crear un préstamo con estado inicial
   * @param dto Datos del préstamo
   * @param status Estado inicial (default: 'active')
   */
  async create(dto: CreateLoanDto, status: LoanStatus = 'active'): Promise<Loan> {
    this.logger.log(`📝 Creando préstamo - Libro: ${dto.bookId}, Usuario: ${dto.userName}`);
    
    const loan = this.loanRepository.create({
      bookId: dto.bookId,
      userId: dto.userId,
      userName: dto.userName,
      status,
      returnDate: null,
      failureReason: null,
    });
    
    const savedLoan = await this.loanRepository.save(loan);
    this.logger.log(`✅ Préstamo creado: ${savedLoan.id} (status: ${status})`);
    
    return savedLoan;
  }

  /**
   * Crear un préstamo en estado PENDING (para SAGA)
   */
  async createPending(dto: CreateLoanDto): Promise<Loan> {
    return this.create(dto, 'pending');
  }

  /**
   * Obtener todos los préstamos
   */
  async findAll(): Promise<Loan[]> {
    return this.loanRepository.find({
      order: { loanDate: 'DESC' },
    });
  }

  /**
   * Obtener préstamos activos
   */
  async findActive(): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { status: 'active' },
      order: { loanDate: 'DESC' },
    });
  }

  /**
   * Obtener préstamos pendientes (para SAGA)
   */
  async findPending(): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { status: 'pending' },
      order: { loanDate: 'DESC' },
    });
  }

  /**
   * Buscar préstamo por ID
   */
  async findOne(id: string): Promise<Loan | null> {
    return this.loanRepository.findOne({ where: { id } });
  }

  /**
   * Actualizar estado del préstamo
   */
  async updateStatus(id: string, status: LoanStatus, failureReason?: string): Promise<Loan | null> {
    const loan = await this.findOne(id);
    if (!loan) {
      this.logger.warn(`⚠️ Préstamo no encontrado: ${id}`);
      return null;
    }
    
    loan.status = status;
    if (failureReason) {
      loan.failureReason = failureReason;
    }
    if (status === 'returned') {
      loan.returnDate = new Date();
    }
    
    const updated = await this.loanRepository.save(loan);
    this.logger.log(`📝 Préstamo ${id} actualizado a ${status}`);
    
    return updated;
  }

  /**
   * Confirmar préstamo (SAGA: pending -> active)
   */
  async confirmLoan(id: string): Promise<Loan | null> {
    return this.updateStatus(id, 'active');
  }

  /**
   * Rechazar préstamo (SAGA: pending -> failed)
   */
  async rejectLoan(id: string, reason: string): Promise<Loan | null> {
    return this.updateStatus(id, 'failed', reason);
  }

  /**
   * Marcar préstamo como devuelto
   */
  async returnLoan(id: string): Promise<Loan | null> {
    return this.updateStatus(id, 'returned');
  }

  // =========================================
  // OUTBOX OPERATIONS
  // =========================================

  /**
   * Guardar evento en la tabla outbox
   */
  async saveOutboxEvent(eventType: string, payload: any): Promise<OutboxEvent> {
    this.logger.log(`🟢 [OUTBOX] Guardando evento: ${eventType}`);
    
    const event = this.outboxRepository.create({
      eventType,
      payload: JSON.stringify(payload),
      processed: false,
      retryCount: 0,
    });
    
    return this.outboxRepository.save(event);
  }

  /**
   * Obtener eventos pendientes de procesar
   */
  async getPendingOutboxEvents(maxRetries: number = 5): Promise<OutboxEvent[]> {
    return this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Marcar evento como procesado
   */
  async markEventProcessed(eventId: string): Promise<void> {
    await this.outboxRepository.update(eventId, {
      processed: true,
      processedAt: new Date(),
    });
    this.logger.log(`🟢 [OUTBOX] Evento ${eventId} marcado como procesado`);
  }

  /**
   * Incrementar contador de reintentos
   */
  async incrementRetryCount(eventId: string, error: string): Promise<void> {
    const event = await this.outboxRepository.findOne({ where: { id: eventId } });
    if (event) {
      event.retryCount += 1;
      event.lastError = error;
      await this.outboxRepository.save(event);
      this.logger.log(`🟢 [OUTBOX] Evento ${eventId} - Reintento ${event.retryCount}`);
    }
  }
}

