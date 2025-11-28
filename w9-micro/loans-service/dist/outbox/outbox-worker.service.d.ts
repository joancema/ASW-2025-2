import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoansService } from '../loans/loans.service';
export declare class OutboxWorkerService implements OnModuleInit {
    private readonly booksClient;
    private readonly loansService;
    private readonly logger;
    private readonly maxRetries;
    private readonly retryInterval;
    private isProcessing;
    private processedCount;
    private failedCount;
    constructor(booksClient: ClientProxy, loansService: LoansService);
    onModuleInit(): void;
    processOutboxEvents(): Promise<void>;
    private processEvent;
    getStats(): {
        isProcessing: boolean;
        processedCount: number;
        failedCount: number;
        maxRetries: number;
        retryInterval: number;
    };
    forceProcess(): Promise<void>;
}
