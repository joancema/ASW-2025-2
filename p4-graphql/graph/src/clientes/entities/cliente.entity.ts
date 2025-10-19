import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Dispositivo } from 'src/dispositivos/entities/dispositivo.entity';

@ObjectType()
export class Cliente {
  @Field(() => ID, { description: 'Example field (placeholder)' })
  id: string;

  @Field(() => String, { description: 'Nombre del cliente' })
  nombre: string;

  @Field(() => String, { description: 'Correo electrónico del cliente' })
  email: string;

  @Field(()=> [Dispositivo], { description: 'Dispositivos asociados al cliente' })
  dispositivos: Dispositivo[];


}
