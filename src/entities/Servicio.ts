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
import { DetalleFactura } from './DetalleFactura'; // Importar DetalleFactura

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio!: number;

  @Column({ type: 'int', nullable: true })
  id_negocio!: number;

  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.servicios)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio;

  @OneToMany(() => DetalleFactura, (detalleFactura) => detalleFactura.servicio)
  detallesFactura!: DetalleFactura[];
}