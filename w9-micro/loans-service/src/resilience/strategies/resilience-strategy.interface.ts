/**
 * RESILIENCE STRATEGY INTERFACE
 * 
 * Define el contrato que deben cumplir todas las estrategias de resiliencia.
 * 
 * @educational Este es un ejemplo del PATRÓN STRATEGY:
 * - Define una familia de algoritmos (estrategias de resiliencia)
 * - Encapsula cada uno en una clase separada
 * - Permite intercambiarlos sin modificar el código cliente
 * 
 * Beneficios:
 * - Open/Closed Principle: Agregar nuevas estrategias sin modificar código existente
 * - Single Responsibility: Cada estrategia tiene su propia clase
 * - Fácil de testear: Cada estrategia se puede probar por separado
 */

import { Loan } from '../../loans/entities/loan.entity';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';

/**
 * Resultado de una operación de préstamo
 */
export interface LoanResult {
  success: boolean;
  loan?: Loan;
  error?: string;
  details?: any;
}

/**
 * Interface que todas las estrategias de resiliencia deben implementar
 */
export interface ResilienceStrategy {
  /**
   * Nombre identificador de la estrategia
   * @example 'none', 'circuit-breaker', 'saga', 'outbox'
   */
  readonly name: string;

  /**
   * Descripción educativa de la estrategia
   */
  readonly description: string;

  /**
   * Emoji para logs (ayuda a identificar visualmente)
   */
  readonly logEmoji: string;

  /**
   * Ejecutar la lógica de creación de préstamo con esta estrategia
   * 
   * @param loanData Datos del préstamo a crear
   * @returns Resultado de la operación
   * 
   * @educational Cada estrategia implementa este método de forma diferente:
   * - NONE: Llamada directa, falla si hay error
   * - CIRCUIT-BREAKER: Usa circuit breaker para proteger
   * - SAGA: Crea en estado pending, espera confirmación
   * - OUTBOX: Guarda evento en BD, worker lo procesa
   */
  createLoan(loanData: CreateLoanDto): Promise<LoanResult>;

  /**
   * Inicializar recursos necesarios para la estrategia
   * Se llama al crear la instancia
   */
  initialize?(): Promise<void>;

  /**
   * Limpiar recursos al apagar el servicio
   */
  destroy?(): Promise<void>;

  /**
   * Obtener estado actual de la estrategia (para debugging)
   */
  getStatus?(): any;
}

/**
 * Token para inyección de dependencias
 */
export const RESILIENCE_STRATEGY = 'RESILIENCE_STRATEGY';

