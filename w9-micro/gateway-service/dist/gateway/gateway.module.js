"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const gateway_controller_1 = require("./gateway.controller");
const gateway_service_1 = require("./gateway.service");
let GatewayModule = class GatewayModule {
};
exports.GatewayModule = GatewayModule;
exports.GatewayModule = GatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
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
        ],
        controllers: [gateway_controller_1.GatewayController],
        providers: [gateway_service_1.GatewayService],
        exports: [gateway_service_1.GatewayService],
    })
], GatewayModule);
//# sourceMappingURL=gateway.module.js.map