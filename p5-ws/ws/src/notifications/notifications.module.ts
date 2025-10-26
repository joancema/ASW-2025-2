import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DivicesModule } from 'src/divices/divices.module';
import { DivicesGateway } from 'src/divices/divices.gateway';

@Module({
  imports: [DivicesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, DivicesGateway],
})
export class NotificationsModule {}
