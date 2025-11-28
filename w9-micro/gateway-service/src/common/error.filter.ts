/**
 * ERROR FILTER
 * 
 * Filtro de excepciones que estandariza todas las respuestas de error.
 * 
 * @educational Los filtros de excepción en NestJS permiten:
 * - Capturar excepciones globalmente
 * - Estandarizar formato de errores
 * - Logging de errores centralizado
 * - Ocultar detalles internos al cliente
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || resp.error || message;
        error = resp.error || error;
        details = resp.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log del error
    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`);
    
    if (status >= 500) {
      this.logger.error(`Stack: ${(exception as Error).stack}`);
    }

    // Respuesta estandarizada
    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        error,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}

