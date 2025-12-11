import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Egreso, DetalleEgreso } from './entities/egreso.entity';

export interface CreateEgresoDto {
  proveedor: string;
  fecha: string;
  detalles: Array<{
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  observaciones?: string;
}

@Injectable()
export class EgresosService {
  private readonly logger = new Logger(EgresosService.name);

  constructor(
    @InjectRepository(Egreso)
    private readonly egresoRepository: Repository<Egreso>,
  ) {}

  /**
   * Crear un nuevo egreso
   * Calcula automáticamente los subtotales y el total
   */
  async crear(data: CreateEgresoDto): Promise<Egreso> {
    try {
      this.logger.log(`Creando egreso para proveedor: ${data.proveedor}`);

      // Calcular subtotales para cada detalle
      const detallesConSubtotal: DetalleEgreso[] = data.detalles.map(
        (detalle) => ({
          producto_id: detalle.producto_id,
          producto_nombre: detalle.producto_nombre,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.cantidad * detalle.precio_unitario,
        }),
      );

      // Calcular total sumando todos los subtotales
      const total = detallesConSubtotal.reduce(
        (sum, detalle) => sum + detalle.subtotal,
        0,
      );

      // Crear el egreso
      const egreso = this.egresoRepository.create({
        proveedor: data.proveedor,
        fecha: data.fecha,
        detalles: detallesConSubtotal,
        total: total,
        observaciones: data.observaciones || null,
      });

      const saved = await this.egresoRepository.save(egreso);

      this.logger.log(
        `Egreso creado con ID: ${saved.id}, Total: $${saved.total}`,
      );
      return saved;
    } catch (error) {
      this.logger.error(`Error creando egreso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener los últimos 50 egresos ordenados por fecha descendente
   */
  async findAll(): Promise<Egreso[]> {
    try {
      return await this.egresoRepository.find({
        order: { fecha: 'DESC', created_at: 'DESC' },
        take: 50,
      });
    } catch (error) {
      this.logger.error(`Error obteniendo egresos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un egreso por ID
   */
  async findOne(id: number): Promise<Egreso> {
    try {
      const egreso = await this.egresoRepository.findOne({
        where: { id },
      });

      if (!egreso) {
        throw new NotFoundException(`Egreso con ID ${id} no encontrado`);
      }

      return egreso;
    } catch (error) {
      this.logger.error(`Error obteniendo egreso ${id}: ${error.message}`);
      throw error;
    }
  }
}
