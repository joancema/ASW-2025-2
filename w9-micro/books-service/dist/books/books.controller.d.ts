import { RmqContext } from '@nestjs/microservices';
import { BooksService, CreateBookDto } from './books.service';
export declare class BooksController {
    private readonly booksService;
    private readonly logger;
    constructor(booksService: BooksService);
    private acknowledgeMessage;
    findAll(context: RmqContext): Promise<{
        success: boolean;
        data: import("./entities/book.entity").Book[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    findAvailable(context: RmqContext): Promise<{
        success: boolean;
        data: import("./entities/book.entity").Book[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    findOne(data: {
        id: string;
    }, context: RmqContext): Promise<{
        success: boolean;
        data: import("./entities/book.entity").Book;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    create(data: CreateBookDto, context: RmqContext): Promise<{
        success: boolean;
        data: import("./entities/book.entity").Book;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    updateStatus(data: {
        id: string;
        status: 'available' | 'loaned';
    }, context: RmqContext): Promise<{
        success: boolean;
        data: import("./entities/book.entity").Book;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    checkAvailability(data: {
        bookId: string;
    }, context: RmqContext): Promise<{
        success: boolean;
        available: boolean;
        book: import("./entities/book.entity").Book;
        error?: undefined;
    } | {
        success: boolean;
        available: boolean;
        error: any;
        book?: undefined;
    }>;
    handleLoanRequested(data: {
        bookId: string;
        loanId?: string;
    }, context: RmqContext): Promise<void>;
    handleLoanReturned(data: {
        bookId: string;
        loanId?: string;
    }, context: RmqContext): Promise<void>;
    handleSagaLoanRequested(data: {
        bookId: string;
        loanId: string;
    }, context: RmqContext): Promise<void>;
    handleSagaCompensate(data: {
        bookId: string;
        loanId: string;
        reason: string;
    }, context: RmqContext): Promise<void>;
}
