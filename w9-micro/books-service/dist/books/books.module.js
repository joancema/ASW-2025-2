"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const books_controller_1 = require("./books.controller");
const books_service_1 = require("./books.service");
const book_entity_1 = require("./entities/book.entity");
const seed_books_1 = require("./seed-books");
let BooksModule = class BooksModule {
};
exports.BooksModule = BooksModule;
exports.BooksModule = BooksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([book_entity_1.Book]),
        ],
        controllers: [books_controller_1.BooksController],
        providers: [books_service_1.BooksService, seed_books_1.BooksSeedService],
        exports: [books_service_1.BooksService],
    })
], BooksModule);
//# sourceMappingURL=books.module.js.map