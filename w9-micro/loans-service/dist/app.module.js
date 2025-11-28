"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const microservices_1 = require("@nestjs/microservices");
const loans_module_1 = require("./loans/loans.module");
const resilience_module_1 = require("./resilience/resilience.module");
const outbox_module_1 = require("./outbox/outbox.module");
const loan_entity_1 = require("./loans/entities/loan.entity");
const outbox_event_entity_1 = require("./loans/entities/outbox-event.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: process.env.DATABASE_NAME || 'loans.sqlite',
                entities: [loan_entity_1.Loan, outbox_event_entity_1.OutboxEvent],
                synchronize: true,
                logging: ['error', 'warn'],
            }),
            microservices_1.ClientsModule.register([
                {
                    name: 'BOOKS_SERVICE',
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
                        queue: 'books_queue',
                        queueOptions: {
                            durable: true,
                        },
                        socketOptions: {
                            heartbeatIntervalInSeconds: 60,
                            reconnectTimeInSeconds: 5,
                        },
                    },
                },
            ]),
            loans_module_1.LoansModule,
            resilience_module_1.ResilienceModule,
            outbox_module_1.OutboxModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map