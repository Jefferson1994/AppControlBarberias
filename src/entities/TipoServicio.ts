import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Servicio } from './Servicio'; // Importar Servicio para la relación inversa

@Entity('tipos_servicio') // Nombre de la tabla en la base de datos
export class TipoServicio {
  @PrimaryGeneratedColumn()
  id!: number; // ID autoincremental del tipo de servicio

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  nombre!: string; // Nombre del tipo de servicio (ej. 'Corte', 'Barba', 'Manicure')

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null; // Descripción del tipo de servicio

  // Campo para control de eliminación lógica: 0 = activo (por defecto), 1 = inactivo
  @Column({ type: 'tinyint', default: 0, nullable: false })
  activo!: number; 

  // Relación OneToMany con Servicio: Un TipoServicio puede tener muchos Servicios asociados
  @OneToMany(() => Servicio, (servicio) => servicio.tipoServicio)
  servicios!: Servicio[];
}