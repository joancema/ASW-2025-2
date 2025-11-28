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
const microservices_1 = require("@nestjs/microservices");
const loans_service_1 = require("./loans.service");
const resilience_service_1 = require("../resilience/resilience.service");
const create_loan_dto_1 = require("./dto/create-loan.dto");
let LoansController = class LoansController {
    constructor(loansService, resilienceService, booksClient) {
        this.loansService = loansService;
        this.resilienceService = resilienceService;
        this.booksClient = booksClient;
        this.logger = new common_1.Logger('LoansController');
    }
    async createLoan(createLoanDto) {
        this.logger.log('📚 =========================================');
        this.logger.log('📚 POST /loans - Crear préstamo');
        this.logger.log(`📚 Libro: ${createLoanDto.bookId}`);
        this.logger.log(`📚 Usuario: ${createLoanDto.userName}`);
        this.logger.log(`📚 Estrategia: ${this.resilienceService.getActiveStrategyName()}`);
        this.logger.log('📚 =========================================');
        try {
            const result = await this.resilienceService.createLoan(createLoanDto);
            if (result.success) {
                return {
                    success: true,
                    data: result.loan,
                    strategy: this.resilienceService.getActiveStrategyName(),
                };
            }
            else {
                throw new common_1.HttpException({
                    success: false,
                    error: result.error,
                    details: result.details,
                    strategy: this.resilienceService.getActiveStrategyName(),
                }, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`❌ Error creando préstamo: ${error.message}`);
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                strategy: this.resilienceService.getActiveStrategyName(),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async returnLoan(id) {
        this.logger.log(`📚 POST /loans/${id}/return - Devolver libro`);
        const loan = await this.loansService.findOne(id);
        if (!loan) {
            throw new common_1.HttpException({ success: false, error: 'Préstamo no encontrado' }, common_1.HttpStatus.NOT_FOUND);
        }
        if (loan.status === 'returned') {
            throw new common_1.HttpException({ success: false, error: 'El libro ya fue devuelto' }, common_1.HttpStatus.BAD_REQUEST);
        }
        if (loan.status !== 'active') {
            throw new common_1.HttpException({ success: false, error: `No se puede devolver un préstamo con estado: ${loan.status}` }, common_1.HttpStatus.BAD_REQUEST);
        }
        const updatedLoan = await this.loansService.returnLoan(id);
        this.booksClient.emit('book.loan.returned', {
            bookId: loan.bookId,
            loanId: id,
        });
        this.logger.log(`✅ Préstamo ${id} marcado como devuelto`);
        return {
            success: true,
            data: updatedLoan,
        };
    }
    async findAll() {
        this.logger.log('📚 GET /loans - Listar todos los préstamos');
        const loans = await this.loansService.findAll();
        return {
            success: true,
            data: loans,
        };
    }
    async findActive() {
        this.logger.log('📚 GET /loans/active - Listar préstamos activos');
        const loans = await this.loansService.findActive();
        return {
            success: true,
            data: loans,
        };
    }
    async findPending() {
        this.logger.log('📚 GET /loans/pending - Listar préstamos pendientes');
        const loans = await this.loansService.findPending();
        return {
            success: true,
            data: loans,
        };
    }
    async getStrategy() {
        this.logger.log('📚 GET /loans/strategy - Info de estrategia activa');
        return {
            success: true,
            data: {
                active: this.resilienceService.getActiveStrategyName(),
                status: this.resilienceService.getStatus(),
                available: this.resilienceService.getAvailableStrategies(),
                howToChange: 'Cambia la variable de entorno RESILIENCE_STRATEGY y reinicia el servicio',
            },
        };
    }
    async findOne(id) {
        this.logger.log(`📚 GET /loans/${id} - Obtener préstamo`);
        const loan = await this.loansService.findOne(id);
        if (!loan) {
            throw new common_1.HttpException({ success: false, error: 'Préstamo no encontrado' }, common_1.HttpStatus.NOT_FOUND);
        }
        return {
            success: true,
            data: loan,
        };
    }
    async healthCheck() {
        return {
            success: true,
            data: {
                status: 'healthy',
                service: 'loans-service',
                strategy: this.resilienceService.getActiveStrategyName(),
                timestamp: new Date().toISOString(),
            },
        };
    }
    async handleLoanConfirmed(data, context) {
        this.logger.log(`📩 [EVENT] loan.confirmed - Préstamo: ${data.loanId}`);
        try {
            await this.loansService.confirmLoan(data.loanId);
            this.logger.log(`✅ Préstamo ${data.loanId} confirmado (ACTIVE)`);
            const channel = context.getChannelRef();
            const originalMsg = context.getMessage();
            channel.ack(originalMsg);
        }
        catch (error) {
            this.logger.error(`❌ Error confirmando préstamo: ${error.message}`);
            const channel = context.getChannelRef();
            const originalMsg = context.getMessage();
            channel.ack(originalMsg);
        }
    }
    async handleLoanRejected(data, context) {
        this.logger.log(`📩 [EVENT] loan.rejected - Préstamo: ${data.loanId}`);
        this.logger.log(`📩 [EVENT] Razón: ${data.reason}`);
        try {
            await this.loansService.rejectLoan(data.loanId, data.reason);
            this.logger.log(`❌ Préstamo ${data.loanId} rechazado (FAILED)`);
            const channel = context.getChannelRef();
            const originalMsg = context.getMessage();
            channel.ack(originalMsg);
        }
        catch (error) {
            this.logger.error(`❌ Error rechazando préstamo: ${error.message}`);
            const channel = context.getChannelRef();
            const originalMsg = context.getMessage();
            channel.ack(originalMsg);
        }
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_loan_dto_1.CreateLoanDto]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "createLoan", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "returnLoan", null);
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
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "healthCheck", null);
__decorate([
    (0, microservices_1.EventPattern)('loan.confirmed'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "handleLoanConfirmed", null);
__decorate([
    (0, microservices_1.EventPattern)('loan.rejected'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], LoansController.prototype, "handleLoanRejected", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.Controller)('loans'),
    __param(2, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [loans_service_1.LoansService,
        resilience_service_1.ResilienceService,
        microservices_1.ClientProxy])
], LoansController);
//# sourceMappingURL=loans.controller.js.map