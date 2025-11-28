import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ResilienceStrategy, LoanResult } from './resilience-strategy.interface';
import { CreateLoanDto } from '../../loans/dto/create-loan.dto';
import { LoansService } from '../../loans/loans.service';
export declare class CircuitBreakerStrategy implements ResilienceStrategy, OnModuleInit {
    private readonly booksClient;
    private readonly loansService;
    readonly name = "circuit-breaker";
    readonly description = "Circuit Breaker - Protecci\u00F3n contra servicios ca\u00EDdos usando opossum";
    readonly logEmoji = "\uD83D\uDFE1";
    private readonly logger;
    private breaker;
    constructor(booksClient: ClientProxy, loansService: LoansService);
    onModuleInit(): void;
    private initializeCircuitBreaker;
    private setupEventListeners;
    private checkBookAvailability;
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    private getCircuitState;
    getStatus(): {
        strategy: string;
        description: string;
        circuitState: string;
        isOpen: boolean;
        isHalfOpen: boolean;
        isClosed: boolean;
        stats: {
            successes: number;
            failures: number;
            rejects: number;
            timeouts: number;
            fallbacks: number;
        };
        config: {
            timeout: number;
            errorThresholdPercentage: number;
            resetTimeout: number;
        };
    };
}
