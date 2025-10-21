import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateMascotaDto } from './dto/update-mascota.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('mascotas')
export class MascotasController {
  constructor(
    private readonly httpService: HttpService,
    private readonly mascotasService: MascotasService) {}

  @Post()
  async create(@Body() createMascotaDto: CreateMascotaDto) {
    const mascotaCreada= this.mascotasService.create(createMascotaDto);
    try {
      await firstValueFrom(
        this.httpService.post(
          'http://localhost:3001/notificaciones/mascota-creada',
          mascotaCreada
        )
      );
      console.log('✅ Notificación enviada al WebSocket');
    } catch (error) {
      console.log('⚠️ WebSocket no disponible:', error.message);
    }
    return mascotaCreada;
  }

  @Get()
  findAll() {
    return this.mascotasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mascotasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMascotaDto: UpdateMascotaDto) {
    return this.mascotasService.update(+id, updateMascotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mascotasService.remove(+id);
  }
}
