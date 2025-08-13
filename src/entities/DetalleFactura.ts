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
import { Factura } from './Facturas'; // Importar Factura
import { Producto } from './Producto'; // Importar Producto
import { Servicio } from './Servicio'; // Importar Servicio

@Entity('detalles_factura')
export class DetalleFactura {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  id_factura!: number;

  @Column({ type: 'int', nullable: true })
  id_producto!: number; // Puede ser NULL si es un servicio

  @Column({ type: 'int', nullable: true })
  id_servicio!: number; // Puede ser NULL si es un producto

  @Column({ type: 'text', nullable: true })
  descripcion!: string; // Para descripción manual o servicios sin ID específico

  @Column({ type: 'int', nullable: true })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_unitario!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total!: number;

  // Relaciones
  @ManyToOne(() => Factura, (factura) => factura.detallesFactura)
  @JoinColumn({ name: 'id_factura' })
  factura!: Factura;

  @ManyToOne(() => Producto, (producto) => producto.detallesFactura)
  @JoinColumn({ name: 'id_producto' })
  producto!: Producto;

  @ManyToOne(() => Servicio, (servicio) => servicio.detallesFactura)
  @JoinColumn({ name: 'id_servicio' })
  servicio!: Servicio;
}