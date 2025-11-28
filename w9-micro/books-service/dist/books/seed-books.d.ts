import { OnModuleInit } from '@nestjs/common';
import { BooksService } from './books.service';
export declare class BooksSeedService implements OnModuleInit {
    private readonly booksService;
    private readonly logger;
    constructor(booksService: BooksService);
    onModuleInit(): Promise<void>;
    seedBooks(): Promise<void>;
}
