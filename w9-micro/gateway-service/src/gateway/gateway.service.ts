/**
 * GATEWAY SERVICE
 * 
 * Servicio con funcionalidades comunes del gateway:
 * - Health check de servicios
 * - Información del sistema
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger('GatewayService');

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Verificar salud de todos los servicios
   */
  async checkAllServicesHealth(): Promise<{
    gateway: ServiceHealth;
    booksService: ServiceHealth;
    loansService: ServiceHealth;
    overall: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    this.logger.log('🏥 Verificando salud de todos los servicios...');

    const [booksHealth, loansHealth] = await Promise.all([
      this.checkBooksServiceHealth(),
      this.checkLoansServiceHealth(),
    ]);

    const gatewayHealth: ServiceHealth = {
      name: 'gateway-service',
      status: 'healthy',
    };

    // Determinar estado general
    const allHealthy = booksHealth.status === 'healthy' && loansHealth.status === 'healthy';
    const allUnhealthy = booksHealth.status === 'unhealthy' && loansHealth.status === 'unhealthy';
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      overall = 'healthy';
    } else if (allUnhealthy) {
      overall = 'unhealthy';
    } else {
      overall = 'degraded';
    }

    return {
      gateway: gatewayHealth,
      booksService: booksHealth,
      loansService: loansHealth,
      overall,
    };
  }

  /**
   * Verificar salud de books-service via RabbitMQ
   */
  private async checkBooksServiceHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.booksClient.send('book.find.all', {}).pipe(
          timeout(3000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      const responseTime = Date.now() - startTime;

      if (response.success) {
        return {
          name: 'books-service',
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          name: 'books-service',
          status: 'unhealthy',
          responseTime,
          error: response.error,
        };
      }
    } catch (error) {
      return {
        name: 'books-service',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Verificar salud de loans-service via HTTP
   */
  private async checkLoansServiceHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const loansUrl = process.env.LOANS_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${loansUrl}/loans/strategy`).pipe(
          timeout(3000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      const responseTime = Date.now() - startTime;

      return {
        name: 'loans-service',
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        name: 'loans-service',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Obtener información del sistema
   */
  getSystemInfo() {
    return {
      name: 'Microservices Resilience Demo',
      version: '1.0.0',
      description: 'Proyecto educativo de microservicios con estrategias de resiliencia',
      services: [
        {
          name: 'gateway-service',
          port: 3000,
          description: 'API Gateway - Punto de entrada único',
        },
        {
          name: 'books-service',
          transport: 'RabbitMQ',
          description: 'Catálogo de libros',
        },
        {
          name: 'loans-service',
          port: 3002,
          description: 'Gestión de préstamos con resiliencia',
        },
      ],
      endpoints: {
        books: [
          'GET /api/books',
          'GET /api/books/available',
          'GET /api/books/:id',
          'POST /api/books',
        ],
        loans: [
          'GET /api/loans',
          'GET /api/loans/active',
          'GET /api/loans/strategy',
          'POST /api/loans',
          'POST /api/loans/:id/return',
        ],
        system: [
          'GET /api/health',
          'GET /api/info',
        ],
      },
    };
  }
}

