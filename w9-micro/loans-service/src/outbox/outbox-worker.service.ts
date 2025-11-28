/**
 * OUTBOX WORKER SERVICE
 * 
 * Worker que procesa eventos pendientes de la tabla outbox.
 * Implementa el patrón "Polling Publisher" del Transactional Outbox.
 * 
 * @educational Este worker es el corazón del patrón Outbox:
 * 
 * Funcionamiento:
 * 1. Cada X segundos (configurable), revisa la tabla outbox
 * 2. Encuentra eventos con processed=false y retryCount < maxRetries
 * 3. Intenta enviar cada evento a RabbitMQ
 * 4. Si tiene éxito, marca el evento como procesado
 * 5. Si falla, incrementa retryCount y guarda el error
 * 
 * Consideraciones:
 * - El intervalo debe balancear latencia vs carga en BD
 * - maxRetries evita loops infinitos
 * - Los errores se registran para debugging
 */

import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class OutboxWorkerService implements OnModuleInit {
  private readonly logger = new Logger('OutboxWorker');
  private readonly maxRetries: number;
  private readonly retryInterval: number;
  private isProcessing = false;
  private processedCount = 0;
  private failedCount = 0;

  constructor(
    @Inject('BOOKS_SERVICE') private readonly booksClient: ClientProxy,
    private readonly loansService: LoansService,
  ) {
    this.maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5');
    this.retryInterval = parseInt(process.env.OUTBOX_RETRY_INTERVAL || '5000');
  }

  onModuleInit() {
    // Solo mostrar logs si la estrategia es outbox
    const strategy = process.env.RESILIENCE_STRATEGY || 'none';
    if (strategy === 'outbox') {
      this.logger.log('🔄 [OUTBOX-WORKER] ========================================');
      this.logger.log('🔄 [OUTBOX-WORKER] Worker iniciado');
      this.logger.log(`🔄 [OUTBOX-WORKER] Intervalo: ${this.retryInterval}ms`);
      this.logger.log(`🔄 [OUTBOX-WORKER] Max reintentos: ${this.maxRetries}`);
      this.logger.log('🔄 [OUTBOX-WORKER] ========================================');
    }
  }

  /**
   * Cron job que se ejecuta cada 5 segundos (configurable)
   * 
   * @educational En producción, el intervalo debería ser configurable
   * y posiblemente más largo para reducir carga en la BD.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    // Solo procesar si la estrategia activa es outbox
    const strategy = process.env.RESILIENCE_STRATEGY || 'none';
    if (strategy !== 'outbox') {
      return;
    }

    // Evitar procesamiento concurrente
    if (this.isProcessing) {
      this.logger.debug('🔄 [OUTBOX-WORKER] Ya hay un procesamiento en curso, saltando...');
      return;
    }

    this.isProcessing = true;

    try {
      // Obtener eventos pendientes
      const pendingEvents = await this.loansService.getPendingOutboxEvents(this.maxRetries);

      if (pendingEvents.length === 0) {
        this.logger.debug('🔄 [OUTBOX-WORKER] No hay eventos pendientes');
        return;
      }

      this.logger.log(`🔄 [OUTBOX-WORKER] Procesando ${pendingEvents.length} eventos pendientes...`);

      for (const event of pendingEvents) {
        // Verificar si excedió los reintentos
        if (event.retryCount >= this.maxRetries) {
          this.logger.warn(`🔄 [OUTBOX-WORKER] ⚠️ Evento ${event.id} excedió max reintentos (${event.retryCount}/${this.maxRetries})`);
          continue;
        }

        await this.processEvent(event);
      }

    } catch (error) {
      this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error en worker: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Procesar un evento individual
   */
  private async processEvent(event: any): Promise<void> {
    this.logger.log(`🔄 [OUTBOX-WORKER] Procesando evento: ${event.id}`);
    this.logger.log(`🔄 [OUTBOX-WORKER]   Tipo: ${event.eventType}`);
    this.logger.log(`🔄 [OUTBOX-WORKER]   Intento: ${event.retryCount + 1}/${this.maxRetries}`);

    try {
      // Parsear el payload
      const payload = event.getPayloadObject ? event.getPayloadObject() : JSON.parse(event.payload);

      // Emitir el evento a RabbitMQ
      this.booksClient.emit(event.eventType, payload);

      // Marcar como procesado
      await this.loansService.markEventProcessed(event.id);
      
      this.processedCount++;
      this.logger.log(`🔄 [OUTBOX-WORKER] ✅ Evento ${event.id} procesado exitosamente`);

    } catch (error) {
      this.failedCount++;
      this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error procesando evento ${event.id}: ${error.message}`);
      
      // Incrementar contador de reintentos
      await this.loansService.incrementRetryCount(event.id, error.message);
    }
  }

  /**
   * Obtener estadísticas del worker
   */
  getStats() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      maxRetries: this.maxRetries,
      retryInterval: this.retryInterval,
    };
  }

  /**
   * Forzar procesamiento (útil para testing)
   */
  async forceProcess(): Promise<void> {
    this.logger.log('🔄 [OUTBOX-WORKER] Forzando procesamiento...');
    await this.processOutboxEvents();
  }
}

