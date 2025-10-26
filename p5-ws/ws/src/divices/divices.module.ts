import { Module } from '@nestjs/common';
import { DivicesService } from './divices.service';
import { DivicesGateway } from './divices.gateway';

@Module({
  providers: [DivicesGateway],
})
export class DivicesModule {}
