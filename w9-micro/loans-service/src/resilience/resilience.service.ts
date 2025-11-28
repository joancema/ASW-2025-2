/**
 * RESILIENCE SERVICE - Factory de Estrategias
 * 
 * Este servicio implementa el patrón FACTORY para seleccionar
 * la estrategia de resiliencia basada en la variable de entorno.
 * 
 * @educational El patrón Factory centraliza la creación de objetos:
 * - El cliente (LoansController) no necesita saber qué estrategia usa
 * - Cambiar la estrategia solo requiere cambiar una variable de entorno
 * - Fácil de extender: agregar nuevas estrategias sin modificar el cliente
 * 
 * Uso:
 * ```
 * RESILIENCE_STRATEGY=circuit-breaker npm run start
 * ```
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ResilienceStrategy, LoanResult } from './strategies/resilience-strategy.interface';
import { NoneStrategy } from './strategies/none.strategy';
import { CircuitBreakerStrategy } from './strategies/circuit-breaker.strategy';
import { SagaStrategy } from './strategies/saga.strategy';
import { OutboxStrategy } from './strategies/outbox.strategy';
import { CreateLoanDto } from '../loans/dto/create-loan.dto';

/**
 * Tipos de estrategias disponibles
 */
export type StrategyType = 'none' | 'circuit-breaker' | 'saga' | 'outbox';

@Injectable()
export class ResilienceService implements OnModuleInit {
  private readonly logger = new Logger('ResilienceService');
  private activeStrategy: ResilienceStrategy;
  private readonly strategyName: StrategyType;

  constructor(
    private readonly noneStrategy: NoneStrategy,
    private readonly circuitBreakerStrategy: CircuitBreakerStrategy,
    private readonly sagaStrategy: SagaStrategy,
    private readonly outboxStrategy: OutboxStrategy,
  ) {
    // Leer estrategia de variable de entorno
    this.strategyName = (process.env.RESILIENCE_STRATEGY || 'none') as StrategyType;
    
    // Seleccionar la estrategia correspondiente
    this.activeStrategy = this.selectStrategy(this.strategyName);
  }

  /**
   * Inicialización del módulo
   */
  onModuleInit() {
    this.logger.log('');
    this.logger.log('🎯 =========================================');
    this.logger.log('🎯 RESILIENCE SERVICE INICIALIZADO');
    this.logger.log('🎯 =========================================');
    this.logger.log(`🎯 Estrategia activa: ${this.activeStrategy.name.toUpperCase()}`);
    this.logger.log(`🎯 Descripción: ${this.activeStrategy.description}`);
    this.logger.log('🎯 =========================================');
    this.logger.log('');
    
    // Información educativa sobre la estrategia seleccionada
    this.logStrategyInfo();
  }

  /**
   * Seleccionar estrategia basada en el nombre
   */
  private selectStrategy(name: StrategyType): ResilienceStrategy {
    const strategies: Record<StrategyType, ResilienceStrategy> = {
      'none': this.noneStrategy,
      'circuit-breaker': this.circuitBreakerStrategy,
      'saga': this.sagaStrategy,
      'outbox': this.outboxStrategy,
    };

    const strategy = strategies[name];
    
    if (!strategy) {
      this.logger.warn(`⚠️ Estrategia '${name}' no reconocida, usando 'none'`);
      return this.noneStrategy;
    }

    return strategy;
  }

  /**
   * Mostrar información educativa sobre la estrategia seleccionada
   */
  private logStrategyInfo() {
    const infoByStrategy: Record<StrategyType, string[]> = {
      'none': [
        '📘 ESTRATEGIA NONE - Sin protección',
        '   • Las peticiones van directamente a books-service',
        '   • Si books-service falla → Error inmediato',
        '   • Útil para demostrar el problema base',
        '   • NO USAR EN PRODUCCIÓN',
      ],
      'circuit-breaker': [
        '📘 ESTRATEGIA CIRCUIT BREAKER - Protección contra cascadas',
        '   • Usa la librería opossum',
        '   • Estados: CLOSED (🟢) → OPEN (🔴) → HALF-OPEN (🟡)',
        '   • Falla rápido cuando el servicio está caído',
        '   • Se auto-recupera cuando el servicio vuelve',
      ],
      'saga': [
        '📘 ESTRATEGIA SAGA - Transacciones distribuidas',
        '   • Préstamo inicia en estado PENDING',
        '   • Espera confirmación de books-service',
        '   • Si falla, ejecuta compensación',
        '   • Mantiene consistencia eventual',
      ],
      'outbox': [
        '📘 ESTRATEGIA OUTBOX - Garantía de entrega',
        '   • Guarda eventos en tabla outbox',
        '   • Worker procesa eventos pendientes',
        '   • Reintentos automáticos',
        '   • Garantiza que ningún evento se pierda',
      ],
    };

    const info = infoByStrategy[this.strategyName] || [];
    info.forEach(line => this.logger.log(line));
  }

  /**
   * Obtener la estrategia activa
   */
  getActiveStrategy(): ResilienceStrategy {
    return this.activeStrategy;
  }

  /**
   * Obtener el nombre de la estrategia activa
   */
  getActiveStrategyName(): string {
    return this.activeStrategy.name;
  }

  /**
   * Crear un préstamo usando la estrategia activa
   * 
   * @educational Este método delega la creación del préstamo
   * a la estrategia configurada. El llamador no necesita
   * saber qué estrategia se está usando.
   */
  async createLoan(loanData: CreateLoanDto): Promise<LoanResult> {
    this.logger.log(`📚 Creando préstamo con estrategia: ${this.activeStrategy.name}`);
    return this.activeStrategy.createLoan(loanData);
  }

  /**
   * Obtener información sobre todas las estrategias disponibles
   */
  getAvailableStrategies(): Array<{
    name: string;
    description: string;
    isActive: boolean;
    envValue: string;
  }> {
    return [
      {
        name: 'NONE',
        description: 'Sin manejo de errores - Llamada directa',
        isActive: this.strategyName === 'none',
        envValue: 'none',
      },
      {
        name: 'CIRCUIT BREAKER',
        description: 'Protección contra servicios caídos con opossum',
        isActive: this.strategyName === 'circuit-breaker',
        envValue: 'circuit-breaker',
      },
      {
        name: 'SAGA',
        description: 'Transacciones distribuidas con compensación',
        isActive: this.strategyName === 'saga',
        envValue: 'saga',
      },
      {
        name: 'OUTBOX',
        description: 'Garantía de entrega con reintentos',
        isActive: this.strategyName === 'outbox',
        envValue: 'outbox',
      },
    ];
  }

  /**
   * Obtener estado de la estrategia activa
   */
  getStatus(): any {
    const baseStatus = {
      activeStrategy: this.activeStrategy.name,
      description: this.activeStrategy.description,
      emoji: this.activeStrategy.logEmoji,
    };

    // Agregar estado específico de la estrategia si tiene método getStatus
    if (this.activeStrategy.getStatus) {
      return {
        ...baseStatus,
        strategyStatus: this.activeStrategy.getStatus(),
      };
    }

    return baseStatus;
  }
}

