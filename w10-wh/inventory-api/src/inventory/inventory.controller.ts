import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getAll() {
    return this.inventoryService.getAllItems();
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body('stock') stock: number,
  ) {
    return this.inventoryService.updateStock(parseInt(id), stock);
  }
}