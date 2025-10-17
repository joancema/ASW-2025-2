// rest-client.service.ts
import { Injectable,  } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RestClientService {
  constructor(private httpService: HttpService) {}

  async getUsuarios() {
    const response = await firstValueFrom(
      this.httpService.get('http://localhost:3000/api/users')
    );
    return response.data;
  }

  async getUsuarioById(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`http://localhost:3000/api/users/${id}`)
    );
    return response.data;
  }

  async getOpciones() {
    const response = await firstValueFrom(
      this.httpService.get('http://localhost:3000/api/options')
    );
    return response.data;
  }

  async getOpcionById(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`http://localhost:3000/api/options/${id}`)
    );
    return response.data;
  }
}