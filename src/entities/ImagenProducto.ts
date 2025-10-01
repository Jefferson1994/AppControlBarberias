
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from './Producto'; 

@Entity('imagenes_producto') // Nombre de la tabla en la base de datos
export class ImagenProducto {
  @PrimaryGeneratedColumn()
  id!: number;

  // La URL completa donde está almacenada la imagen.
  @Column({ type: 'varchar', length: 512, nullable: false })
  url_imagen!: string;

  // Campo opcional para definir el orden de visualización.
  @Column({ type: 'int', nullable: true })
  orden!: number | null;

  // --- Relación con Producto ---
  // Muchas imágenes pertenecen a un solo producto.
  @ManyToOne(() => Producto, (producto) => producto.imagenes, {
    onDelete: 'CASCADE' // Si se borra un producto, se borran sus imágenes.
  })
  @JoinColumn({ name: 'id_producto' }) // Especifica la columna de clave foránea.
  producto!: Producto;
}