// src/entities/TipoMovimientoCaja.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { MovimientoCaja } from './MovimientoCajas'; // Para la relación inversa

@Entity('tipos_movimiento_caja') // Nombre de la tabla en la base de datos
export class TipoMovimientoCaja {
  @PrimaryGeneratedColumn()
  id!: number; // ID autoincremental del tipo de movimiento

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  codigo!: string; // Nombre del tipo (ej. 'ingreso', 'egreso', 'transferencia')

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  nombre!: string; // Nombre del tipo (ej. 'ingreso', 'egreso', 'transferencia')

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null; // Descripción detallada del tipo

  // Campo para control de eliminación lógica: 0 = activo, 1 = inactivo
  @Column({ type: 'tinyint', default: 0, nullable: false })
  activo!: number; // 0 para activo, 1 para inactivo

  // Relación OneToMany con MovimientoCaja: Un TipoMovimientoCaja puede tener muchos MovimientoCaja
  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.id_tipo_movimiento_caja)
  movimientosCaja!: MovimientoCaja[];
}