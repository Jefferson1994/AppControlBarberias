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
import { Usuario } from './Usuario'; // Importar Usuario
import { Negocio } from './Negocio'; // Importar Negocio
import { Caja } from './Cajas'; // Importar Caja

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', unique: true, nullable: false })
  id_usuario!: number;

  @Column({ type: 'int', nullable: false })
  id_negocio!: number;

  @Column({ type: 'bit', default: true, nullable: false }) // CORRECCIÓN: Cambiado a 'bit' para MSSQL
  activo!: boolean;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.empleados)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;

  @ManyToOne(() => Negocio, (negocio) => negocio.empleados)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  @OneToMany(() => Caja, (caja) => caja.empleado)
  cajas!: Caja[];
}