import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [HttpModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}