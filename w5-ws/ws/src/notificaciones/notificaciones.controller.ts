import { Body, Controller, Post } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { MascotasGateway } from 'src/mascotas/mascotas.gateway';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly gateway: MascotasGateway) {}

    @Post('mascota-creada')
    crearMascota(@Body() body: any) {
      // Lógica para crear la mascota
      this.gateway.emitirEvento('mascota-creada', body);
    }
  }
  
