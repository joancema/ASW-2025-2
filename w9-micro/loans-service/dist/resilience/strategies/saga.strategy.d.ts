import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
export declare class SagaStrategy implements ResilienceStrategy {
    private readonly booksClient;
    private readonly loansService;
    readonly name = "saga";
    readonly description = "SAGA - Transacciones distribuidas con compensaci\u00F3n";
    readonly logEmoji = "\uD83D\uDFE3";
    private readonly logger;
    private readonly sagaTimeout;
    private pendingSagas;
    constructor(booksClient: ClientProxy, loansService: LoansService);
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    private executeCompensation;
    handleLoanConfirmed(loanId: string): Promise<void>;
    handleLoanRejected(loanId: string, reason: string): Promise<void>;
    getStatus(): {
        strategy: string;
        description: string;
        timeout: number;
        pendingSagas: number;
        confirmedSagas: number;
        rejectedSagas: number;
        recentSagas: {
            loanId: string;
            bookId: string;
            startTime: Date;
            status: "pending" | "confirmed" | "rejected";
        }[];
    };
}
