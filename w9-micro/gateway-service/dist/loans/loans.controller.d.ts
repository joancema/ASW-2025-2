import { HttpService } from '@nestjs/axios';
interface CreateLoanDto {
    bookId: string;
    userId: string;
    userName: string;
}
export declare class LoansController {
    private readonly httpService;
    private readonly logger;
    private readonly loansServiceUrl;
    constructor(httpService: HttpService);
    findAll(): Promise<any>;
    findActive(): Promise<any>;
    findPending(): Promise<any>;
    getStrategy(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(createLoanDto: CreateLoanDto): Promise<any>;
    returnLoan(id: string): Promise<any>;
}
export {};
