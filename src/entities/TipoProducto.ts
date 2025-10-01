// En src/entities/TipoProducto.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany,ManyToMany } from 'typeorm';
import { Producto } from './Producto'; // Para la relación inversa
import { TipoEmpresa } from './TipoEmpresa';

@Entity('tipos_producto')
export class TipoProducto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  nombre!: string; // Ej: 'Champús', 'Ceras', 'Acondicionadores', 'Maquillaje', 'Cuidado Facial'

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'tinyint', default: 1, nullable: false }) // 1 = activo, 0 = inactivo 
  activo!: number; 
  
  // Relación OneToMany: Un TipoProducto puede tener muchos Productos
  @OneToMany(() => Producto, (producto) => producto.tipoProducto)
  productos!: Producto[];
  
  @ManyToMany(() => TipoEmpresa, (tipoEmpresa) => tipoEmpresa.tiposProductoPermitidos)
  tiposEmpresa!: TipoEmpresa[];
}