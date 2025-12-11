import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';

@Controller('productos')
export class ProductosController {
  private readonly logger = new Logger(ProductosController.name);

  constructor(private readonly productosService: ProductosService) {}

  /**
   * GET /productos/buscar?q=query
   * Buscar productos por término de búsqueda
   */
  @Get('buscar')
  async buscar(@Query('q') query: string): Promise<Producto[]> {
    this.logger.log(`GET /productos/buscar?q=${query}`);

    if (!query || query.trim() === '') {
      return [];
    }

    return await this.productosService.buscar(query);
  }

  /**
   * GET /productos
   * Obtener todos los productos
   */
  @Get()
  async findAll(): Promise<Producto[]> {
    this.logger.log('GET /productos');
    return await this.productosService.findAll();
  }

  /**
   * GET /productos/:id
   * Obtener un producto por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Producto> {
    this.logger.log(`GET /productos/${id}`);
    return await this.productosService.findOne(id);
  }

  /**
   * POST /productos
   * Crear un nuevo producto
   */
  @Post()
  async create(@Body() data: Partial<Producto>): Promise<Producto> {
    this.logger.log('POST /productos');
    return await this.productosService.create(data);
  }

  /**
   * POST /productos/:id/stock
   * Actualizar stock de un producto
   */
  @Post(':id/stock')
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('cantidad') cantidad: number,
  ): Promise<Producto> {
    this.logger.log(`POST /productos/${id}/stock`);
    return await this.productosService.updateStock(id, cantidad);
  }
}
