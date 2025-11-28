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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilienceService = void 0;
const common_1 = require("@nestjs/common");
const none_strategy_1 = require("./strategies/none.strategy");
const circuit_breaker_strategy_1 = require("./strategies/circuit-breaker.strategy");
const saga_strategy_1 = require("./strategies/saga.strategy");
const outbox_strategy_1 = require("./strategies/outbox.strategy");
let ResilienceService = class ResilienceService {
    constructor(noneStrategy, circuitBreakerStrategy, sagaStrategy, outboxStrategy) {
        this.noneStrategy = noneStrategy;
        this.circuitBreakerStrategy = circuitBreakerStrategy;
        this.sagaStrategy = sagaStrategy;
        this.outboxStrategy = outboxStrategy;
        this.logger = new common_1.Logger('ResilienceService');
        this.strategyName = (process.env.RESILIENCE_STRATEGY || 'none');
        this.activeStrategy = this.selectStrategy(this.strategyName);
    }
    onModuleInit() {
        this.logger.log('');
        this.logger.log('🎯 =========================================');
        this.logger.log('🎯 RESILIENCE SERVICE INICIALIZADO');
        this.logger.log('🎯 =========================================');
        this.logger.log(`🎯 Estrategia activa: ${this.activeStrategy.name.toUpperCase()}`);
        this.logger.log(`🎯 Descripción: ${this.activeStrategy.description}`);
        this.logger.log('🎯 =========================================');
        this.logger.log('');
        this.logStrategyInfo();
    }
    selectStrategy(name) {
        const strategies = {
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
    logStrategyInfo() {
        const infoByStrategy = {
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
    getActiveStrategy() {
        return this.activeStrategy;
    }
    getActiveStrategyName() {
        return this.activeStrategy.name;
    }
    async createLoan(loanData) {
        this.logger.log(`📚 Creando préstamo con estrategia: ${this.activeStrategy.name}`);
        return this.activeStrategy.createLoan(loanData);
    }
    getAvailableStrategies() {
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
    getStatus() {
        const baseStatus = {
            activeStrategy: this.activeStrategy.name,
            description: this.activeStrategy.description,
            emoji: this.activeStrategy.logEmoji,
        };
        if (this.activeStrategy.getStatus) {
            return {
                ...baseStatus,
                strategyStatus: this.activeStrategy.getStatus(),
            };
        }
        return baseStatus;
    }
};
exports.ResilienceService = ResilienceService;
exports.ResilienceService = ResilienceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [none_strategy_1.NoneStrategy,
        circuit_breaker_strategy_1.CircuitBreakerStrategy,
        saga_strategy_1.SagaStrategy,
        outbox_strategy_1.OutboxStrategy])
], ResilienceService);
//# sourceMappingURL=resilience.service.js.map