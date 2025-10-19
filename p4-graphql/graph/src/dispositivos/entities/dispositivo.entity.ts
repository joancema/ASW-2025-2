import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Cliente } from 'src/clientes/entities/cliente.entity';

@ObjectType()
export class Dispositivo {
  @Field(() => ID, { description: 'ID del dispositivo' })
  id: string;

  @Field(() => String, { description: 'Nombre del dispositivo' })
  nombre: string;

  @Field(() => String, { description: 'Tipo de dispositivo' })
  tipo: string; 

  @Field(() => Cliente, { description: 'Cliente asociado al dispositivo' })
  cliente: Cliente;
  
  @Field(() => String, { description: 'ID del cliente asociado' })
  clienteId: string;
}
