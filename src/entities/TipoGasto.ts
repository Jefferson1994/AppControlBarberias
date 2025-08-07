import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Gasto } from './Gasto';
import { CategoriaGasto } from './CategoriaGasto';

@Entity()
export class TipoGasto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string; // Ingreso o Egreso

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Gasto, (gasto) => gasto.tipo)
  gastos: Gasto[];

  @OneToMany(() => CategoriaGasto, (categoria) => categoria.tipo)
  categorias: CategoriaGasto[];  // <-- Esta línea se agrega para relación con Categorias
}
