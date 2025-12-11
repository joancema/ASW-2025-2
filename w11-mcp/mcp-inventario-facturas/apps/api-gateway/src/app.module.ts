import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiModule } from './gemini/gemini.module';
import { McpClientModule } from './mcp-client/mcp-client.module';
import { FacturasModule } from './facturas/facturas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GeminiModule,
    McpClientModule,
    FacturasModule,
  ],
})
export class AppModule {}
