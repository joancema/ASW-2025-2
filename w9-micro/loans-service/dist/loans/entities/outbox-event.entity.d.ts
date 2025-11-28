export declare class OutboxEvent {
    id: string;
    eventType: string;
    payload: string;
    processed: boolean;
    retryCount: number;
    lastError: string | null;
    createdAt: Date;
    processedAt: Date | null;
    getPayloadObject(): any;
    setPayloadObject(data: any): void;
}
