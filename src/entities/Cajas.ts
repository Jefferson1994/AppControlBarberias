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
import { Empleado } from './Empleado'; // Importar Empleado
import { Negocio } from './Negocio'; // Importar Negocio
import { MovimientoCaja } from './MovimientoCajas'; // Importar MovimientoCaja

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  id_empleado!: number;

  @Column({ type: 'int', nullable: false })
  id_negocio!: number;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()'
  fecha_apertura!: Date;

  @Column({ type: 'datetime2', nullable: true }) // CORRECCIÓN: Cambiado a 'datetime2'
  fecha_cierre!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_esperado!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_real!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  estado!: string; // 'abierta' | 'cerrada'

  // Relaciones
  @ManyToOne(() => Empleado, (empleado) => empleado.cajas)
  @JoinColumn({ name: 'id_empleado' })
  empleado!: Empleado;

  @ManyToOne(() => Negocio, (negocio) => negocio.cajas)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.caja)
  movimientosCaja!: MovimientoCaja[];
}
