/**
 * LOANS CONTROLLER
 * 
 * Controlador híbrido que expone:
 * - REST API para operaciones de préstamos (clientes externos)
 * - Event Listeners para comunicación con books-service (interno)
 * 
 * @educational Este controlador demuestra:
 * - Patrón API Gateway: Punto de entrada único para clientes
 * - Delegación: Las operaciones se delegan a la estrategia de resiliencia
 * - Comunicación asíncrona: Escucha eventos de otros microservicios
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext, ClientProxy } from '@nestjs/microservices';
import { LoansService } from './loans.service';
import { ResilienceService } from '../resilience/resilience.service';
import { CreateLoanDto, ApiResponse } from './dto/create-loan.dto';
import { Loan } from './entities/loan.entity';

@Controller('loans')
export class LoansController {
  private readonly logger = new Logger('LoansController');

  constructor(
    private readonly loansService: LoansService,
    private readonly resilienceService: ResilienceService,
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
  ) {}

  // =========================================
  // REST API ENDPOINTS
  // =========================================

  /**
   * POST /loans - Crear un nuevo préstamo
   * 
   * @educational Este endpoint usa la estrategia de resiliencia configurada.
   * El cliente no necesita saber qué estrategia se está usando.
   * 
   * @example
   * curl -X POST http://localhost:3002/loans \
   *   -H "Content-Type: application/json" \
   *   -d '{"bookId": "uuid", "userId": "user1", "userName": "Juan"}'
   */
  @Post()
  async createLoan(@Body() createLoanDto: CreateLoanDto): Promise<ApiResponse<Loan>> {
    this.logger.log('📚 =========================================');
    this.logger.log('📚 POST /loans - Crear préstamo');
    this.logger.log(`📚 Libro: ${createLoanDto.bookId}`);
    this.logger.log(`📚 Usuario: ${createLoanDto.userName}`);
    this.logger.log(`📚 Estrategia: ${this.resilienceService.getActiveStrategyName()}`);
    this.logger.log('📚 =========================================');

    try {
      const result = await this.resilienceService.createLoan(createLoanDto);

      if (result.success) {
        return {
          success: true,
          data: result.loan,
          strategy: this.resilienceService.getActiveStrategyName(),
        };
      } else {
        throw new HttpException(
          {
            success: false,
            error: result.error,
            details: result.details,
            strategy: this.resilienceService.getActiveStrategyName(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Error creando préstamo: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          strategy: this.resilienceService.getActiveStrategyName(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /loans/:id/return - Devolver un libro
   * 
   * @example
   * curl -X POST http://localhost:3002/loans/uuid/return
   */
  @Post(':id/return')
  async returnLoan(@Param('id') id: string): Promise<ApiResponse<Loan>> {
    this.logger.log(`📚 POST /loans/${id}/return - Devolver libro`);

    const loan = await this.loansService.findOne(id);
    
    if (!loan) {
      throw new HttpException(
        { success: false, error: 'Préstamo no encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }

    if (loan.status === 'returned') {
      throw new HttpException(
        { success: false, error: 'El libro ya fue devuelto' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (loan.status !== 'active') {
      throw new HttpException(
        { success: false, error: `No se puede devolver un préstamo con estado: ${loan.status}` },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Marcar como devuelto
    const updatedLoan = await this.loansService.returnLoan(id);

    // Emitir evento para que books-service marque el libro como disponible
    this.booksClient.emit('book.loan.returned', {
      bookId: loan.bookId,
      loanId: id,
    });

    this.logger.log(`✅ Préstamo ${id} marcado como devuelto`);

    return {
      success: true,
      data: updatedLoan,
    };
  }

  /**
   * GET /loans - Listar todos los préstamos
   * 
   * @example
   * curl http://localhost:3002/loans
   */
  @Get()
  async findAll(): Promise<ApiResponse<Loan[]>> {
    this.logger.log('📚 GET /loans - Listar todos los préstamos');
    
    const loans = await this.loansService.findAll();
    
    return {
      success: true,
      data: loans,
    };
  }

  /**
   * GET /loans/active - Listar préstamos activos
   * 
   * @example
   * curl http://localhost:3002/loans/active
   */
  @Get('active')
  async findActive(): Promise<ApiResponse<Loan[]>> {
    this.logger.log('📚 GET /loans/active - Listar préstamos activos');
    
    const loans = await this.loansService.findActive();
    
    return {
      success: true,
      data: loans,
    };
  }

  /**
   * GET /loans/pending - Listar préstamos pendientes (SAGA)
   * 
   * @example
   * curl http://localhost:3002/loans/pending
   */
  @Get('pending')
  async findPending(): Promise<ApiResponse<Loan[]>> {
    this.logger.log('📚 GET /loans/pending - Listar préstamos pendientes');
    
    const loans = await this.loansService.findPending();
    
    return {
      success: true,
      data: loans,
    };
  }

  /**
   * GET /loans/strategy - Ver estrategia de resiliencia activa
   * 
   * @example
   * curl http://localhost:3002/loans/strategy
   */
  @Get('strategy')
  async getStrategy(): Promise<ApiResponse> {
    this.logger.log('📚 GET /loans/strategy - Info de estrategia activa');
    
    return {
      success: true,
      data: {
        active: this.resilienceService.getActiveStrategyName(),
        status: this.resilienceService.getStatus(),
        available: this.resilienceService.getAvailableStrategies(),
        howToChange: 'Cambia la variable de entorno RESILIENCE_STRATEGY y reinicia el servicio',
      },
    };
  }

  /**
   * GET /loans/:id - Obtener un préstamo por ID
   * 
   * @example
   * curl http://localhost:3002/loans/uuid
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Loan>> {
    this.logger.log(`📚 GET /loans/${id} - Obtener préstamo`);
    
    const loan = await this.loansService.findOne(id);
    
    if (!loan) {
      throw new HttpException(
        { success: false, error: 'Préstamo no encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }
    
    return {
      success: true,
      data: loan,
    };
  }

  /**
   * GET /health - Health check del servicio
   * 
   * @example
   * curl http://localhost:3002/loans/health
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse> {
    return {
      success: true,
      data: {
        status: 'healthy',
        service: 'loans-service',
        strategy: this.resilienceService.getActiveStrategyName(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =========================================
  // EVENT LISTENERS (RabbitMQ)
  // =========================================

  /**
   * Evento: Préstamo confirmado por books-service (SAGA)
   * 
   * @educational Este evento se recibe cuando books-service
   * confirma que el libro fue marcado como prestado.
   */
  @EventPattern('loan.confirmed')
  async handleLoanConfirmed(
    @Payload() data: { loanId: string; bookId: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📩 [EVENT] loan.confirmed - Préstamo: ${data.loanId}`);
    
    try {
      await this.loansService.confirmLoan(data.loanId);
      this.logger.log(`✅ Préstamo ${data.loanId} confirmado (ACTIVE)`);
      
      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error confirmando préstamo: ${error.message}`);
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    }
  }

  /**
   * Evento: Préstamo rechazado por books-service (SAGA)
   * 
   * @educational Este evento se recibe cuando books-service
   * no pudo reservar el libro (ej: ya estaba prestado).
   */
  @EventPattern('loan.rejected')
  async handleLoanRejected(
    @Payload() data: { loanId: string; bookId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📩 [EVENT] loan.rejected - Préstamo: ${data.loanId}`);
    this.logger.log(`📩 [EVENT] Razón: ${data.reason}`);
    
    try {
      await this.loansService.rejectLoan(data.loanId, data.reason);
      this.logger.log(`❌ Préstamo ${data.loanId} rechazado (FAILED)`);
      
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error rechazando préstamo: ${error.message}`);
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    }
  }
}

