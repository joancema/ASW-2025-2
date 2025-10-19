import { Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

const clientes=[
  {id:1, nombre:"Juan Perez", email:"juan.perez@example.com"},
  {id:2, nombre:"Maria Gomez", email:"maria.gomez@example.com"},
  {id:3, nombre:"Pedro Martinez", email:"pedro.martinez@example.com"}
]

@Injectable()
export class ClientesService {
  create(createClienteDto: CreateClienteDto) {
    return 'This action adds a new cliente';
  }

  findAll() {
    return clientes;
  }

  findOne(id: number) {
    return clientes.find(cliente => cliente.id === id);
  }

  update(id: number, updateClienteDto: UpdateClienteDto) {
    return `This action updates a #${id} cliente`;
  }

  remove(id: number) {
    return `This action removes a #${id} cliente`;
  }
}
