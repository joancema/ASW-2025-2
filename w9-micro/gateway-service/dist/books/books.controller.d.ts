import { ClientProxy } from '@nestjs/microservices';
interface CreateBookDto {
    title: string;
    author: string;
    isbn: string;
}
export declare class BooksController {
    private readonly booksClient;
    private readonly logger;
    constructor(booksClient: ClientProxy);
    findAll(): Promise<any>;
    findAvailable(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(createBookDto: CreateBookDto): Promise<any>;
}
export {};
