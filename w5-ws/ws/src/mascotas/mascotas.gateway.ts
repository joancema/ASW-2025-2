import 
{
   WebSocketGateway,
   OnGatewayConnection,
   OnGatewayDisconnect,
   WebSocketServer,
 } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(
  { 
    cors: { origin: '*' } 
  }
)
export class MascotasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server:Server;


handleConnection(client:Socket){
  console.log('Cliente conectado:', client.id);
}
handleDisconnect(client:Socket){
  console.log('Cliente desconectado:', client.id);
}
emitirEvento(evento:string, mensaje:any){
  console.log('Emitiendo evento:', evento, 'con mensaje:', mensaje);
  this.server.emit(evento, mensaje);
}
}
