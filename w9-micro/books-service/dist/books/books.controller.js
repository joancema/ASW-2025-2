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
var BooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const books_service_1 = require("./books.service");
let BooksController = BooksController_1 = class BooksController {
    constructor(booksService) {
        this.booksService = booksService;
        this.logger = new common_1.Logger(BooksController_1.name);
    }
    acknowledgeMessage(context) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
    }
    async findAll(context) {
        this.logger.log('📨 [book.find.all] Solicitud recibida');
        try {
            const books = await this.booksService.findAll();
            this.acknowledgeMessage(context);
            this.logger.log(`📨 [book.find.all] Enviando ${books.length} libros`);
            return { success: true, data: books };
        }
        catch (error) {
            this.logger.error(`❌ [book.find.all] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, error: error.message };
        }
    }
    async findAvailable(context) {
        this.logger.log('📨 [book.find.available] Solicitud recibida');
        try {
            const books = await this.booksService.findAvailable();
            this.acknowledgeMessage(context);
            this.logger.log(`📨 [book.find.available] Enviando ${books.length} libros`);
            return { success: true, data: books };
        }
        catch (error) {
            this.logger.error(`❌ [book.find.available] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, error: error.message };
        }
    }
    async findOne(data, context) {
        this.logger.log(`📨 [book.find.one] Buscando libro: ${data.id}`);
        try {
            const book = await this.booksService.findOne(data.id);
            this.acknowledgeMessage(context);
            if (!book) {
                this.logger.warn(`📨 [book.find.one] Libro no encontrado: ${data.id}`);
                return { success: false, error: 'Libro no encontrado' };
            }
            return { success: true, data: book };
        }
        catch (error) {
            this.logger.error(`❌ [book.find.one] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, error: error.message };
        }
    }
    async create(data, context) {
        this.logger.log(`📨 [book.create] Creando libro: ${data.title}`);
        try {
            const book = await this.booksService.create(data);
            this.acknowledgeMessage(context);
            this.logger.log(`📨 [book.create] Libro creado: ${book.id}`);
            return { success: true, data: book };
        }
        catch (error) {
            this.logger.error(`❌ [book.create] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, error: error.message };
        }
    }
    async updateStatus(data, context) {
        this.logger.log(`📨 [book.update.status] Actualizando ${data.id} a ${data.status}`);
        try {
            const book = await this.booksService.updateStatus(data.id, data.status);
            this.acknowledgeMessage(context);
            if (!book) {
                return { success: false, error: 'Libro no encontrado' };
            }
            return { success: true, data: book };
        }
        catch (error) {
            this.logger.error(`❌ [book.update.status] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, error: error.message };
        }
    }
    async checkAvailability(data, context) {
        this.logger.log(`📨 [book.check.availability] Verificando: ${data.bookId}`);
        try {
            const book = await this.booksService.findOne(data.bookId);
            this.acknowledgeMessage(context);
            if (!book) {
                return {
                    success: false,
                    available: false,
                    error: 'Libro no encontrado'
                };
            }
            return {
                success: true,
                available: book.status === 'available',
                book: book
            };
        }
        catch (error) {
            this.logger.error(`❌ [book.check.availability] Error: ${error.message}`);
            this.acknowledgeMessage(context);
            return { success: false, available: false, error: error.message };
        }
    }
    async handleLoanRequested(data, context) {
        this.logger.log(`📩 [book.loan.requested] Préstamo solicitado para libro: ${data.bookId}`);
        try {
            const book = await this.booksService.markAsLoaned(data.bookId);
            this.acknowledgeMessage(context);
            if (book) {
                this.logger.log(`✅ [book.loan.requested] Libro ${data.bookId} marcado como prestado`);
            }
            else {
                this.logger.warn(`⚠️ [book.loan.requested] Libro ${data.bookId} no encontrado`);
            }
        }
        catch (error) {
            this.logger.error(`❌ [book.loan.requested] Error: ${error.message}`);
            this.acknowledgeMessage(context);
        }
    }
    async handleLoanReturned(data, context) {
        this.logger.log(`📩 [book.loan.returned] Devolución para libro: ${data.bookId}`);
        try {
            const book = await this.booksService.markAsAvailable(data.bookId);
            this.acknowledgeMessage(context);
            if (book) {
                this.logger.log(`✅ [book.loan.returned] Libro ${data.bookId} marcado como disponible`);
            }
            else {
                this.logger.warn(`⚠️ [book.loan.returned] Libro ${data.bookId} no encontrado`);
            }
        }
        catch (error) {
            this.logger.error(`❌ [book.loan.returned] Error: ${error.message}`);
            this.acknowledgeMessage(context);
        }
    }
    async handleSagaLoanRequested(data, context) {
        this.logger.log(`🟣 [SAGA] Solicitud de préstamo recibida - Libro: ${data.bookId}, Préstamo: ${data.loanId}`);
        try {
            const book = await this.booksService.findOne(data.bookId);
            if (!book) {
                this.logger.warn(`🟣 [SAGA] Libro no encontrado: ${data.bookId}`);
                this.acknowledgeMessage(context);
                return;
            }
            if (book.status !== 'available') {
                this.logger.warn(`🟣 [SAGA] Libro no disponible: ${data.bookId}`);
                this.acknowledgeMessage(context);
                return;
            }
            await this.booksService.markAsLoaned(data.bookId);
            this.logger.log(`🟣 [SAGA] Libro ${data.bookId} marcado como prestado`);
            this.acknowledgeMessage(context);
        }
        catch (error) {
            this.logger.error(`❌ [SAGA] Error procesando préstamo: ${error.message}`);
            this.acknowledgeMessage(context);
        }
    }
    async handleSagaCompensate(data, context) {
        this.logger.log(`🟣 [SAGA-COMPENSATE] Revirtiendo préstamo - Libro: ${data.bookId}`);
        this.logger.log(`🟣 [SAGA-COMPENSATE] Razón: ${data.reason}`);
        try {
            await this.booksService.markAsAvailable(data.bookId);
            this.logger.log(`🟣 [SAGA-COMPENSATE] Libro ${data.bookId} marcado como disponible`);
            this.acknowledgeMessage(context);
        }
        catch (error) {
            this.logger.error(`❌ [SAGA-COMPENSATE] Error: ${error.message}`);
            this.acknowledgeMessage(context);
        }
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, microservices_1.MessagePattern)('book.find.all'),
    __param(0, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findAll", null);
__decorate([
    (0, microservices_1.MessagePattern)('book.find.available'),
    __param(0, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findAvailable", null);
__decorate([
    (0, microservices_1.MessagePattern)('book.find.one'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findOne", null);
__decorate([
    (0, microservices_1.MessagePattern)('book.create'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "create", null);
__decorate([
    (0, microservices_1.MessagePattern)('book.update.status'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "updateStatus", null);
__decorate([
    (0, microservices_1.MessagePattern)('book.check.availability'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "checkAvailability", null);
__decorate([
    (0, microservices_1.EventPattern)('book.loan.requested'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "handleLoanRequested", null);
__decorate([
    (0, microservices_1.EventPattern)('book.loan.returned'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "handleLoanReturned", null);
__decorate([
    (0, microservices_1.EventPattern)('book.loan.saga.requested'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "handleSagaLoanRequested", null);
__decorate([
    (0, microservices_1.EventPattern)('book.loan.saga.compensate'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "handleSagaCompensate", null);
exports.BooksController = BooksController = BooksController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksController);
//# sourceMappingURL=books.controller.js.map