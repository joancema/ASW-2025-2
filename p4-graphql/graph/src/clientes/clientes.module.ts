import { Module } from '@nestjs/common';
import { ClientesResolver } from './clientes.resolver';
import { HttpServices } from 'src/http/http.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[ HttpModule  ],
  providers: [ClientesResolver, HttpServices ],
})
export class ClientesModule {}
