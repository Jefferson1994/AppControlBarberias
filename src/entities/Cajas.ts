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
import { MovimientoCaja } from './MovimientoCajas'; // Importar MovimientoCaja

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn()
  id!: number;

  
  @Column({ type: 'int', nullable: false, name: 'id_Colaborador' }) // Nombre de la columna en la DB (con mayúscula)
  id_Colaborador!: number;

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
  observaciones!: string | null;

    // Campo para control de eliminación lógica: 0 = activo (por defecto), 1 = inactivo
  @Column({ type: 'tinyint', default: 0, nullable: false }) // Cambiado a 0 para activo como default
  estado!: number;


  // Relaciones
  @ManyToOne(() => Colaborador, (Colaborador) => Colaborador.cajas) // Apunta a la clase Colaborador
  @JoinColumn({ name: 'id_Colaborador' }) // La columna FK en la tabla 'cajas' que referencia a 'Colaboradores.id'
  Colaborador!: Colaborador;

  @ManyToOne(() => Negocio, (negocio) => negocio.cajas)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.caja)
  movimientosCaja!: MovimientoCaja[];
}
