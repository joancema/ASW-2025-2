import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MascotasModule } from './mascotas/mascotas.module';

@Module({
  imports: [MascotasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
