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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksSeedService = void 0;
const common_1 = require("@nestjs/common");
const books_service_1 = require("./books.service");
let BooksSeedService = class BooksSeedService {
    constructor(booksService) {
        this.booksService = booksService;
        this.logger = new common_1.Logger('BooksSeed');
    }
    async onModuleInit() {
        await this.seedBooks();
    }
    async seedBooks() {
        const existingBooks = await this.booksService.findAll();
        if (existingBooks.length > 0) {
            this.logger.log('📚 Base de datos ya tiene libros, saltando seed');
            return;
        }
        this.logger.log('📚 Poblando base de datos con libros de ejemplo...');
        const booksToCreate = [
            {
                title: 'Clean Code',
                author: 'Robert C. Martin',
                isbn: '978-0132350884',
            },
            {
                title: 'Design Patterns',
                author: 'Gang of Four',
                isbn: '978-0201633610',
            },
            {
                title: 'The Pragmatic Programmer',
                author: 'David Thomas, Andrew Hunt',
                isbn: '978-0135957059',
            },
            {
                title: 'Domain-Driven Design',
                author: 'Eric Evans',
                isbn: '978-0321125217',
            },
            {
                title: 'Building Microservices',
                author: 'Sam Newman',
                isbn: '978-1492034025',
            },
            {
                title: 'Microservices Patterns',
                author: 'Chris Richardson',
                isbn: '978-1617294549',
            },
            {
                title: 'Release It!',
                author: 'Michael Nygard',
                isbn: '978-1680502398',
            },
            {
                title: 'Site Reliability Engineering',
                author: 'Google SRE Team',
                isbn: '978-1491929124',
            },
        ];
        for (const bookData of booksToCreate) {
            try {
                const book = await this.booksService.create(bookData);
                this.logger.log(`  ✅ Creado: ${book.title} (${book.id})`);
            }
            catch (error) {
                this.logger.error(`  ❌ Error creando ${bookData.title}: ${error.message}`);
            }
        }
        this.logger.log('📚 Seed completado');
    }
};
exports.BooksSeedService = BooksSeedService;
exports.BooksSeedService = BooksSeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksSeedService);
//# sourceMappingURL=seed-books.js.map