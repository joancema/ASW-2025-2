import { GatewayService } from './gateway.service';
export declare class GatewayController {
    private readonly gatewayService;
    private readonly logger;
    constructor(gatewayService: GatewayService);
    healthCheck(): Promise<{
        gateway: import("./gateway.service").ServiceHealth;
        booksService: import("./gateway.service").ServiceHealth;
        loansService: import("./gateway.service").ServiceHealth;
        overall: "healthy" | "degraded" | "unhealthy";
        success: boolean;
        timestamp: string;
    }>;
    getInfo(): {
        success: boolean;
        data: {
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
    };
}
