import { Module } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { MascotasGateway } from './mascotas.gateway';

@Module({
  providers: [MascotasGateway, MascotasService],
  exports: [MascotasGateway],
})
export class MascotasModule {}
