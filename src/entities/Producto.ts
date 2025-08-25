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
import { TipoProducto } from './TipoProducto'; // Importar TipoProducto
import { DetalleVenta } from './DetalleVenta';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio_venta!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_promocion!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_descuento!: number | null;

  // Cantidad actual en stock
  @Column({ type: 'int', default: 0, nullable: false })
  stock_actual!: number;

  // ¡CORRECCIÓN!: id_negocio es NOT NULL según el esquema de DB.
  @Column({ type: 'int', nullable: false })
  id_negocio!: number;

  // ¡CORRECCIÓN!: id_tipo_producto es NOT NULL según el esquema de DB.
  @Column({ type: 'int', nullable: false })
  id_tipo_producto!: number;

    // para 0 esta activo , uno esta inactivo 
  @Column({ type: 'tinyint', default: 1, nullable: false })
  activo!: number; 


  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.productos)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio; // No es nullable aquí porque la FK es NOT NULL

  @OneToMany(() => DetalleFactura, (detalleFactura) => detalleFactura.producto)
  detallesFactura!: DetalleFactura[];

  // Relación ManyToOne con TipoProducto
  @ManyToOne(() => TipoProducto, (tipoProducto) => tipoProducto.productos)
  @JoinColumn({ name: 'id_tipo_producto' })
  tipoProducto!: TipoProducto; // No es nullable aquí porque la FK es NOT NULL

  @OneToMany(() => DetalleVenta, (detalleVenta) => detalleVenta.producto)
    detallesVenta!: DetalleVenta[];
}
