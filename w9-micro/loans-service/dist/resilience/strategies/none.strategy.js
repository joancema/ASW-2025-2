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
exports.NoneStrategy = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const loans_service_1 = require("../../loans/loans.service");
let NoneStrategy = class NoneStrategy {
    constructor(booksClient, loansService) {
        this.booksClient = booksClient;
        this.loansService = loansService;
        this.name = 'none';
        this.description = 'Sin manejo de errores - Llamada directa a books-service';
        this.logEmoji = '🔵';
        this.logger = new common_1.Logger('NoneStrategy');
    }
    async createLoan(loanData) {
        this.logger.log(`${this.logEmoji} [NONE] Iniciando préstamo para libro: ${loanData.bookId}`);
        try {
            this.logger.log(`${this.logEmoji} [NONE] Consultando disponibilidad...`);
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.check.availability', { bookId: loanData.bookId }).pipe((0, rxjs_1.timeout)(5000), (0, rxjs_1.catchError)((error) => {
                this.logger.error(`${this.logEmoji} [NONE] Error de comunicación: ${error.message}`);
                throw new Error(`No se pudo comunicar con books-service: ${error.message}`);
            })));
            this.logger.log(`${this.logEmoji} [NONE] Respuesta de books-service: ${JSON.stringify(response)}`);
            if (!response.success) {
                this.logger.warn(`${this.logEmoji} [NONE] Error en books-service: ${response.error}`);
                return {
                    success: false,
                    error: response.error || 'Error al verificar disponibilidad',
                };
            }
            if (!response.available) {
                this.logger.warn(`${this.logEmoji} [NONE] Libro no disponible: ${loanData.bookId}`);
                return {
                    success: false,
                    error: 'El libro no está disponible para préstamo',
                };
            }
            this.logger.log(`${this.logEmoji} [NONE] Libro disponible, creando préstamo...`);
            const loan = await this.loansService.create(loanData, 'active');
            this.logger.log(`${this.logEmoji} [NONE] Emitiendo evento book.loan.requested...`);
            this.booksClient.emit('book.loan.requested', {
                bookId: loanData.bookId,
                loanId: loan.id,
            });
            this.logger.log(`${this.logEmoji} [NONE] ✅ Préstamo creado exitosamente: ${loan.id}`);
            return {
                success: true,
                loan,
                details: {
                    strategy: this.name,
                    message: 'Préstamo creado con estrategia NONE (sin resiliencia)',
                },
            };
        }
        catch (error) {
            this.logger.error(`${this.logEmoji} [NONE] ❌ Error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                details: {
                    strategy: this.name,
                    hint: 'Esta estrategia no tiene protección contra fallos. Considera usar circuit-breaker, saga u outbox.',
                },
            };
        }
    }
    getStatus() {
        return {
            strategy: this.name,
            description: this.description,
            status: 'active',
            protection: 'none',
            warning: 'Esta estrategia no ofrece protección contra fallos',
        };
    }
};
exports.NoneStrategy = NoneStrategy;
exports.NoneStrategy = NoneStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        loans_service_1.LoansService])
], NoneStrategy);
//# sourceMappingURL=none.strategy.js.map