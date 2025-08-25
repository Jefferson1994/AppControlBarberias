// =============================================================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { Venta } from './Venta'; // Asegúrate de que la ruta sea correcta
import { Producto } from './Producto';
import { Servicio } from './Servicio';

@Entity('detalles_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn()
  id!: number;

  // *** NUEVA COLUMNA: id_venta ***
  // Esta es la clave foránea que referencia a la Venta padre
  @Column({ type: 'int', nullable: false })
  id_venta!: number;

  @Column({ type: 'int', nullable: true })
  id_producto!: number | null; // ID del producto vendido (opcional)

  @Column({ type: 'int', nullable: true })
  id_servicio!: number | null; // ID del servicio vendido (opcional)

  @Column({ type: 'varchar', length: 255 })
  nombre_producto!: string; // O nombre del servicio

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles)
  @JoinColumn({ name: 'id_venta' }) // Nombre de la columna en la tabla detalles_venta que referencia a ventas.id
  ventas!: Venta; // La relación con la Venta padre (ahora sin '?' porque id_venta es nullable: false)

  @ManyToOne(() => Producto, (producto) => producto.detallesVenta, { nullable: true })
  @JoinColumn({ name: 'id_producto' }) // Columna en detalles_venta que referencia a productos.id
  producto!: Producto | null; // El producto asociado a este detalle de venta

  // Relación ManyToOne con Servicio (opcional)
  @ManyToOne(() => Servicio, (servicio) => servicio.detallesVenta, { nullable: true })
  @JoinColumn({ name: 'id_servicio' }) // Columna en detalles_venta que referencia a servicios.id
  servicio!: Servicio | null; // El servicio asociado a este detalle de venta
}