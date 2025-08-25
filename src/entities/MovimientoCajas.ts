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
import { TipoMovimientoCaja } from './TipoMovimientoCaja';
import { Venta } from './Venta';

@Entity('movimientos_caja')
export class MovimientoCaja {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  id_caja!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto!: number;

  @Column({ type: 'int', nullable: false })
  id_tipo_movimiento_caja!: number;

  
  @Column({ type: 'int', nullable: true })
  id_metodo_pago!: number | null; 

  
  @Column({ type: 'int', nullable: true })
  id_factura!: number | null; 

  @Column({ type: 'int', nullable: true }) // ¡NUEVA COLUMNA PARA EL ID DE VENTA!
  id_venta!: number | null; 

  
  @Column({ type: 'text', nullable: true })
  detalle!: string | null; 

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()' para MSSQL
  creado_en!: Date;

  // Relaciones
  @ManyToOne(() => Caja, (caja) => caja.movimientosCaja)
  @JoinColumn({ name: 'id_caja' })
  caja!: Caja;

  @ManyToOne(() => MetodoPago, (metodoPago) => metodoPago.movimientosCaja)
  @JoinColumn({ name: 'id_metodo_pago' })
  metodoPago!: MetodoPago;

  @ManyToOne(() => Factura, (factura) => factura.movimientosCaja)
  @JoinColumn({ name: 'id_factura' })
  factura!: Factura;

  @ManyToOne(() => TipoMovimientoCaja, { eager: false, nullable: false })
  @JoinColumn({ name: 'id_tipo_movimiento_caja' })
  tipoMovimientoCaja!: TipoMovimientoCaja;

  @ManyToOne(() => Venta, { eager: false, nullable: true }) // Debe apuntar a la entidad Venta
  @JoinColumn({ name: 'id_venta' }) // La columna FK en movimientos_caja
  ventas!: Venta | null; // El nombre de la propiedad en la entidad

}
