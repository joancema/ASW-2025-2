"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
            queue: process.env.QUEUE_NAME || 'books_queue',
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
    await app.listen();
    console.log('📚 =========================================');
    console.log('📚 BOOKS-SERVICE iniciado correctamente');
    console.log('📚 Escuchando en cola:', process.env.QUEUE_NAME || 'books_queue');
    console.log('📚 RabbitMQ URL:', process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Usando default');
    console.log('📚 =========================================');
}
bootstrap();
//# sourceMappingURL=main.js.map