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
exports.GatewayService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let GatewayService = class GatewayService {
    constructor(booksClient, httpService) {
        this.booksClient = booksClient;
        this.httpService = httpService;
        this.logger = new common_1.Logger('GatewayService');
    }
    async checkAllServicesHealth() {
        this.logger.log('🏥 Verificando salud de todos los servicios...');
        const [booksHealth, loansHealth] = await Promise.all([
            this.checkBooksServiceHealth(),
            this.checkLoansServiceHealth(),
        ]);
        const gatewayHealth = {
            name: 'gateway-service',
            status: 'healthy',
        };
        const allHealthy = booksHealth.status === 'healthy' && loansHealth.status === 'healthy';
        const allUnhealthy = booksHealth.status === 'unhealthy' && loansHealth.status === 'unhealthy';
        let overall;
        if (allHealthy) {
            overall = 'healthy';
        }
        else if (allUnhealthy) {
            overall = 'unhealthy';
        }
        else {
            overall = 'degraded';
        }
        return {
            gateway: gatewayHealth,
            booksService: booksHealth,
            loansService: loansHealth,
            overall,
        };
    }
    async checkBooksServiceHealth() {
        const startTime = Date.now();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.find.all', {}).pipe((0, rxjs_1.timeout)(3000), (0, rxjs_1.catchError)((error) => {
                throw error;
            })));
            const responseTime = Date.now() - startTime;
            if (response.success) {
                return {
                    name: 'books-service',
                    status: 'healthy',
                    responseTime,
                };
            }
            else {
                return {
                    name: 'books-service',
                    status: 'unhealthy',
                    responseTime,
                    error: response.error,
                };
            }
        }
        catch (error) {
            return {
                name: 'books-service',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message,
            };
        }
    }
    async checkLoansServiceHealth() {
        const startTime = Date.now();
        const loansUrl = process.env.LOANS_SERVICE_URL || 'http://localhost:3002';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${loansUrl}/loans/strategy`).pipe((0, rxjs_1.timeout)(3000), (0, rxjs_1.catchError)((error) => {
                throw error;
            })));
            const responseTime = Date.now() - startTime;
            return {
                name: 'loans-service',
                status: 'healthy',
                responseTime,
            };
        }
        catch (error) {
            return {
                name: 'loans-service',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error.message,
            };
        }
    }
    getSystemInfo() {
        return {
            name: 'Microservices Resilience Demo',
            version: '1.0.0',
            description: 'Proyecto educativo de microservicios con estrategias de resiliencia',
            services: [
                {
                    name: 'gateway-service',
                    port: 3000,
                    description: 'API Gateway - Punto de entrada único',
                },
                {
                    name: 'books-service',
                    transport: 'RabbitMQ',
                    description: 'Catálogo de libros',
                },
                {
                    name: 'loans-service',
                    port: 3002,
                    description: 'Gestión de préstamos con resiliencia',
                },
            ],
            endpoints: {
                books: [
                    'GET /api/books',
                    'GET /api/books/available',
                    'GET /api/books/:id',
                    'POST /api/books',
                ],
                loans: [
                    'GET /api/loans',
                    'GET /api/loans/active',
                    'GET /api/loans/strategy',
                    'POST /api/loans',
                    'POST /api/loans/:id/return',
                ],
                system: [
                    'GET /api/health',
                    'GET /api/info',
                ],
            },
        };
    }
};
exports.GatewayService = GatewayService;
exports.GatewayService = GatewayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        axios_1.HttpService])
], GatewayService);
//# sourceMappingURL=gateway.service.js.map