import { Loan } from '../../loans/entities/loan.entity';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
export interface LoanResult {
    success: boolean;
    loan?: Loan;
    error?: string;
    details?: any;
}
export interface ResilienceStrategy {
    readonly name: string;
    readonly description: string;
    readonly logEmoji: string;
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    initialize?(): Promise<void>;
    destroy?(): Promise<void>;
    getStatus?(): any;
}
export declare const RESILIENCE_STRATEGY = "RESILIENCE_STRATEGY";
