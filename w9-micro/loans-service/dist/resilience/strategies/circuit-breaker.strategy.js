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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerStrategy = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const opossum_1 = __importDefault(require("opossum"));
const loans_service_1 = require("../../loans/loans.service");
let CircuitBreakerStrategy = class CircuitBreakerStrategy {
    constructor(booksClient, loansService) {
        this.booksClient = booksClient;
        this.loansService = loansService;
        this.name = 'circuit-breaker';
        this.description = 'Circuit Breaker - Protección contra servicios caídos usando opossum';
        this.logEmoji = '🟡';
        this.logger = new common_1.Logger('CircuitBreakerStrategy');
    }
    onModuleInit() {
        this.initializeCircuitBreaker();
    }
    initializeCircuitBreaker() {
        const options = {
            timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000'),
            errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50'),
            resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000'),
            volumeThreshold: 5,
            rollingCountTimeout: 10000,
        };
        this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Inicializando con configuración:`);
        this.logger.log(`${this.logEmoji}   - Timeout: ${options.timeout}ms`);
        this.logger.log(`${this.logEmoji}   - Error Threshold: ${options.errorThresholdPercentage}%`);
        this.logger.log(`${this.logEmoji}   - Reset Timeout: ${options.resetTimeout}ms`);
        this.breaker = new opossum_1.default((bookId) => this.checkBookAvailability(bookId), options);
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.breaker.on('open', () => {
            this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] 🔴 CIRCUITO ABIERTO`);
            this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] Las peticiones serán rechazadas inmediatamente`);
            this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] Se reintentará en ${this.breaker.options.resetTimeout}ms`);
        });
        this.breaker.on('halfOpen', () => {
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] 🟡 CIRCUITO HALF-OPEN`);
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Probando si books-service se recuperó...`);
        });
        this.breaker.on('close', () => {
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] 🟢 CIRCUITO CERRADO`);
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] books-service está funcionando correctamente`);
        });
        this.breaker.on('fallback', () => {
            this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] ⚡ Fallback ejecutado - Circuito abierto`);
        });
        this.breaker.on('success', () => {
            this.logger.debug(`${this.logEmoji} [CIRCUIT-BREAKER] ✅ Petición exitosa`);
        });
        this.breaker.on('failure', (error) => {
            this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ❌ Petición fallida: ${error?.message}`);
        });
        this.breaker.on('timeout', () => {
            this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ⏱️ Timeout alcanzado`);
        });
        this.breaker.on('reject', () => {
            this.logger.warn(`${this.logEmoji} [CIRCUIT-BREAKER] 🚫 Petición rechazada - Circuito abierto`);
        });
    }
    async checkBookAvailability(bookId) {
        const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.check.availability', { bookId }).pipe((0, rxjs_1.timeout)(parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000')), (0, rxjs_1.catchError)((error) => {
            throw new Error(`Error de comunicación: ${error.message}`);
        })));
        if (!response.success) {
            throw new Error(response.error || 'Error en books-service');
        }
        return response;
    }
    async createLoan(loanData) {
        this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Iniciando préstamo para libro: ${loanData.bookId}`);
        this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Estado actual del circuito: ${this.getCircuitState()}`);
        try {
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Consultando disponibilidad (protegido por CB)...`);
            const response = await this.breaker.fire(loanData.bookId);
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
            this.logger.log(`${this.logEmoji} [CIRCUIT-BREAKER] Libro disponible, creando préstamo...`);
            const loan = await this.loansService.create(loanData, 'active');
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
        }
        catch (error) {
            const circuitState = this.getCircuitState();
            this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] ❌ Error: ${error.message}`);
            this.logger.error(`${this.logEmoji} [CIRCUIT-BREAKER] Estado del circuito: ${circuitState}`);
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
    getCircuitState() {
        if (this.breaker.opened)
            return 'OPEN (🔴)';
        if (this.breaker.halfOpen)
            return 'HALF-OPEN (🟡)';
        return 'CLOSED (🟢)';
    }
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
};
exports.CircuitBreakerStrategy = CircuitBreakerStrategy;
exports.CircuitBreakerStrategy = CircuitBreakerStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        loans_service_1.LoansService])
], CircuitBreakerStrategy);
//# sourceMappingURL=circuit-breaker.strategy.js.map