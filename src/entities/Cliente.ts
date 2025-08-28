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
import { Factura } from './Facturas'; // Importar Factura 
import { Reserva } from './Reserva';
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  identificacion!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correo!: string;

  @Column({ type: 'text', nullable: true })
  direccion!: string;

  // Relaciones
  @OneToMany(() => Factura, (factura) => factura.cliente)
  facturas!: Factura[];

  @OneToMany(() => Reserva, (reserva) => reserva.cliente)
  reservas!: Reserva[];
}