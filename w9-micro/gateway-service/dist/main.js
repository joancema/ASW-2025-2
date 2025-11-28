"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const logging_interceptor_1 = require("./common/logging.interceptor");
const error_filter_1 = require("./common/error.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalFilters(new error_filter_1.GlobalExceptionFilter());
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log('');
    console.log('🚀 =========================================');
    console.log('🚀 API GATEWAY iniciado correctamente');
    console.log('🚀 =========================================');
    console.log(`🚀 URL: http://localhost:${port}/api`);
    console.log(`🚀 RabbitMQ: ${process.env.RABBITMQ_URL ? '✅ Configurado' : '❌ Default'}`);
    console.log('🚀 =========================================');
    console.log('');
}
bootstrap();
//# sourceMappingURL=main.js.map