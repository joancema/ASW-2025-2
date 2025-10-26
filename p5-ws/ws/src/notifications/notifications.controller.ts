import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DivicesService } from 'src/divices/divices.service';
import { DivicesGateway } from 'src/divices/divices.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: DivicesGateway) {}

  @Post('create-device')
  create(@Body() message: any) {
    return this.notificationsService.emitirEvento('create-device', message);
  }

}
