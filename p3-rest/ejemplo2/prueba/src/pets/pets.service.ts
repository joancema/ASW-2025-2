import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
   ){

  }
  async create(createPetDto: CreatePetDto) {
    const createPet= await this.petRepository.create(createPetDto);
    return await  this.petRepository.save(createPet);
  }

  async findAll() {
    return await  this.petRepository.find();
  }

  async findOne(id: string ) {
    const petFound= await  this.petRepository.findOneBy({id});
    if(!petFound){
      throw new NotFoundException(`El id ${id} no existe`);
    }
    return petFound;
  }
  async update(id: string, updatePetDto: UpdatePetDto) {
    const petFound= await  this.petRepository.findOneBy({id});
    if(!petFound){
      throw new NotFoundException(`El id ${id} no existe`);
    }
    await this.petRepository.update(id, updatePetDto);
    return this.petRepository.findOneBy({id});
  }

  async remove(id: string) {
    const petFound= await  this.petRepository.findOneBy({id});
    if(!petFound){
      throw new NotFoundException(`El id ${id} no existe`);
    }
    return await this.petRepository.delete(id);
  }
}
