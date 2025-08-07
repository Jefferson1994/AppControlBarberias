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

import { Caja } from './Cajas'; // Importar Caja
import { MetodoPago } from './Metodo_Pago'; // Importar MetodoPago
import { Factura } from './Facturas'; // Importar Factura

@Entity('movimientos_caja')
export class MovimientoCaja {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  id_caja: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  tipo: string; // 'ingreso' | 'egreso'

  @Column({ type: 'int', nullable: true })
  id_metodo_pago: number;

  @Column({ type: 'int', nullable: true })
  id_factura: number;

  @Column({ type: 'text', nullable: true })
  detalle: string;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()' para MSSQL
  creado_en: Date;

  // Relaciones
  @ManyToOne(() => Caja, (caja) => caja.movimientosCaja)
  @JoinColumn({ name: 'id_caja' })
  caja: Caja;

  @ManyToOne(() => MetodoPago, (metodoPago) => metodoPago.movimientosCaja)
  @JoinColumn({ name: 'id_metodo_pago' })
  metodoPago: MetodoPago;

  @ManyToOne(() => Factura, (factura) => factura.movimientosCaja)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;
}
