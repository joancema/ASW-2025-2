/**
 * BOOKS CONTROLLER
 * 
 * Controlador que maneja la comunicación via RabbitMQ.
 * Usa dos tipos de patrones:
 * 
 * 1. @MessagePattern: Request-Response (síncrono)
 *    - El cliente envía un mensaje y ESPERA una respuesta
 *    - Útil para consultas y operaciones que necesitan confirmación
 * 
 * 2. @EventPattern: Fire-and-Forget (asíncrono)
 *    - El cliente envía un evento y NO espera respuesta
 *    - Útil para notificaciones y actualizaciones
 * 
 * @educational Este controlador NO usa decoradores HTTP (@Get, @Post).
 * Solo responde a mensajes de la cola RabbitMQ.
 */

import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { BooksService, CreateBookDto } from './books.service';

@Controller()
export class BooksController {
  private readonly logger = new Logger(BooksController.name);

  constructor(private readonly booksService: BooksService) {}

  /**
   * Helper para confirmar el procesamiento del mensaje
   * @educational En RabbitMQ, debemos "acknowledge" (ack) los mensajes
   * para indicar que fueron procesados correctamente.
   */
  private acknowledgeMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  // =========================================
  // MESSAGE PATTERNS (Request-Response)
  // =========================================

  /**
   * Obtener todos los libros
   * Pattern: book.find.all
   */
  @MessagePattern('book.find.all')
  async findAll(@Ctx() context: RmqContext) {
    this.logger.log('📨 [book.find.all] Solicitud recibida');
    
    try {
      const books = await this.booksService.findAll();
      this.acknowledgeMessage(context);
      
      this.logger.log(`📨 [book.find.all] Enviando ${books.length} libros`);
      return { success: true, data: books };
    } catch (error) {
      this.logger.error(`❌ [book.find.all] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener libros disponibles
   * Pattern: book.find.available
   */
  @MessagePattern('book.find.available')
  async findAvailable(@Ctx() context: RmqContext) {
    this.logger.log('📨 [book.find.available] Solicitud recibida');
    
    try {
      const books = await this.booksService.findAvailable();
      this.acknowledgeMessage(context);
      
      this.logger.log(`📨 [book.find.available] Enviando ${books.length} libros`);
      return { success: true, data: books };
    } catch (error) {
      this.logger.error(`❌ [book.find.available] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar un libro por ID
   * Pattern: book.find.one
   */
  @MessagePattern('book.find.one')
  async findOne(@Payload() data: { id: string }, @Ctx() context: RmqContext) {
    this.logger.log(`📨 [book.find.one] Buscando libro: ${data.id}`);
    
    try {
      const book = await this.booksService.findOne(data.id);
      this.acknowledgeMessage(context);
      
      if (!book) {
        this.logger.warn(`📨 [book.find.one] Libro no encontrado: ${data.id}`);
        return { success: false, error: 'Libro no encontrado' };
      }
      
      return { success: true, data: book };
    } catch (error) {
      this.logger.error(`❌ [book.find.one] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear un nuevo libro
   * Pattern: book.create
   */
  @MessagePattern('book.create')
  async create(@Payload() data: CreateBookDto, @Ctx() context: RmqContext) {
    this.logger.log(`📨 [book.create] Creando libro: ${data.title}`);
    
    try {
      const book = await this.booksService.create(data);
      this.acknowledgeMessage(context);
      
      this.logger.log(`📨 [book.create] Libro creado: ${book.id}`);
      return { success: true, data: book };
    } catch (error) {
      this.logger.error(`❌ [book.create] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar estado de un libro
   * Pattern: book.update.status
   */
  @MessagePattern('book.update.status')
  async updateStatus(
    @Payload() data: { id: string; status: 'available' | 'loaned' },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📨 [book.update.status] Actualizando ${data.id} a ${data.status}`);
    
    try {
      const book = await this.booksService.updateStatus(data.id, data.status);
      this.acknowledgeMessage(context);
      
      if (!book) {
        return { success: false, error: 'Libro no encontrado' };
      }
      
      return { success: true, data: book };
    } catch (error) {
      this.logger.error(`❌ [book.update.status] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar disponibilidad de un libro
   * Pattern: book.check.availability
   */
  @MessagePattern('book.check.availability')
  async checkAvailability(@Payload() data: { bookId: string }, @Ctx() context: RmqContext) {
    this.logger.log(`📨 [book.check.availability] Verificando: ${data.bookId}`);
    
    try {
      const book = await this.booksService.findOne(data.bookId);
      this.acknowledgeMessage(context);
      
      if (!book) {
        return { 
          success: false, 
          available: false, 
          error: 'Libro no encontrado' 
        };
      }
      
      return { 
        success: true, 
        available: book.status === 'available',
        book: book
      };
    } catch (error) {
      this.logger.error(`❌ [book.check.availability] Error: ${error.message}`);
      this.acknowledgeMessage(context);
      return { success: false, available: false, error: error.message };
    }
  }

  // =========================================
  // EVENT PATTERNS (Fire-and-Forget)
  // =========================================

  /**
   * Evento: Solicitud de préstamo
   * Marca el libro como 'loaned'
   * 
   * @educational Este evento es disparado por loans-service cuando
   * se crea un préstamo con las estrategias NONE o CIRCUIT-BREAKER
   */
  @EventPattern('book.loan.requested')
  async handleLoanRequested(
    @Payload() data: { bookId: string; loanId?: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📩 [book.loan.requested] Préstamo solicitado para libro: ${data.bookId}`);
    
    try {
      const book = await this.booksService.markAsLoaned(data.bookId);
      this.acknowledgeMessage(context);
      
      if (book) {
        this.logger.log(`✅ [book.loan.requested] Libro ${data.bookId} marcado como prestado`);
      } else {
        this.logger.warn(`⚠️ [book.loan.requested] Libro ${data.bookId} no encontrado`);
      }
    } catch (error) {
      this.logger.error(`❌ [book.loan.requested] Error: ${error.message}`);
      this.acknowledgeMessage(context);
    }
  }

  /**
   * Evento: Devolución de libro
   * Marca el libro como 'available'
   */
  @EventPattern('book.loan.returned')
  async handleLoanReturned(
    @Payload() data: { bookId: string; loanId?: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📩 [book.loan.returned] Devolución para libro: ${data.bookId}`);
    
    try {
      const book = await this.booksService.markAsAvailable(data.bookId);
      this.acknowledgeMessage(context);
      
      if (book) {
        this.logger.log(`✅ [book.loan.returned] Libro ${data.bookId} marcado como disponible`);
      } else {
        this.logger.warn(`⚠️ [book.loan.returned] Libro ${data.bookId} no encontrado`);
      }
    } catch (error) {
      this.logger.error(`❌ [book.loan.returned] Error: ${error.message}`);
      this.acknowledgeMessage(context);
    }
  }

  /**
   * Evento SAGA: Solicitud de préstamo con confirmación
   * 
   * @educational En el patrón SAGA, books-service verifica si puede
   * prestar el libro y emite un evento de confirmación o rechazo.
   * Esto permite transacciones distribuidas con compensación.
   */
  @EventPattern('book.loan.saga.requested')
  async handleSagaLoanRequested(
    @Payload() data: { bookId: string; loanId: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`🟣 [SAGA] Solicitud de préstamo recibida - Libro: ${data.bookId}, Préstamo: ${data.loanId}`);
    
    try {
      // Verificar disponibilidad
      const book = await this.booksService.findOne(data.bookId);
      
      if (!book) {
        this.logger.warn(`🟣 [SAGA] Libro no encontrado: ${data.bookId}`);
        // Aquí emitiríamos evento de rechazo (se maneja en loans-service)
        this.acknowledgeMessage(context);
        return;
      }
      
      if (book.status !== 'available') {
        this.logger.warn(`🟣 [SAGA] Libro no disponible: ${data.bookId}`);
        this.acknowledgeMessage(context);
        return;
      }
      
      // Marcar como prestado
      await this.booksService.markAsLoaned(data.bookId);
      this.logger.log(`🟣 [SAGA] Libro ${data.bookId} marcado como prestado`);
      
      this.acknowledgeMessage(context);
    } catch (error) {
      this.logger.error(`❌ [SAGA] Error procesando préstamo: ${error.message}`);
      this.acknowledgeMessage(context);
    }
  }

  /**
   * Evento SAGA: Compensación - revertir préstamo
   * 
   * @educational Si el préstamo falla después de marcar el libro,
   * este evento revierte el cambio (compensación).
   */
  @EventPattern('book.loan.saga.compensate')
  async handleSagaCompensate(
    @Payload() data: { bookId: string; loanId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`🟣 [SAGA-COMPENSATE] Revirtiendo préstamo - Libro: ${data.bookId}`);
    this.logger.log(`🟣 [SAGA-COMPENSATE] Razón: ${data.reason}`);
    
    try {
      await this.booksService.markAsAvailable(data.bookId);
      this.logger.log(`🟣 [SAGA-COMPENSATE] Libro ${data.bookId} marcado como disponible`);
      this.acknowledgeMessage(context);
    } catch (error) {
      this.logger.error(`❌ [SAGA-COMPENSATE] Error: ${error.message}`);
      this.acknowledgeMessage(context);
    }
  }
}

