/**
 * ESTRATEGIA CIRCUIT BREAKER - Protección contra servicios caídos
 * 
 * Implementa el patrón Circuit Breaker usando la librería 'opossum'.
 * 
 * @educational El Circuit Breaker funciona como un "fusible eléctrico":
 * 
 * Estados del circuito:
 * 1. CLOSED (🟢): Todo funciona normal, las peticiones pasan
 * 2. OPEN (🔴): Demasiados errores, rechaza peticiones inmediatamente
 * 3. HALF-OPEN (🟡): Prueba con algunas peticiones para ver si el servicio se recuperó
 * 
 * Flujo:
 * - Estado inicial: CLOSED
 * - Si hay X% de errores → pasa a OPEN
 * - Después de Y segundos → pasa a HALF-OPEN
 * - Si las pruebas funcionan → vuelve a CLOSED
 * - Si las pruebas fallan → vuelve a OPEN
 * 
 * Beneficios:
 * - Falla rápido: No espera timeout si el servicio está caído
 * - Protege recursos: No satura un servicio que está luchando
 * - Auto-recuperación: Detecta cuando el servicio vuelve a funcionar
 */

import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import CircuitBreaker from 'opossum';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';

@Injectable()
export class CircuitBreakerStrategy implements ResilienceStrategy, OnModuleInit {
  readonly name = 'circuit-breaker';
  readonly description = 'Circuit Breaker - Protección contra servicios caídos usando opossum';
  readonly logEmoji = '🟡';

  private readonly logger = new Logger('CircuitBreakerStrategy');
  private breaker: CircuitBreaker<[string], any>;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {}

  /**
   * Inicializar el Circuit Breaker al cargar el módulo
   */
  onModuleInit() {
    this.initializeCircuitBreaker();
  }

  /**
   * Configurar el Circuit Breaker con opciones desde variables de entorno
   */
  private initializeCircuitBreaker() {
    // Opciones del Circuit Breaker
    const options = {
      // Timeout para cada operación (ms)
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000'),
      
      // Porcentaje de errores para abrir el circuito
      errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50'),
      
      // Tiempo que permanece abierto antes de probar (ms)
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000'),
      
      // Número mínimo de peticiones antes de calcular el porcentaje
      volumeThreshold: 5,
      
      // Tamaño de la ventana de tiempo para métricas
      rollingCountTimeout: 10000,
    };

    this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Inicializando con configuración:`);
    this.logger.log(`${this.logEmoji}   - Timeout: ${options.timeout}ms`);
    this.logger.log(`${this.logEmoji}   - Error Threshold: ${options.errorThresholdPercentage}%`);
    this.logger.log(`${this.logEmoji}   - Reset Timeout: ${options.resetTimeout}ms`);

    // Crear el Circuit Breaker para la función de verificación de disponibilidad
    this.breaker = new CircuitBreaker(
      (bookId: string) => this.checkBookAvailability(bookId),
      options,
    );

    // Configurar event listeners para logs educativos
    this.setupEventListeners();
  }

  /**
   * Configurar listeners para los eventos del Circuit Breaker
   * 
   * @educational Estos eventos ayudan a entender el comportamiento del CB
   */
  private setupEventListeners() {
    // Circuito se abre (demasiados errores)
    this.breaker.on('open', () => {
      this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] 🔴 CIRCUITO ABIERTO`);
      this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] Las peticiones serán rechazadas inmediatamente`);
      this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] Se reintentará en ${this.breaker.options.resetTimeout}ms`);
    });

    // Circuito pasa a half-open (probando)
    this.breaker.on('halfOpen', () => {
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] 🟡 CIRCUITO HALF-OPEN`);
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Probando si books-service se recuperó...`);
    });

    // Circuito se cierra (todo OK)
    this.breaker.on('close', () => {
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] 🟢 CIRCUITO CERRADO`);
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] books-service está funcionando correctamente`);
    });

    // Fallback ejecutado (circuito abierto)
    this.breaker.on('fallback', () => {
      this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] ⚡ Fallback ejecutado - Circuito abierto`);
    });

    // Petición exitosa
    this.breaker.on('success', () => {
      this.logger.debug(`${this.logEmoji} [CIRCUIT-BREAKER] ✅ Petición exitosa`);
    });

    // Petición fallida
    this.breaker.on('failure', (error) => {
      this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ❌ Petición fallida: ${error?.message}`);
    });

    // Timeout
    this.breaker.on('timeout', () => {
      this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ⏱️ Timeout alcanzado`);
    });

    // Petición rechazada (circuito abierto)
    this.breaker.on('reject', () => {
      this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] 🚫 Petición rechazada - Circuito abierto`);
    });
  }

  /**
   * Función protegida: Verificar disponibilidad del libro
   * Esta función será "envuelta" por el Circuit Breaker
   */
  private async checkBookAvailability(bookId: string): Promise<any> {
    const response = await firstValueFrom(
      this.booksClient.send('book.check.availability', { bookId }).pipe(
        timeout(parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000')),
        catchError((error) => {
          throw new Error(`Error de comunicación: ${error.message}`);
        }),
      ),
    );

    if (!response.success) {
      throw new Error(response.error || 'Error en books-service');
    }

    return response;
  }

  /**
   * Crear préstamo usando Circuit Breaker
   */
  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Iniciando préstamo para libro: ${loanData.bookId}`);
    this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Estado actual del circuito: ${this.getCircuitState()}`);

    try {
      // 1. Verificar disponibilidad a través del Circuit Breaker
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Consultando disponibilidad (protegido por CB)...`);
      
      const response = await this.breaker.fire(loanData.bookId);

      // 2. Verificar si el libro está disponible
      if (!response.available) {
        this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] Libro no disponible: ${loanData.bookId}`);
        return {
          success: false,
          error: 'El libro no está disponible para préstamo',
          details: {
            strategy: this.name,
            circuitState: this.getCircuitState(),
          },
        };
      }

      // 3. Crear el préstamo
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Libro disponible, creando préstamo...`);
      const loan = await this.loansService.create(loanData, 'active');

      // 4. Emitir evento para marcar libro como prestado
      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Emitiendo evento book.loan.requested...`);
      this.booksClient.emit('book.loan.requested', {
        bookId: loanData.bookId,
        loanId: loan.id,
      });

      this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] ✅ Préstamo creado: ${loan.id}`);

      return {
        success: true,
        loan,
        details: {
          strategy: this.name,
          circuitState: this.getCircuitState(),
          message: 'Préstamo creado con protección Circuit Breaker',
        },
      };

    } catch (error) {
      const circuitState = this.getCircuitState();
      this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ❌ Error: ${error.message}`);
      this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] Estado del circuito: ${circuitState}`);

      // Mensaje diferente si el circuito está abierto
      const isCircuitOpen = this.breaker.opened;
      const errorMessage = isCircuitOpen
        ? 'Circuito abierto: books-service no está disponible. Intente más tarde.'
        : error.message;

      return {
        success: false,
        error: errorMessage,
        details: {
          strategy: this.name,
          circuitState,
          isCircuitOpen,
          stats: this.breaker.stats,
          hint: isCircuitOpen
            ? `El circuito se reabrirá en aproximadamente ${this.breaker.options.resetTimeout}ms`
            : 'El error se registró en las estadísticas del Circuit Breaker',
        },
      };
    }
  }

  /**
   * Obtener estado legible del circuito
   */
  private getCircuitState(): string {
    if (this.breaker.opened) return 'OPEN (🔴)';
    if (this.breaker.halfOpen) return 'HALF-OPEN (🟡)';
    return 'CLOSED (🟢)';
  }

  /**
   * Estado completo de la estrategia
   */
  getStatus() {
    return {
      strategy: this.name,
      description: this.description,
      circuitState: this.getCircuitState(),
      isOpen: this.breaker.opened,
      isHalfOpen: this.breaker.halfOpen,
      isClosed: this.breaker.closed,
      stats: {
        successes: this.breaker.stats.successes,
        failures: this.breaker.stats.failures,
        rejects: this.breaker.stats.rejects,
        timeouts: this.breaker.stats.timeouts,
        fallbacks: this.breaker.stats.fallbacks,
      },
      config: {
        timeout: this.breaker.options.timeout,
        errorThresholdPercentage: this.breaker.options.errorThresholdPercentage,
        resetTimeout: this.breaker.options.resetTimeout,
      },
    };
  }
}

