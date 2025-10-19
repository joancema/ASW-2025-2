import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateDispositivoInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
