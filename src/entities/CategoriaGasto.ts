import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Gasto } from './Gasto';
import { TipoGasto } from './TipoGasto';


@Entity()
export class CategoriaGasto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => TipoGasto, tipo => tipo.categorias)
  tipo: TipoGasto;

  @OneToMany(() => Gasto, (gasto) => gasto.categoria)
  gastos: Gasto[];
}
