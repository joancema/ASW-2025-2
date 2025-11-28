import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
export declare class NoneStrategy implements ResilienceStrategy {
    private readonly booksClient;
    private readonly loansService;
    readonly name = "none";
    readonly description = "Sin manejo de errores - Llamada directa a books-service";
    readonly logEmoji = "\uD83D\uDD35";
    private readonly logger;
    constructor(booksClient: ClientProxy, loansService: LoansService);
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    getStatus(): {
        strategy: string;
        description: string;
        status: string;
        protection: string;
        warning: string;
    };
}
