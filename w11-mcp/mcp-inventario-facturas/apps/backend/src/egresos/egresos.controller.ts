import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { EgresosService, CreateEgresoDto } from './egresos.service';
import { Egreso } from './entities/egreso.entity';

@Controller('egresos')
export class EgresosController {
  private readonly logger = new Logger(EgresosController.name);

  constructor(private readonly egresosService: EgresosService) {}

  /**
   * POST /egresos
   * Crear un nuevo egreso
   */
  @Post()
  async crear(@Body() data: CreateEgresoDto): Promise<Egreso> {
    this.logger.log('POST /egresos');
    this.logger.log(`Proveedor: ${data.proveedor}, Fecha: ${data.fecha}`);
    return await this.egresosService.crear(data);
  }

  /**
   * GET /egresos
   * Obtener los últimos 50 egresos
   */
  @Get()
  async findAll(): Promise<Egreso[]> {
    this.logger.log('GET /egresos');
    return await this.egresosService.findAll();
  }

  /**
   * GET /egresos/:id
   * Obtener un egreso por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Egreso> {
    this.logger.log(`GET /egresos/${id}`);
    return await this.egresosService.findOne(id);
  }
}
