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
var BooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const book_entity_1 = require("./entities/book.entity");
let BooksService = BooksService_1 = class BooksService {
    constructor(bookRepository) {
        this.bookRepository = bookRepository;
        this.logger = new common_1.Logger(BooksService_1.name);
    }
    async create(createBookDto) {
        this.logger.log(`📗 Creando libro: ${createBookDto.title}`);
        const book = this.bookRepository.create({
            ...createBookDto,
            status: 'available',
        });
        const savedBook = await this.bookRepository.save(book);
        this.logger.log(`📗 Libro creado con ID: ${savedBook.id}`);
        return savedBook;
    }
    async findAll() {
        this.logger.log('📚 Consultando todos los libros');
        return this.bookRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findAvailable() {
        this.logger.log('📚 Consultando libros disponibles');
        return this.bookRepository.find({
            where: { status: 'available' },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        this.logger.log(`📖 Buscando libro: ${id}`);
        return this.bookRepository.findOne({ where: { id } });
    }
    async updateStatus(id, status) {
        this.logger.log(`📝 Actualizando estado del libro ${id} a ${status}`);
        const book = await this.findOne(id);
        if (!book) {
            this.logger.warn(`⚠️ Libro no encontrado: ${id}`);
            return null;
        }
        book.status = status;
        const updatedBook = await this.bookRepository.save(book);
        this.logger.log(`✅ Libro ${id} actualizado a ${status}`);
        return updatedBook;
    }
    async markAsLoaned(bookId) {
        return this.updateStatus(bookId, 'loaned');
    }
    async markAsAvailable(bookId) {
        return this.updateStatus(bookId, 'available');
    }
    async isAvailable(bookId) {
        const book = await this.findOne(bookId);
        return book?.status === 'available';
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = BooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(book_entity_1.Book)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BooksService);
//# sourceMappingURL=books.service.js.map