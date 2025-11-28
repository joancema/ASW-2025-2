"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
            queue: process.env.QUEUE_NAME || 'loans_queue',
            queueOptions: {
                durable: true,
            },
            noAck: false,
            prefetchCount: 1,
            socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
            },
        },
    });
    await app.startAllMicroservices();
    const port = process.env.PORT || 3002;
    await app.listen(port);
    const strategy = process.env.RESILIENCE_STRATEGY || 'none';
    console.log('');
    console.log('📖 =========================================');
    console.log('📖 LOANS-SERVICE iniciado correctamente');
    console.log('📖 =========================================');
    console.log(`📖 REST API: http://localhost:${port}`);
    console.log(`📖 RabbitMQ: ${process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Default'}`);
    console.log('📖 -----------------------------------------');
    console.log(`📖 Estrategia de Resiliencia: ${strategy.toUpperCase()}`);
    console.log('📖 =========================================');
    console.log('');
}
bootstrap();
//# sourceMappingURL=main.js.map