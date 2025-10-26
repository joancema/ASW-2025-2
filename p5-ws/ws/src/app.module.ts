import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DivicesModule } from './divices/divices.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [DivicesModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
