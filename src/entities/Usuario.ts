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

import { Negocio } from './Negocio'; // Importar Negocio
import { Empleado } from './Empleado'; // Importar Empleado
import { Rol } from './Rol';
import { Otp } from './Otp';
// --- Entidad Usuario ---
@Entity('usuarios') // Nombre de la tabla en la base de datos
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  correo!: string;

  @Column({ type: 'text', nullable: false })
  contrasena!: string; // Almacenar el hash de la contraseña

  // clave foránea a la tabla 'roles'
  @Column({ type: 'int', nullable: false })
  id_rol!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_telefono!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero_identificacion!: string;

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' }) // CORRECCIÓN: Cambiado a 'datetime2' y 'GETDATE()' para MSSQL
  creado_en!: Date;

  @Column({ type: 'tinyint', default: 1, nullable: false })
  activo!: number;

  // Relaciones
  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'id_rol' }) // Define la columna en Usuario que es la FK
  rol!: Rol; // La propiedad que contendrá el objeto Rol relacionado

  @OneToMany(() => Negocio, (negocio) => negocio.administrador)
  negociosAdministrados!: Negocio[];

  @OneToMany(() => Empleado, (empleado) => empleado.usuario)
  empleados!: Empleado[];

  @OneToMany(() => Otp, (otp) => otp.usuario)
  otps!: Otp[];
}
