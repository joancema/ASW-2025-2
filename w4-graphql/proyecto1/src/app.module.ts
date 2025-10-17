import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OptionsModule } from './options/options.module';

@Module({
  imports: [UsersModule, OptionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
