import { OnModuleInit } from '@nestjs/common';
import { ResilienceStrategy, LoanResult } from './strategies/resilience-strategy.interface';
import { NoneStrategy } from './strategies/none.strategy';
import { CircuitBreakerStrategy } from './strategies/circuit-breaker.strategy';
import { SagaStrategy } from './strategies/saga.strategy';
import { OutboxStrategy } from './strategies/outbox.strategy';
import { CreateLoanDto } from '../loans/dto/create-loan.dto';
export type StrategyType = 'none' | 'circuit-breaker' | 'saga' | 'outbox';
export declare class ResilienceService implements OnModuleInit {
    private readonly noneStrategy;
    private readonly circuitBreakerStrategy;
    private readonly sagaStrategy;
    private readonly outboxStrategy;
    private readonly logger;
    private activeStrategy;
    private readonly strategyName;
    constructor(noneStrategy: NoneStrategy, circuitBreakerStrategy: CircuitBreakerStrategy, sagaStrategy: SagaStrategy, outboxStrategy: OutboxStrategy);
    onModuleInit(): void;
    private selectStrategy;
    private logStrategyInfo;
    getActiveStrategy(): ResilienceStrategy;
    getActiveStrategyName(): string;
    createLoan(loanData: CreateLoanDto): Promise<LoanResult>;
    getAvailableStrategies(): Array<{
        name: string;
        description: string;
        isActive: boolean;
        envValue: string;
    }>;
    getStatus(): any;
}
