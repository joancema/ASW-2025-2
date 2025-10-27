import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { DivicesService } from './divices.service';
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors:{ origin:'*'

   }
})

export class DivicesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server:Server;
  constructor(private readonly divicesService: DivicesService) {}
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }
  emitirEvento(event: string, data: any) {
    this.server.emit(event, data);
  }
  @SubscribeMessage('evento')
  escucharEvento(evento: Socket, payload: any) {
    console.log('Evento recibido:', evento.id);
    console.log('Evento recibido:', payload);
  }

@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: any,
  @ConnectedSocket() client: Socket,
): string {
  console.log(data);
  return data;
}

}
