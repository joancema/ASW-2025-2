import { Repository } from 'typeorm';
import { Book, BookStatus } from './entities/book.entity';
export interface CreateBookDto {
    title: string;
    author: string;
    isbn: string;
}
export interface UpdateBookStatusDto {
    id: string;
    status: BookStatus;
}
export declare class BooksService {
    private readonly bookRepository;
    private readonly logger;
    constructor(bookRepository: Repository<Book>);
    create(createBookDto: CreateBookDto): Promise<Book>;
    findAll(): Promise<Book[]>;
    findAvailable(): Promise<Book[]>;
    findOne(id: string): Promise<Book | null>;
    updateStatus(id: string, status: BookStatus): Promise<Book | null>;
    markAsLoaned(bookId: string): Promise<Book | null>;
    markAsAvailable(bookId: string): Promise<Book | null>;
    isAvailable(bookId: string): Promise<boolean>;
}
