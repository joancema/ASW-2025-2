import { Module } from '@nestjs/common';
import { DivicesService } from './divices.service';
import { DivicesGateway } from './divices.gateway';

@Module({
  providers: [DivicesGateway, DivicesService],
  exports: [DivicesService, DivicesGateway],
})
export class DivicesModule {}
