export type BookStatus = 'available' | 'loaned';
export declare class Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    status: BookStatus;
    createdAt: Date;
}
