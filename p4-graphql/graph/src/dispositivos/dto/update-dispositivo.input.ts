import { CreateDispositivoInput } from './create-dispositivo.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateDispositivoInput extends PartialType(CreateDispositivoInput) {
  @Field(() => Int)
  id: number;
}
