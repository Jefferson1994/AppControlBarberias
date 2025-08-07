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

import { Cliente } from './Cliente'; // Importar Cliente
import { Negocio } from './Negocio'; // Importar Negocio
import { DetalleFactura } from './DetalleFactura'; // Importar DetalleFactura
import { MovimientoCaja } from './MovimientoCajas'; // Importar MovimientoCaja

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  numero_factura: string;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()' para MSSQL
  fecha: Date;

  @Column({ type: 'int', nullable: true })
  id_negocio: number;

  @Column({ type: 'int', nullable: true })
  id_cliente: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado: string; // 'pendiente', 'enviada', 'autorizada', 'anulada'

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_comprobante: string; // 'factura', 'nota de venta', etc.

  // Relaciones
  @ManyToOne(() => Cliente, (cliente) => cliente.facturas)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Negocio, (negocio) => negocio.facturas)
  @JoinColumn({ name: 'id_negocio' })
  negocio: Negocio;

  @OneToMany(() => DetalleFactura, (detalleFactura) => detalleFactura.factura)
  detallesFactura: DetalleFactura[];

  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.factura)
  movimientosCaja: MovimientoCaja[];
}