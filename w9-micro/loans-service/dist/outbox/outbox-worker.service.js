"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxWorkerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const microservices_1 = require("@nestjs/microservices");
const loans_service_1 = require("../loans/loans.service");
let OutboxWorkerService = class OutboxWorkerService {
    constructor(booksClient, loansService) {
        this.booksClient = booksClient;
        this.loansService = loansService;
        this.logger = new common_1.Logger('OutboxWorker');
        this.isProcessing = false;
        this.processedCount = 0;
        this.failedCount = 0;
        this.maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5');
        this.retryInterval = parseInt(process.env.OUTBOX_RETRY_INTERVAL || '5000');
    }
    onModuleInit() {
        const strategy = process.env.RESILIENCE_STRATEGY || 'none';
        if (strategy === 'outbox') {
            this.logger.log('🔄 [OUTBOX-WORKER] ========================================');
            this.logger.log('🔄 [OUTBOX-WORKER] Worker iniciado');
            this.logger.log(`🔄 [OUTBOX-WORKER] Intervalo: ${this.retryInterval}ms`);
            this.logger.log(`🔄 [OUTBOX-WORKER] Max reintentos: ${this.maxRetries}`);
            this.logger.log('🔄 [OUTBOX-WORKER] ========================================');
        }
    }
    async processOutboxEvents() {
        const strategy = process.env.RESILIENCE_STRATEGY || 'none';
        if (strategy !== 'outbox') {
            return;
        }
        if (this.isProcessing) {
            this.logger.debug('🔄 [OUTBOX-WORKER] Ya hay un procesamiento en curso, saltando...');
            return;
        }
        this.isProcessing = true;
        try {
            const pendingEvents = await this.loansService.getPendingOutboxEvents(this.maxRetries);
            if (pendingEvents.length === 0) {
                this.logger.debug('🔄 [OUTBOX-WORKER] No hay eventos pendientes');
                return;
            }
            this.logger.log(`🔄 [OUTBOX-WORKER] Procesando ${pendingEvents.length} eventos pendientes...`);
            for (const event of pendingEvents) {
                if (event.retryCount >= this.maxRetries) {
                    this.logger.warn(`🔄 [OUTBOX-WORKER] ⚠️ Evento ${event.id} excedió max reintentos (${event.retryCount}/${this.maxRetries})`);
                    continue;
                }
                await this.processEvent(event);
            }
        }
        catch (error) {
            this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error en worker: ${error.message}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async processEvent(event) {
        this.logger.log(`🔄 [OUTBOX-WORKER] Procesando evento: ${event.id}`);
        this.logger.log(`🔄 [OUTBOX-WORKER]   Tipo: ${event.eventType}`);
        this.logger.log(`🔄 [OUTBOX-WORKER]   Intento: ${event.retryCount + 1}/${this.maxRetries}`);
        try {
            const payload = event.getPayloadObject ? event.getPayloadObject() : JSON.parse(event.payload);
            this.booksClient.emit(event.eventType, payload);
            await this.loansService.markEventProcessed(event.id);
            this.processedCount++;
            this.logger.log(`🔄 [OUTBOX-WORKER] ✅ Evento ${event.id} procesado exitosamente`);
        }
        catch (error) {
            this.failedCount++;
            this.logger.error(`🔄 [OUTBOX-WORKER] ❌ Error procesando evento ${event.id}: ${error.message}`);
            await this.loansService.incrementRetryCount(event.id, error.message);
        }
    }
    getStats() {
        return {
            isProcessing: this.isProcessing,
            processedCount: this.processedCount,
            failedCount: this.failedCount,
            maxRetries: this.maxRetries,
            retryInterval: this.retryInterval,
        };
    }
    async forceProcess() {
        this.logger.log('🔄 [OUTBOX-WORKER] Forzando procesamiento...');
        await this.processOutboxEvents();
    }
};
exports.OutboxWorkerService = OutboxWorkerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxWorkerService.prototype, "processOutboxEvents", null);
exports.OutboxWorkerService = OutboxWorkerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        loans_service_1.LoansService])
], OutboxWorkerService);
//# sourceMappingURL=outbox-worker.service.js.map