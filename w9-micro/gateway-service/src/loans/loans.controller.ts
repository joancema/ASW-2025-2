/**
 * LOANS CONTROLLER (Gateway Proxy)
 * 
 * Controlador que actúa como proxy para loans-service.
 * Recibe peticiones HTTP y las reenvía a loans-service.
 * 
 * @educational Este proxy demuestra:
 * - Comunicación HTTP entre microservicios
 * - El gateway como punto de entrada único
 * - Manejo de errores centralizado
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';

interface CreateLoanDto {
  bookId: string;
  userId: string;
  userName: string;
}

@Controller('loans')
export class LoansController {
  private readonly logger = new Logger('LoansProxy');
  private readonly loansServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.loansServiceUrl = process.env.LOANS_SERVICE_URL || 'http://localhost:3002';
    this.logger.log(`📖 Loans proxy configurado → ${this.loansServiceUrl}`);
  }

  /**
   * GET /api/loans - Listar todos los préstamos
   */
  @Get()
  async findAll() {
    this.logger.log('📖 GET /api/loans → loans-service');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.loansServiceUrl}/loans`).pipe(
          catchError((error) => {
            this.logger.error(`❌ Error: ${error.message}`);
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/loans/active - Listar préstamos activos
   */
  @Get('active')
  async findActive() {
    this.logger.log('📖 GET /api/loans/active → loans-service');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.loansServiceUrl}/loans/active`).pipe(
          catchError((error) => {
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/loans/pending - Listar préstamos pendientes (SAGA)
   */
  @Get('pending')
  async findPending() {
    this.logger.log('📖 GET /api/loans/pending → loans-service');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.loansServiceUrl}/loans/pending`).pipe(
          catchError((error) => {
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/loans/strategy - Ver estrategia de resiliencia activa
   */
  @Get('strategy')
  async getStrategy() {
    this.logger.log('📖 GET /api/loans/strategy → loans-service');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.loansServiceUrl}/loans/strategy`).pipe(
          catchError((error) => {
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * GET /api/loans/:id - Obtener un préstamo por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`📖 GET /api/loans/${id} → loans-service`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.loansServiceUrl}/loans/${id}`).pipe(
          catchError((error) => {
            if (error.response?.status === 404) {
              throw new HttpException('Préstamo no encontrado', HttpStatus.NOT_FOUND);
            }
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /api/loans - Crear un nuevo préstamo
   * 
   * @educational Este endpoint usa la estrategia de resiliencia
   * configurada en loans-service. El gateway solo reenvía la petición.
   */
  @Post()
  async create(@Body() createLoanDto: CreateLoanDto) {
    this.logger.log('📖 POST /api/loans → loans-service');
    this.logger.log(`📖 BookId: ${createLoanDto.bookId}, User: ${createLoanDto.userName}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.loansServiceUrl}/loans`, createLoanDto).pipe(
          catchError((error) => {
            this.logger.error(`❌ Error de loans-service: ${error.response?.data?.error || error.message}`);
            
            // Propagar el error del servicio
            if (error.response?.data) {
              throw new HttpException(
                error.response.data,
                error.response.status || HttpStatus.BAD_REQUEST,
              );
            }
            
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      this.logger.log(`📖 Préstamo creado: ${response.data?.data?.id}`);
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /api/loans/:id/return - Devolver un libro
   */
  @Post(':id/return')
  async returnLoan(@Param('id') id: string) {
    this.logger.log(`📖 POST /api/loans/${id}/return → loans-service`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.loansServiceUrl}/loans/${id}/return`).pipe(
          catchError((error) => {
            if (error.response?.data) {
              throw new HttpException(
                error.response.data,
                error.response.status || HttpStatus.BAD_REQUEST,
              );
            }
            throw new HttpException(
              'loans-service no disponible',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      this.logger.log(`📖 Libro devuelto correctamente`);
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

