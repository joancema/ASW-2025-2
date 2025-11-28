/**
 * LOGGING INTERCEPTOR
 * 
 * Interceptor que registra todas las peticiones entrantes y salientes.
 * 
 * @educational Los interceptores en NestJS permiten:
 * - Ejecutar código antes/después de una petición
 * - Transformar respuestas
 * - Medir tiempos de respuesta
 * - Logging centralizado
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Gateway');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    // Log de entrada
    this.logger.log(`📥 ${method} ${url}`);
    
    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`📥 Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(`📤 ${method} ${url} - ${responseTime}ms ✅`);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(`📤 ${method} ${url} - ${responseTime}ms ❌ ${error.message}`);
        },
      }),
    );
  }
}

