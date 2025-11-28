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
exports.SagaStrategy = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const loans_service_1 = require("../../loans/loans.service");
let SagaStrategy = class SagaStrategy {
    constructor(booksClient, loansService) {
        this.booksClient = booksClient;
        this.loansService = loansService;
        this.name = 'saga';
        this.description = 'SAGA - Transacciones distribuidas con compensación';
        this.logEmoji = '🟣';
        this.logger = new common_1.Logger('SagaStrategy');
        this.pendingSagas = new Map();
        this.sagaTimeout = parseInt(process.env.SAGA_TIMEOUT || '5000');
        this.logger.log(`${this.logEmoji} [SAGA] Timeout configurado: ${this.sagaTimeout}ms`);
    }
    async createLoan(loanData) {
        this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
        this.logger.log(`${this.logEmoji} [SAGA] Iniciando SAGA para libro: ${loanData.bookId}`);
        this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
        let loan = null;
        try {
            this.logger.log(`${this.logEmoji} [SAGA] Paso 1: Verificando disponibilidad...`);
            const availabilityResponse = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe((0, rxjs_1.timeout)(this.sagaTimeout), (0, rxjs_1.catchError)((error) => {
                throw new Error(`No se pudo verificar disponibilidad: ${error.message}`);
            })));
            if (!availabilityResponse.success) {
                this.logger.warn(`${this.logEmoji} [SAGA] Libro no encontrado: ${loanData.bookId}`);
                return {
                    success: false,
                    error: availabilityResponse.error || 'Libro no encontrado',
                    details: { strategy: this.name, step: 'availability_check' },
                };
            }
            if (!availabilityResponse.available) {
                this.logger.warn(`${this.logEmoji} [SAGA] Libro no disponible: ${loanData.bookId}`);
                return {
                    success: false,
                    error: 'El libro no está disponible para préstamo',
                    details: { strategy: this.name, step: 'availability_check' },
                };
            }
            this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 1 completado: Libro disponible`);
            this.logger.log(`${this.logEmoji} [SAGA] Paso 2: Creando préstamo en estado PENDING...`);
            loan = await this.loansService.createPending(loanData);
            this.logger.log(`${this.logEmoji} [SAGA] ✅ Paso 2 completado: Préstamo ${loan.id} creado (PENDING)`);
            this.pendingSagas.set(loan.id, {
                loanId: loan.id,
                bookId: loanData.bookId,
                startTime: new Date(),
                status: 'pending',
            });
            this.logger.log(`${this.logEmoji} [SAGA] Paso 3: Solicitando reserva a books-service...`);
            const reserveResponse = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.update.status', {
                id: loanData.bookId,
                status: 'loaned',
            }).pipe((0, rxjs_1.timeout)(this.sagaTimeout), (0, rxjs_1.catchError)((error) => {
                throw new Error(`Error al reservar libro: ${error.message}`);
            })));
            if (!reserveResponse.success) {
                this.logger.warn(`${this.logEmoji} [SAGA] ❌ books-service rechazó la reserva`);
                this.logger.log(`${this.logEmoji} [SAGA] Ejecutando compensación...`);
                await this.executeCompensation(loan.id, loanData.bookId, 'books-service rechazó la reserva');
                return {
                    success: false,
                    error: 'No se pudo reservar el libro',
                    details: {
                        strategy: this.name,
                        step: 'book_reservation',
                        loanId: loan.id,
                        compensation: 'Préstamo marcado como FAILED',
                    },
                };
            }
            this.logger.log(`${this.logEmoji} [SAGA] Paso 4: Confirmando préstamo...`);
            loan = await this.loansService.confirmLoan(loan.id);
            const sagaRecord = this.pendingSagas.get(loan.id);
            if (sagaRecord) {
                sagaRecord.status = 'confirmed';
            }
            this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
            this.logger.log(`${this.logEmoji} [SAGA] ✅ SAGA COMPLETADA EXITOSAMENTE`);
            this.logger.log(`${this.logEmoji} [SAGA] Préstamo: ${loan.id}`);
            this.logger.log(`${this.logEmoji} [SAGA] Estado final: ${loan.status}`);
            this.logger.log(`${this.logEmoji} [SAGA] ========================================`);
            return {
                success: true,
                loan,
                details: {
                    strategy: this.name,
                    sagaSteps: [
                        '1. Verificación de disponibilidad ✅',
                        '2. Creación de préstamo (PENDING) ✅',
                        '3. Reserva de libro ✅',
                        '4. Confirmación de préstamo ✅',
                    ],
                    message: 'SAGA completada exitosamente',
                },
            };
        }
        catch (error) {
            this.logger.error(`${this.logEmoji} [SAGA] ❌ Error en SAGA: ${error.message}`);
            if (loan) {
                this.logger.log(`${this.logEmoji} [SAGA] Ejecutando compensación por error...`);
                await this.executeCompensation(loan.id, loanData.bookId, error.message);
            }
            return {
                success: false,
                error: error.message,
                details: {
                    strategy: this.name,
                    loanId: loan?.id,
                    compensationExecuted: !!loan,
                    hint: 'La SAGA falló y se ejecutó compensación para mantener consistencia',
                },
            };
        }
    }
    async executeCompensation(loanId, bookId, reason) {
        this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
        this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Iniciando compensación`);
        this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Préstamo: ${loanId}`);
        this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Razón: ${reason}`);
        this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
        try {
            await this.loansService.rejectLoan(loanId, reason);
            this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ✅ Préstamo ${loanId} marcado como FAILED`);
            this.booksClient.emit('book.loan.saga.compensate', {
                bookId,
                loanId,
                reason,
            });
            this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ✅ Evento de compensación emitido a books-service`);
            const sagaRecord = this.pendingSagas.get(loanId);
            if (sagaRecord) {
                sagaRecord.status = 'rejected';
            }
            this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
            this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] Compensación completada`);
            this.logger.log(`${this.logEmoji} [SAGA-COMPENSATE] ========================================`);
        }
        catch (error) {
            this.logger.error(`${this.logEmoji} [SAGA-COMPENSATE] ❌ Error en compensación: ${error.message}`);
        }
    }
    async handleLoanConfirmed(loanId) {
        this.logger.log(`${this.logEmoji} [SAGA] Recibida confirmación para préstamo: ${loanId}`);
        const loan = await this.loansService.confirmLoan(loanId);
        if (loan) {
            this.logger.log(`${this.logEmoji} [SAGA] ✅ Préstamo ${loanId} confirmado (ACTIVE)`);
            const sagaRecord = this.pendingSagas.get(loanId);
            if (sagaRecord) {
                sagaRecord.status = 'confirmed';
            }
        }
    }
    async handleLoanRejected(loanId, reason) {
        this.logger.log(`${this.logEmoji} [SAGA] Recibido rechazo para préstamo: ${loanId}`);
        this.logger.log(`${this.logEmoji} [SAGA] Razón: ${reason}`);
        const loan = await this.loansService.rejectLoan(loanId, reason);
        if (loan) {
            this.logger.log(`${this.logEmoji} [SAGA] ❌ Préstamo ${loanId} rechazado (FAILED)`);
            const sagaRecord = this.pendingSagas.get(loanId);
            if (sagaRecord) {
                sagaRecord.status = 'rejected';
            }
        }
    }
    getStatus() {
        const pendingArray = Array.from(this.pendingSagas.values());
        return {
            strategy: this.name,
            description: this.description,
            timeout: this.sagaTimeout,
            pendingSagas: pendingArray.filter(s => s.status === 'pending').length,
            confirmedSagas: pendingArray.filter(s => s.status === 'confirmed').length,
            rejectedSagas: pendingArray.filter(s => s.status === 'rejected').length,
            recentSagas: pendingArray.slice(-5),
        };
    }
};
exports.SagaStrategy = SagaStrategy;
exports.SagaStrategy = SagaStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        loans_service_1.LoansService])
], SagaStrategy);
//# sourceMappingURL=saga.strategy.js.map