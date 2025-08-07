import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Gasto } from './Gasto';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nombre: string;

  @Column()
  password: string;

  @OneToMany(() => Gasto, (gasto) => gasto.usuario)
  gastos: Gasto[];
}
