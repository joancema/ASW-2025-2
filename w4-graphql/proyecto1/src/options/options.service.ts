import { Injectable } from '@nestjs/common';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

const options = [
  { id: 1, name: 'Option 1', description: 'Description 1', userId: 1 },
  { id: 2, name: 'Option 2', description: 'Description 2', userId: 1 },
  { id: 3, name: 'Option 3', description: 'Description 3', userId: 2 },
  { id: 4, name: 'Option 4', description: 'Description 4', userId: 2 }
];

@Injectable()
export class OptionsService {
  create(createOptionDto: CreateOptionDto) {
    return 'This action adds a new option';
  }

  findAll() {
    return options;
  }

  findOne(id: number) {
    return options.find(option => option.id === id);
  }

  update(id: number, updateOptionDto: UpdateOptionDto) {
    return `This action updates a #${id} option`;
  }

  remove(id: number) {
    return `This action removes a #${id} option`;
  }
}
