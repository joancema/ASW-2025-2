import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly httpService: HttpService,
    private readonly devicesService: DevicesService) {}

  @Post()
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    const nuevoDevice=  this.devicesService.create(createDeviceDto);
    await firstValueFrom(
      this.httpService.post('http://localhost:3001/api/notifications/create-device', nuevoDevice).pipe(
        catchError((error: AxiosError) => {
          console.log(error.response?.data);
          throw 'An error happened!';
        }),
      ),
    );
    return nuevoDevice;


    

  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(+id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(+id);
  }
}
