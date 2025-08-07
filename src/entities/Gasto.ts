import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Usuario } from './Usuario';
import { TipoGasto } from './TipoGasto';
import { CategoriaGasto } from './CategoriaGasto';

@Entity()
export class Gasto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 10, scale: 2 })
  monto: number;


  @Column()
  descripcion: string;

  @Column()
  fecha: Date;

  // Columnas FK explícitas
  @Column()
  usuarioId: number;

  @Column()
  tipoId: number;

  @Column()
  categoriaId: number;

  @Column({ default: true })
  activo: boolean;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.gastos)
  @JoinColumn({ name: "usuarioId" })  // indica la columna FK que usa esta relación
  usuario: Usuario;

  @ManyToOne(() => TipoGasto, (tipo) => tipo.gastos)
  @JoinColumn({ name: "tipoId" })
  tipo: TipoGasto;

  @ManyToOne(() => CategoriaGasto, (categoria) => categoria.gastos)
  @JoinColumn({ name: "categoriaId" })
  categoria: CategoriaGasto;
}
