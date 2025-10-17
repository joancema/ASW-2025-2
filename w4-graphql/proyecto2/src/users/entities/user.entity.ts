import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { Option } from './option.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [Option], { nullable: true })
  options?: Option[];

}
