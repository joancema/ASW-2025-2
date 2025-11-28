"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilienceModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const resilience_service_1 = require("./resilience.service");
const none_strategy_1 = require("./strategies/none.strategy");
const circuit_breaker_strategy_1 = require("./strategies/circuit-breaker.strategy");
const saga_strategy_1 = require("./strategies/saga.strategy");
const outbox_strategy_1 = require("./strategies/outbox.strategy");
const loans_module_1 = require("../loans/loans.module");
let ResilienceModule = class ResilienceModule {
};
exports.ResilienceModule = ResilienceModule;
exports.ResilienceModule = ResilienceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'BOOKS_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://localhost:5672'],
                            queue: 'books_queue',
                            queueOptions: { durable: true },
                            socketOptions: {
                                heartbeatIntervalInSeconds: 60,
                                reconnectTimeInSeconds: 5,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
            ]),
            (0, common_1.forwardRef)(() => loans_module_1.LoansModule),
        ],
        providers: [
            none_strategy_1.NoneStrategy,
            circuit_breaker_strategy_1.CircuitBreakerStrategy,
            saga_strategy_1.SagaStrategy,
            outbox_strategy_1.OutboxStrategy,
            resilience_service_1.ResilienceService,
        ],
        exports: [
            resilience_service_1.ResilienceService,
            none_strategy_1.NoneStrategy,
            circuit_breaker_strategy_1.CircuitBreakerStrategy,
            saga_strategy_1.SagaStrategy,
            outbox_strategy_1.OutboxStrategy,
        ],
    })
], ResilienceModule);
//# sourceMappingURL=resilience.module.js.map