import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Reserva } from '../entities/Reserva'; // Importa la entidad Reserva

@Entity('estado_reservas')
export class EstadoReserva {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  // Campo para control de eliminación lógica
  @Column({ type: 'tinyint', default: 0, nullable: false })
  activo!: number; // 0 = activo, 1 = inactivo

  // Relación inversa para que puedas obtener todas las reservas con este estado
  @OneToMany(() => Reserva, (reserva) => reserva.estado)
  reservas!: Reserva[];
}