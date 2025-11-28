import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
export declare class OutboxStrategy implements ResilienceStrategy {
    private readonly booksClient;
    private readonly loansService;
    readonly name = "outbox";
    readonly description = "Outbox - Garant\u00EDa de entrega con reintentos autom\u00E1ticos";
    readonly logEmoji = "\uD83D\uDFE2";
    private readonly logger;
    private readonly maxRetries;
    constructor(booksClient: ClientProxy, loansService: LoansService);
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    getStatus(): Promise<{
        strategy: string;
        description: string;
        maxRetries: number;
        retryInterval: string;
        pendingEvents: number;
        events: {
            id: string;
            type: string;
            retryCount: number;
            createdAt: Date;
        }[];
    }>;
}
