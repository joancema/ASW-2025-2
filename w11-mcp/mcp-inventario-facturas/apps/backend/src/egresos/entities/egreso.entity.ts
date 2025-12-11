import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface DetalleEgreso {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

@Entity('egresos')
export class Egreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  proveedor: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('simple-json')
  detalles: DetalleEgreso[];

  @Column({ nullable: true })
  observaciones: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
