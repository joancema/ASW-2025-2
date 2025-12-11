/**
 * Logger simple con colores para consola
 */

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log informativo
   */
  info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(
      `\x1b[36m[${timestamp}]\x1b[0m \x1b[34m[${this.context}]\x1b[0m ${message}`,
    );
    if (meta) {
      console.log('  ', meta);
    }
  }

  /**
   * Log de error
   */
  error(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.error(
      `\x1b[36m[${timestamp}]\x1b[0m \x1b[31m[${this.context}]\x1b[0m ❌ ${message}`,
    );
    if (meta) {
      console.error('  ', meta);
    }
  }

  /**
   * Log de debug (solo si DEBUG=true)
   */
  debug(message: string, meta?: any): void {
    if (process.env.DEBUG !== 'true') {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(
      `\x1b[36m[${timestamp}]\x1b[0m \x1b[90m[${this.context}]\x1b[0m 🔍 ${message}`,
    );
    if (meta) {
      console.log('  ', meta);
    }
  }

  /**
   * Log de éxito
   */
  success(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(
      `\x1b[36m[${timestamp}]\x1b[0m \x1b[32m[${this.context}]\x1b[0m ✅ ${message}`,
    );
    if (meta) {
      console.log('  ', meta);
    }
  }

  /**
   * Log de advertencia
   */
  warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(
      `\x1b[36m[${timestamp}]\x1b[0m \x1b[33m[${this.context}]\x1b[0m ⚠️  ${message}`,
    );
    if (meta) {
      console.warn('  ', meta);
    }
  }
}
