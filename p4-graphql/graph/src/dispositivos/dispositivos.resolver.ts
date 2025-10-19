import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Dispositivo } from './entities/dispositivo.entity';
import { CreateDispositivoInput } from './dto/create-dispositivo.input';
import { UpdateDispositivoInput } from './dto/update-dispositivo.input';
import { HttpServices } from 'src/http/http.service';
import { Cliente } from 'src/clientes/entities/cliente.entity';

@Resolver(() => Dispositivo)
export class DispositivosResolver {
  constructor(
    private readonly httpService: HttpServices
  ) {}

  

  @Query(() => [Dispositivo], { name: 'dispositivos' })
  findAll() {
    return this.httpService.findAllDispositivos()
    // return this.dispositivosService.findAll();
  }

  @Query(() => Dispositivo, { name: 'dispositivo' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.httpService.findOneDispositivo(id);
    // return this.dispositivosService.findOne(id);
  }

  @ResolveField(()=> Cliente)
  cliente (@Parent() dispositivo:Dispositivo){
    return this.httpService.findOneCliente(dispositivo.clienteId)
  }

  
}
