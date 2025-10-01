import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany, 
  ManyToMany, // <-- 1. Importa ManyToMany
  JoinTable, 
} from 'typeorm';

import { Negocio } from './Negocio'; 
import { TipoProducto } from './TipoProducto';
import { TipoServicio } from './TipoServicio';

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

  @Column({
    type: 'varchar', //
    length: 10,      // 
    default: 'SERVICIOS',
    nullable: false
  })
  clasificacion!: 'PRODUCTOS' | 'SERVICIOS' | 'AMBOS';

  
  @OneToMany(() => Negocio, (negocio) => negocio.tipoEmpresa)
  negocios!: Negocio[];

  // productos permitidos para este tipo de empresa

  @ManyToMany(() => TipoProducto)
  @JoinTable({
    name: 'tipo_empresa_has_tipos_producto', 
    joinColumn: {
      name: 'id_tipo_empresa',              
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'id_tipo_producto',             
      referencedColumnName: 'id'
    }
  })
  tiposProductoPermitidos!: TipoProducto[];

  // servicios permitidos para este tipo de empresa
  @ManyToMany(() => TipoServicio)
  @JoinTable({
    name: 'tipo_empresa_has_tipos_servicios', 
    joinColumn: {
      name: 'id_tipo_empresa',              
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'id_tipo_servicio',             
      referencedColumnName: 'id'
    }
  })
  tiposServiciosPermitidos!: TipoServicio[];
}
