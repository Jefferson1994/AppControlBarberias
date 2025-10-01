import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Servicio } from './Servicio'; // Importa la entidad principal 'Servicio'

/**
 * Entidad ImagenServicio: Almacena las URLs de las imágenes asociadas a un servicio.
 * Establece una relación de muchos a uno con la entidad Servicio.
 */
@Entity('imagenes_servicio') // Nombre de la tabla en la base de datos
export class ImagenServicio {
  // Clave primaria autoincremental para la imagen.
  @PrimaryGeneratedColumn()
  id!: number;

  // La URL completa donde está almacenada la imagen. Es obligatoria.
  @Column({ type: 'varchar', length: 512, nullable: false })
  url_imagen!: string;

  // Campo opcional para definir el orden de visualización de las imágenes.
  @Column({ type: 'int', nullable: true })
  orden!: number | null;

  // --- Relación con la entidad Servicio ---

  // Muchas imágenes pertenecen a un solo servicio.
  @ManyToOne(() => Servicio, (servicio) => servicio.imagenes, {
    onDelete: 'CASCADE' // Si se borra un servicio, se borran sus imágenes asociadas.
  })
  @JoinColumn({ name: 'id_servicio' }) // Especifica la columna de clave foránea.
  servicio!: Servicio;
}