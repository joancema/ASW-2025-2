import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet])
  ],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService, TypeOrmModule]
})
export class PetsModule {}
