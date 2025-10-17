import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { RestClientService } from 'src/services/rest-client.service';

@Resolver(() => User)
export class UsersResolver {
  // constructor(private readonly usersService: UsersService) {}
  constructor(private service: RestClientService ){}

  // @Mutation(() => User)
  // createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
  //   return this.usersService.create(createUserInput);
  // }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.service.getUsuarios()
    // return this.usersService.findAll();

  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.usersService.findOne(id);
  return this.service.getUsuarioById(id.toString())
  }

  // @Mutation(() => User)
  // updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
  //   return this.usersService.update(updateUserInput.id, updateUserInput);
  // }

  // @Mutation(() => User)
  // removeUser(@Args('id', { type: () => Int }) id: number) {
  //   return this.usersService.remove(id);
  // }
  @ResolveField(() => [Option])
  async options(@Parent() user: User) {
    const todasLasOpciones = await this.service.getOpciones();
    return todasLasOpciones.filter(m => m.userId === user.id);
  }
}
