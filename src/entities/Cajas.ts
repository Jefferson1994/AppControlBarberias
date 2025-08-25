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
import { Colaborador } from './Colaborador'; // Importar Colaborador
import { Negocio } from './Negocio'; // Importar Negocio
import { MovimientoCaja } from './MovimientoCajas'; // Importar MovimientoCaja (confirmado por el usuario)
import { Venta } from './Venta';

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false, name: 'id_Colaborador' })
  id_Colaborador!: number;

  @Column({ type: 'int', nullable: false })
  id_negocio!: number;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // Fecha y hora de apertura
  fecha_apertura!: Date;

  @Column({ type: 'datetime2', nullable: true }) // Fecha y hora de cierre (nullable hasta que se cierre)
  fecha_cierre!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  monto_inicial!: number; // Monto con el que se abrió la caja

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_esperado!: number; // El total que el sistema espera basado en movimientos\

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_calculado!: number; // El total que el sistema espera basado en movimientos

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: true })
  total_real!: number | null; // El total que el usuario contó al cerrar (nullable hasta que se cierre)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  sobrante!: number; // Campo para el sobrante

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  faltante!: number; // Campo para el faltante

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_comisiones_generadas!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  // Campo para control de estado de la caja: 1 = Abierta (por defecto), 0 = Cerrada
  @Column({ type: 'tinyint', default: 1, nullable: false })
  estado!: number;


  // Relaciones
  @ManyToOne(() => Colaborador, (colaborador) => colaborador.cajas)
  @JoinColumn({ name: 'id_Colaborador' })
  Colaborador!: Colaborador;

  @ManyToOne(() => Negocio, (negocio) => negocio.cajas)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  // Relación con la entidad MovimientoCaja para todos los movimientos de la caja
  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.caja)
  movimientosCaja!: MovimientoCaja[];

}
