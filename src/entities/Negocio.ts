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
import { Empleado } from './Empleado'; // Importar Empleado
import { Caja } from './Cajas'; // Importar Caja
import { Producto } from './Producto'; // Importar Producto
import { Servicio } from './Servicio'; // Importar Servicio
import { Factura } from './Facturas'; // Importar Factura

@Entity('negocios')
export class Negocio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'int', nullable: false })
  id_administrador: number;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()' para MSSQL
  creado_en: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.negociosAdministrados)
  @JoinColumn({ name: 'id_administrador' })
  administrador: Usuario;

  @OneToMany(() => Empleado, (empleado) => empleado.negocio)
  empleados: Empleado[];

  @OneToMany(() => Caja, (caja) => caja.negocio)
  cajas: Caja[];

  @OneToMany(() => Producto, (producto) => producto.negocio)
  productos: Producto[];

  @OneToMany(() => Servicio, (servicio) => servicio.negocio)
  servicios: Servicio[];

  @OneToMany(() => Factura, (factura) => factura.negocio)
  facturas: Factura[];
}