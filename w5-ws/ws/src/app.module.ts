import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MascotasModule } from './mascotas/mascotas.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [MascotasModule, NotificacionesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
