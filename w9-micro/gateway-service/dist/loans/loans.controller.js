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
exports.LoansController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let LoansController = class LoansController {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger('LoansProxy');
        this.loansServiceUrl = process.env.LOANS_SERVICE_URL || 'http://localhost:3002';
        this.logger.log(`📖 Loans proxy configurado → ${this.loansServiceUrl}`);
    }
    async findAll() {
        this.logger.log('📖 GET /api/loans → loans-service');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.loansServiceUrl}/loans`).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`❌ Error: ${error.message}`);
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findActive() {
        this.logger.log('📖 GET /api/loans/active → loans-service');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.loansServiceUrl}/loans/active`).pipe((0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findPending() {
        this.logger.log('📖 GET /api/loans/pending → loans-service');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.loansServiceUrl}/loans/pending`).pipe((0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStrategy() {
        this.logger.log('📖 GET /api/loans/strategy → loans-service');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.loansServiceUrl}/loans/strategy`).pipe((0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        this.logger.log(`📖 GET /api/loans/${id} → loans-service`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.loansServiceUrl}/loans/${id}`).pipe((0, rxjs_1.catchError)((error) => {
                if (error.response?.status === 404) {
                    throw new common_1.HttpException('Préstamo no encontrado', common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(createLoanDto) {
        this.logger.log('📖 POST /api/loans → loans-service');
        this.logger.log(`📖 BookId: ${createLoanDto.bookId}, User: ${createLoanDto.userName}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.loansServiceUrl}/loans`, createLoanDto).pipe((0, rxjs_1.catchError)((error) => {
                this.logger.error(`❌ Error de loans-service: ${error.response?.data?.error || error.message}`);
                if (error.response?.data) {
                    throw new common_1.HttpException(error.response.data, error.response.status || common_1.HttpStatus.BAD_REQUEST);
                }
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            this.logger.log(`📖 Préstamo creado: ${response.data?.data?.id}`);
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async returnLoan(id) {
        this.logger.log(`📖 POST /api/loans/${id}/return → loans-service`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.loansServiceUrl}/loans/${id}/return`).pipe((0, rxjs_1.catchError)((error) => {
                if (error.response?.data) {
                    throw new common_1.HttpException(error.response.data, error.response.status || common_1.HttpStatus.BAD_REQUEST);
                }
                throw new common_1.HttpException('loans-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            this.logger.log(`📖 Libro devuelto correctamente`);
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('strategy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "getStrategy", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "returnLoan", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.Controller)('loans'),
    __metadata("design:paramtypes", [axios_1.HttpService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map