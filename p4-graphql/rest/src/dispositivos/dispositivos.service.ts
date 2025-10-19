import { Injectable } from '@nestjs/common';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';

const dispositivos=[
  {id:1, nombre:'Dispositivo 1', tipo:'Tipo A', clienteId:1},
  {id:2, nombre:'Dispositivo 2', tipo:'Tipo B', clienteId:2},
  {id:3, nombre:'Dispositivo 3', tipo:'Tipo A', clienteId:1},
]

@Injectable()
export class DispositivosService {
  create(createDispositivoDto: CreateDispositivoDto) {
    return 'This action adds a new dispositivo';
  }

  findAll() {
    return dispositivos;
  }
  
  findOne(id: number) {
    return dispositivos.find(dispositivo => dispositivo.id === id);
  }

  update(id: number, updateDispositivoDto: UpdateDispositivoDto) {
    return `This action updates a #${id} dispositivo`;
  }

  remove(id: number) {
    return `This action removes a #${id} dispositivo`;
  }
}
