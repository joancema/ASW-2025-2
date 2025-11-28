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
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
let BooksController = class BooksController {
    constructor(booksClient) {
        this.booksClient = booksClient;
        this.logger = new common_1.Logger('BooksProxy');
    }
    async findAll() {
        this.logger.log('📚 GET /api/books → books-service [book.find.all]');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.find.all', {}).pipe((0, rxjs_1.timeout)(5000), (0, rxjs_1.catchError)((error) => {
                this.logger.error(`❌ Error comunicando con books-service: ${error.message}`);
                throw new common_1.HttpException('books-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            if (!response.success) {
                throw new common_1.HttpException(response.error, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`📚 Respuesta: ${response.data?.length || 0} libros`);
            return response;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAvailable() {
        this.logger.log('📚 GET /api/books/available → books-service [book.find.available]');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.find.available', {}).pipe((0, rxjs_1.timeout)(5000), (0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('books-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            if (!response.success) {
                throw new common_1.HttpException(response.error, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`📚 Respuesta: ${response.data?.length || 0} libros disponibles`);
            return response;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        this.logger.log(`📚 GET /api/books/${id} → books-service [book.find.one]`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.find.one', { id }).pipe((0, rxjs_1.timeout)(5000), (0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('books-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            if (!response.success) {
                throw new common_1.HttpException(response.error || 'Libro no encontrado', common_1.HttpStatus.NOT_FOUND);
            }
            return response;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(createBookDto) {
        this.logger.log(`📚 POST /api/books → books-service [book.create]`);
        this.logger.log(`📚 Libro: ${createBookDto.title}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.booksClient.send('book.create', createBookDto).pipe((0, rxjs_1.timeout)(5000), (0, rxjs_1.catchError)((error) => {
                throw new common_1.HttpException('books-service no disponible', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            })));
            if (!response.success) {
                throw new common_1.HttpException(response.error, common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`📚 Libro creado: ${response.data?.id}`);
            return response;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findAvailable", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "create", null);
exports.BooksController = BooksController = __decorate([
    (0, common_1.Controller)('books'),
    __param(0, (0, common_1.Inject)('BOOKS_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], BooksController);
//# sourceMappingURL=books.controller.js.map