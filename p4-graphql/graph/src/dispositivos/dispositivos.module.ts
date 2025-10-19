import { Module } from '@nestjs/common';
import { DispositivosResolver } from './dispositivos.resolver';
import { HttpServices } from 'src/http/http.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [DispositivosResolver, HttpServices],
})
export class DispositivosModule {}
