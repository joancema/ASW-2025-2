import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  private readonly logger = new Logger(ProductosService.name);

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  /**
   * Buscar productos por código, nombre o descripción
   * Retorna máximo 10 resultados
   */
  async buscar(query: string): Promise<Producto[]> {
    try {
      this.logger.log(`Buscando productos con query: "${query}"`);

      const productos = await this.productoRepository.find({
        where: [
          { codigo: Like(`%${query}%`) },
          { nombre: Like(`%${query}%`) },
          { descripcion: Like(`%${query}%`) },
        ],
        take: 10,
        order: { nombre: 'ASC' },
      });

      this.logger.log(`Encontrados ${productos.length} productos`);
      return productos;
    } catch (error) {
      this.logger.error(`Error buscando productos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un producto por ID
   * Lanza NotFoundException si no existe
   */
  async findOne(id: number): Promise<Producto> {
    try {
      const producto = await this.productoRepository.findOne({
        where: { id },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return producto;
    } catch (error) {
      this.logger.error(`Error obteniendo producto ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo producto
   */
  async create(data: Partial<Producto>): Promise<Producto> {
    try {
      this.logger.log(`Creando producto: ${data.nombre}`);

      const producto = this.productoRepository.create(data);
      const saved = await this.productoRepository.save(producto);

      this.logger.log(`Producto creado con ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Error creando producto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar stock de un producto
   */
  async updateStock(id: number, cantidad: number): Promise<Producto> {
    try {
      const producto = await this.findOne(id);
      producto.stock = cantidad;

      const updated = await this.productoRepository.save(producto);
      this.logger.log(`Stock actualizado para producto ${id}: ${cantidad}`);

      return updated;
    } catch (error) {
      this.logger.error(`Error actualizando stock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los productos
   */
  async findAll(): Promise<Producto[]> {
    try {
      return await this.productoRepository.find({
        order: { nombre: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error obteniendo productos: ${error.message}`);
      throw error;
    }
  }
}
