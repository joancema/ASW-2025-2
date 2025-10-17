import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class Option {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;


  @Field()
  userId: string;
  
  
  @Field(() => User, { nullable: true })
  user?: User;

}
