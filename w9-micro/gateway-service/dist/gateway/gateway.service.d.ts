import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    error?: string;
}
export declare class GatewayService {
    private readonly booksClient;
    private readonly httpService;
    private readonly logger;
    constructor(booksClient: ClientProxy, httpService: HttpService);
    checkAllServicesHealth(): Promise<{
        gateway: ServiceHealth;
        booksService: ServiceHealth;
        loansService: ServiceHealth;
        overall: 'healthy' | 'degraded' | 'unhealthy';
    }>;
    private checkBooksServiceHealth;
    private checkLoansServiceHealth;
    getSystemInfo(): {
        name: string;
        version: string;
        description: string;
        services: ({
            name: string;
            port: number;
            description: string;
            transport?: undefined;
        } | {
            name: string;
            transport: string;
            description: string;
            port?: undefined;
        })[];
        endpoints: {
            books: string[];
            loans: string[];
            system: string[];
        };
    };
}
