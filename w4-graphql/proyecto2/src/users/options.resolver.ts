import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { RestClientService } from 'src/services/rest-client.service';
import { Option } from './entities/option.entity';

@Resolver(() => Option)
export class OptionsResolver {
  // constructor(private readonly usersService: UsersService) {}
  constructor(private service: RestClientService ){}

  // @Mutation(() => User)
  // createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
  //   return this.usersService.create(createUserInput);
  // }

  @Query(() => [Option], { name: 'options' })
  findAll() {
    return this.service.getOpciones()
    // return this.usersService.findAll();

  }

  @Query(() => Option, { name: 'option' })
  findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.usersService.findOne(id);
  return this.service.getOpcionById(id.toString())
  }

  // @Mutation(() => User)
  // updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
  //   return this.usersService.update(updateUserInput.id, updateUserInput);
  // }

  // @Mutation(() => User)
  // removeUser(@Args('id', { type: () => Int }) id: number) {
  //   return this.usersService.remove(id);
  // }
  @ResolveField(() => User)
  async user(@Parent() option: Option) {
    return  await this.service.getUsuarioById(option.userId);
  }
}
