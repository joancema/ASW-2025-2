import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientesModule } from './clientes/clientes.module';
import { DispositivosModule } from './dispositivos/dispositivos.module';

@Module({
  imports: [ClientesModule, DispositivosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
