
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Negocio } from './Negocio'; // Importa la entidad Negocio para la relación


@Entity('imagenes_empresa') // Nombre de la tabla en la base de datos
export class ImagenEmpresa {
  // Clave primaria autoincremental para la imagen.
  @PrimaryGeneratedColumn()
  id!: number;


  @Column({ type: 'int', nullable: false })
  id_empresa!: number;


  @Column({ type: 'varchar', length: 512, nullable: false })
  url_imagen!: string;

  @Column({ type: 'int', nullable: true })
  orden!: number | null;

  // Relación ManyToOne: Muchas imágenes pertenecen a un solo negocio.
  @ManyToOne(() => Negocio, (negocio) => negocio.imagenes, {
    onDelete: 'CASCADE' // Si se borra un negocio, se borran sus imágenes asociadas.
  })
  @JoinColumn({ name: 'id_empresa' }) // Especifica que 'id_empresa' es la columna FK.
  negocio!: Negocio; // Propiedad para acceder al objeto Negocio desde una imagen.
}