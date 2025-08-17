import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany, 
} from 'typeorm';

import { Negocio } from './Negocio'; 

@Entity('tipos_empresa') 
export class TipoEmpresa {
  @PrimaryGeneratedColumn()
  id!: number; // 

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  nombre!: string; 

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null; 

  // para 0 esta activo , uno esta inactivo 
  @Column({ type: 'tinyint', default: 0, nullable: false })
  activo!: number; 

  
  @OneToMany(() => Negocio, (negocio) => negocio.tipoEmpresa)
  negocios!: Negocio[];
}
