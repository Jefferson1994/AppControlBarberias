import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cliente } from './Cliente'; 
import { Colaborador } from './Colaborador';
import { Servicio } from './Servicio';
import { EstadoReserva } from './EstadoReserva'; 

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id!: number; 

  @Column({ type: 'int', nullable: false })
  id_cliente!: number;

  @Column({ type: 'int', nullable: false })
  id_colaborador!: number;

  @Column({ type: 'int', nullable: false })
  id_servicio!: number;

  @Column({ type: 'int', nullable: false })
  id_estado!: number;


  @Column({ type: 'datetime2', nullable: false })
  fecha_hora_inicio!: Date;


  @Column({ type: 'datetime2', nullable: false })
  fecha_hora_fin!: Date;
  
  // Relaciones
  @ManyToOne(() => Cliente, (cliente) => cliente.reservas)
  @JoinColumn({ name: 'id_cliente' })
  cliente!: Cliente;

  @ManyToOne(() => Colaborador, (colaborador) => colaborador.reservas)
  @JoinColumn({ name: 'id_colaborador' })
  colaborador!: Colaborador;

  @ManyToOne(() => Servicio, (servicio) => servicio.reservas)
  @JoinColumn({ name: 'id_servicio' })
  servicio!: Servicio;

  @ManyToOne(() => EstadoReserva, (estadoReserva) => estadoReserva.reservas)
  @JoinColumn({ name: 'id_estado' })
  estado!: EstadoReserva;
}