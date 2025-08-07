// Importaciones necesarias de TypeORM
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Negocio } from './Negocio'; // Importar Negocio
import { DetalleFactura } from './DetalleFactura'; // Importar DetalleFactura

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio_venta: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_promocion: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_descuento: number;

  @Column({ type: 'int', nullable: true })
  id_negocio: number;

  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.productos)
  @JoinColumn({ name: 'id_negocio' })
  negocio: Negocio;

  @OneToMany(() => DetalleFactura, (detalleFactura) => detalleFactura.producto)
  detallesFactura: DetalleFactura[];
}