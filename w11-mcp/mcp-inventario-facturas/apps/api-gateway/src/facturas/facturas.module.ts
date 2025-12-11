import { Module } from '@nestjs/common';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { GeminiModule } from '../gemini/gemini.module';
import { McpClientModule } from '../mcp-client/mcp-client.module';

@Module({
  imports: [GeminiModule, McpClientModule],
  controllers: [FacturasController],
  providers: [FacturasService],
})
export class FacturasModule {}
