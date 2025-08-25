// =============================================================================
// entities/Venta.ts
// Entidad TypeORM para la gestión de ventas (facturas o recibos simples).
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
import { Colaborador } from './Colaborador'; // Asume que tienes una entidad Colaborador
import { Cliente } from './Cliente'; // Asume que tienes una entidad Cliente
import { MetodoPago } from './Metodo_Pago'; // Asume que tienes una entidad MetodoPago
import { DetalleVenta } from './DetalleVenta'; // Importa la entidad DetalleVenta

@Entity('ventas') // Nombre de la tabla en la base de datos

export class Venta {
  // ===========================================================================
  // Campos / Atributos de la Entidad (Columnas directas en la tabla 'ventas')
  // ===========================================================================
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'id_negocio' })
  id_negocio!: number;

  @Column({ name: 'id_colaborador' })
  id_colaborador!: number;

  @Column({ name: 'id_cliente', nullable: true })
  id_cliente!: number | null;

  @Column({ name: 'id_metodo_pago_principal' })
  id_metodo_pago_principal!: number;

  @Column({ type: 'varchar', length: 50, name: 'tipo_comprobante' })
  tipo_comprobante!: 'FACTURA' | 'COMPROBANTE_SIMPLE';

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'numero_comprobante' })
  numero_comprobante!: string | null;

  @CreateDateColumn({ name: 'fecha_venta' })
  fecha_venta!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  iva!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @Column({ type: 'varchar', length: 50 })
  estado!: string;


  @ManyToOne(() => Colaborador, { eager: false, nullable: false })
  @JoinColumn({ name: 'id_colaborador' }) // La columna 'id_colaborador' ya existe y es manejada aquí
  colaborador!: Colaborador;

  @ManyToOne(() => Cliente, { nullable: true, eager: false })
  @JoinColumn({ name: 'id_cliente' }) // La columna 'id_cliente' ya existe y es manejada aquí
  cliente!: Cliente | null;

  @ManyToOne(() => MetodoPago, { eager: false, nullable: false })
  @JoinColumn({ name: 'id_metodo_pago_principal' }) // La columna 'id_metodo_pago_principal' ya existe y es manejada aquí
  metodoPagoPrincipal!: MetodoPago;

  @OneToMany(() => DetalleVenta, (detalleVenta) => detalleVenta.ventas, { cascade: true, eager: true })
  detalles!: DetalleVenta[];



  
}

