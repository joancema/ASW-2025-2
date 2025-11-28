import { RmqContext, ClientProxy } from '@nestjs/microservices';
import { LoansService } from './loans.service';
import { ResilienceService } from '../resilience/resilience.service';
import { CreateLoanDto, ApiResponse } from './dto/create-loan.dto';
import { Loan } from './entities/loan.entity';
export declare class LoansController {
    private readonly loansService;
    private readonly resilienceService;
    private readonly booksClient;
    private readonly logger;
    constructor(loansService: LoansService, resilienceService: ResilienceService, booksClient: ClientProxy);
    createLoan(createLoanDto: CreateLoanDto): Promise<ApiResponse<Loan>>;
    returnLoan(id: string): Promise<ApiResponse<Loan>>;
    findAll(): Promise<ApiResponse<Loan[]>>;
    findActive(): Promise<ApiResponse<Loan[]>>;
    findPending(): Promise<ApiResponse<Loan[]>>;
    getStrategy(): Promise<ApiResponse>;
    findOne(id: string): Promise<ApiResponse<Loan>>;
    healthCheck(): Promise<ApiResponse>;
    handleLoanConfirmed(data: {
        loanId: string;
        bookId: string;
    }, context: RmqContext): Promise<void>;
    handleLoanRejected(data: {
        loanId: string;
        bookId: string;
        reason: string;
    }, context: RmqContext): Promise<void>;
}
