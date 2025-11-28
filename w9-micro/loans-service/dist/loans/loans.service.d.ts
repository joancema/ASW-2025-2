import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
export declare class LoansService {
    private readonly loanRepository;
    private readonly outboxRepository;
    private readonly logger;
    constructor(loanRepository: Repository<Loan>, outboxRepository: Repository<OutboxEvent>);
    create(dto: CreateLoanDto, status?: LoanStatus): Promise<Loan>;
    createPending(dto: CreateLoanDto): Promise<Loan>;
    findAll(): Promise<Loan[]>;
    findActive(): Promise<Loan[]>;
    findPending(): Promise<Loan[]>;
    findOne(id: string): Promise<Loan | null>;
    updateStatus(id: string, status: LoanStatus, failureReason?: string): Promise<Loan | null>;
    confirmLoan(id: string): Promise<Loan | null>;
    rejectLoan(id: string, reason: string): Promise<Loan | null>;
    returnLoan(id: string): Promise<Loan | null>;
    saveOutboxEvent(eventType: string, payload: any): Promise<OutboxEvent>;
    getPendingOutboxEvents(maxRetries?: number): Promise<OutboxEvent[]>;
    markEventProcessed(eventId: string): Promise<void>;
    incrementRetryCount(eventId: string, error: string): Promise<void>;
}
