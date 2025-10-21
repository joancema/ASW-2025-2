import { Module } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { MascotasController } from './mascotas.controller';

@Module({
  controllers: [MascotasController],
  providers: [MascotasService],
})
export class MascotasModule {}
