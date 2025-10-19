import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Cliente } from './entities/cliente.entity';
import { HttpServices } from 'src/http/http.service';
import { Dispositivo } from 'src/dispositivos/entities/dispositivo.entity';

@Resolver(() => Cliente)
export class ClientesResolver {
  constructor(
    private  httpServices: HttpServices
  ) {}

    @Query(() => [Cliente], { name: 'clientes' })
  findAll() {
    // return this.clientesService.findAll();
    return this.httpServices.findAllClientes();
  }

  @Query(() => Cliente, { name: 'cliente' })
  findOne(@Args('id', { type: () => String }) id: string) {
    // return this.clientesService.findOne(id);
    return this.httpServices.findOneCliente(id);
  }

  @ResolveField(()=>[Dispositivo])
  async dispositivos(@Parent() cliente:Cliente ){
    const dispositivosPorCliente= await this.httpServices.findAllDispositivos();
    return dispositivosPorCliente.filter(d=>d.clienteId===cliente.id);
  }
  



  
}
