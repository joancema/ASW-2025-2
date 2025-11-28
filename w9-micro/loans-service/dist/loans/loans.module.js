"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const loans_controller_1 = require("./loans.controller");
const loans_service_1 = require("./loans.service");
const loan_entity_1 = require("./entities/loan.entity");
const outbox_event_entity_1 = require("./entities/outbox-event.entity");
const resilience_module_1 = require("../resilience/resilience.module");
let LoansModule = class LoansModule {
};
exports.LoansModule = LoansModule;
exports.LoansModule = LoansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([loan_entity_1.Loan, outbox_event_entity_1.OutboxEvent]),
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
            (0, common_1.forwardRef)(() => resilience_module_1.ResilienceModule),
        ],
        controllers: [loans_controller_1.LoansController],
        providers: [loans_service_1.LoansService],
        exports: [loans_service_1.LoansService, typeorm_1.TypeOrmModule],
    })
], LoansModule);
//# sourceMappingURL=loans.module.js.map