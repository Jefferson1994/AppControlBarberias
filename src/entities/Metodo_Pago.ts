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
import { MovimientoCaja } from './MovimientoCajas'; // Importar MovimientoCaja

@Entity('metodos_pago')
export class MetodoPago {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 500, unique: true, nullable: false })
  descripcion!: string;

  @Column({ type: 'bit', default: true, nullable: false }) // Cambiado a 'bit' para MSSQL
  activo!: boolean;

  // Relaciones
  @OneToMany(() => MovimientoCaja, (movimientoCaja) => movimientoCaja.metodoPago)
  movimientosCaja!: MovimientoCaja[];
}