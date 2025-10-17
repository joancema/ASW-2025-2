import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { RestClientService } from 'src/services/rest-client.service';
import { HttpModule } from '@nestjs/axios';
import { OptionsResolver } from './options.resolver';

@Module({
  imports:[ HttpModule ],
  providers: [UsersResolver, OptionsResolver , UsersService, RestClientService],
})
export class UsersModule {}
