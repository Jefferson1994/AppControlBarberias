// Importaciones necesarias de TypeORM
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Usuario } from './Usuario'; // Importar Usuario
import { Negocio } from './Negocio'; // Importar Negocio
import { Caja } from './Cajas'; // Importar Caja
import { Reserva } from './Reserva';

// Define una restricción UNIQUE compuesta en id_usuario y id_negocio.
// Esto permite que un usuario sea colaborador en múltiples negocios,
// pero solo una vez por cada negocio.
@Unique(['id_usuario', 'id_negocio'])
@Entity('Colaboradores')
export class Colaborador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  id_usuario!: number;

  @Column({ type: 'int', nullable: false })
  id_negocio!: number;

  @Column({ type: 'int', nullable: false, default: 0 }) // No nulo, con un valor por defecto de 0
  porcentaje_ganancia!: number;

   @Column({ type: 'varchar', length: 3, nullable: true, unique: true }) // Hacemos `nullable: true` por si algún colaborador no es móvil o aún no se le asigna
  codigo_punto_emision_movil!: string | null;

  @Column({ type: 'bit', default: true, nullable: false }) // CORRECCIÓN: Cambiado a 'bit' para MSSQL
  activo!: boolean;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.empleados)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Usuario;

  @ManyToOne(() => Negocio, (negocio) => negocio.Colaboradors)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  @OneToMany(() => Caja, (caja) => caja.Colaborador)
  cajas!: Caja[];
  
  @OneToMany(() => Reserva, (reserva) => reserva.colaborador)
  reservas!: Reserva[];
}