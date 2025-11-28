/**
 * DTOs para el módulo de préstamos
 * 
 * @educational Los DTOs (Data Transfer Objects) definen la estructura
 * de los datos que se reciben en las peticiones. Ayudan a:
 * - Documentar la API
 * - Validar datos de entrada
 * - Separar la capa de transporte de la lógica de negocio
 */

/**
 * DTO para crear un nuevo préstamo
 */
export class CreateLoanDto {
  /**
   * ID del libro a prestar (UUID)
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  bookId: string;

  /**
   * ID del usuario que solicita el préstamo
   * @example "user123"
   */
  userId: string;

  /**
   * Nombre del usuario
   * @example "Juan Pérez"
   */
  userName: string;
}

/**
 * DTO para devolver un libro
 */
export class ReturnLoanDto {
  /**
   * ID del préstamo a devolver (UUID)
   */
  loanId: string;
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  strategy?: string;
}

