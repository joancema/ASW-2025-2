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
exports.OutboxStrategy = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const loans_service_1 = require("../../loans/loans.service");
let OutboxStrategy = class OutboxStrategy {
    constructor(booksClient, loansService) {
        this.booksClient = booksClient;
        this.loansService = loansService;
        this.name = 'outbox';
        this.description = 'Outbox - Garantía de entrega con reintentos automáticos';
        this.logEmoji = '🟢';
        this.logger = new common_1.Logger('OutboxStrategy');
        this.maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5');
        this.logger.log(`${this.logEmoji} [OUTBOX] Max reintentos configurado: ${this.maxRetries}`);
    }
    async createLoan(loanData) {
        this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
        this.logger.log(`${this.logEmoji} [OUTBOX] Iniciando préstamo con patrón Outbox`);
        this.logger.log(`${this.logEmoji} [OUTBOX] Libro: ${loanData.bookId}`);
        this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
        try {
            this.logger.log(`${this.logEmoji} [OUTBOX] Paso 1: Creando préstamo...`);
            const loan = await this.loansService.create(loanData, 'active');
            this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Préstamo creado: ${loan.id}`);
            this.logger.log(`${this.logEmoji} [OUTBOX] Paso 2: Guardando evento en outbox...`);
            const eventPayload = {
                bookId: loanData.bookId,
                loanId: loan.id,
                userId: loanData.userId,
                userName: loanData.userName,
                timestamp: new Date().toISOString(),
            };
            const outboxEvent = await this.loansService.saveOutboxEvent('book.loan.requested', eventPayload);
            this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento guardado en outbox: ${outboxEvent.id}`);
            this.logger.log(`${this.logEmoji} [OUTBOX] Paso 3: Intentando enviar evento (best effort)...`);
            try {
                this.booksClient.emit('book.loan.requested', eventPayload);
                await this.loansService.markEventProcessed(outboxEvent.id);
                this.logger.log(`${this.logEmoji} [OUTBOX] ✅ Evento enviado y marcado como procesado`);
            }
            catch (emitError) {
                this.logger.warn(`${this.logEmoji} [OUTBOX] ⚠️ Envío inmediato falló: ${emitError.message}`);
                this.logger.log(`${this.logEmoji} [OUTBOX] El worker reintentará el envío`);
            }
            this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
            this.logger.log(`${this.logEmoji} [OUTBOX] ✅ OPERACIÓN COMPLETADA`);
            this.logger.log(`${this.logEmoji} [OUTBOX] Préstamo: ${loan.id}`);
            this.logger.log(`${this.logEmoji} [OUTBOX] Evento Outbox: ${outboxEvent.id}`);
            this.logger.log(`${this.logEmoji} [OUTBOX] ========================================`);
            return {
                success: true,
                loan,
                details: {
                    strategy: this.name,
                    outboxEventId: outboxEvent.id,
                    steps: [
                        '1. Préstamo creado (ACTIVE) ✅',
                        '2. Evento guardado en outbox ✅',
                        '3. Intento de envío inmediato ✅',
                    ],
                    message: 'Préstamo creado con garantía de entrega (Outbox)',
                    hint: 'Si books-service estaba caído, el evento se reenviará automáticamente',
                },
            };
        }
        catch (error) {
            this.logger.error(`${this.logEmoji} [OUTBOX] ❌ Error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                details: {
                    strategy: this.name,
                    hint: 'Error al guardar el préstamo o el evento outbox',
                },
            };
        }
    }
    async getStatus() {
        const pendingEvents = await this.loansService.getPendingOutboxEvents(this.maxRetries);
        return {
            strategy: this.name,
            description: this.description,
            maxRetries: this.maxRetries,
            retryInterval: process.env.OUTBOX_RETRY_INTERVAL || '5000',
            pendingEvents: pendingEvents.length,
            events: pendingEvents.map(e => ({
                id: e.id,
                type: e.eventType,
                retryCount: e.retryCount,
                createdAt: e.createdAt,
            })),
        };
    }
};
exports.OutboxStrategy = OutboxStrategy;
exports.OutboxStrategy = OutboxStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        loans_service_1.LoansService])
], OutboxStrategy);
//# sourceMappingURL=outbox.strategy.js.map