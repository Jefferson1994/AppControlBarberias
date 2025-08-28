// Importaciones necesarias de TypeORM
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Negocio } from './Negocio'; // Importar Negocio
import { DetalleFactura } from './DetalleFactura'; // Importar DetalleFactura
import { TipoServicio } from './TipoServicio'; // Importar TipoServicio
import { DetalleVenta } from './DetalleVenta';
import { Reserva } from './Reserva';

@Entity('servicios') // Nombre de la tabla en la base de datos
export class Servicio {
  @PrimaryGeneratedColumn()
  id!: number; // ID autoincremental del servicio

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string; // Nombre del servicio (ej. "Corte de Cabello", "Afeitado Clásico")

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null; // Descripción detallada del servicio (corregido a nullable: true)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio!: number; // Precio de venta normal del servicio

  // ¡NUEVO CAMPO!: Precio con descuento
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_descuento!: number | null; // Precio de venta del servicio con descuento

  // ¡NUEVO CAMPO!: Porcentaje de descuento
  @Column({ type: 'int', nullable: true })
  porcentaje_descuento!: number | null; // Porcentaje de descuento (entero, ej. 10 para 10%)

  @Column({ type: 'int', nullable: false }) // id_negocio es obligatorio
  id_negocio!: number; // Clave foránea al negocio al que pertenece el servicio

  @Column({ type: 'int', nullable: false })
  id_tipo_servicio!: number; // Clave foránea al TipoServicio al que pertenece

  @Column({ type: 'int', nullable: false })
  duracion_minutos!: number;

  @Column({ type: 'int', nullable: false, default: 60 }) //
  porcentaje_comision_colaborador!: number;

    // Campo para control de eliminación lógica: 0 = activo (por defecto), 1 = inactivo
  @Column({ type: 'tinyint', default: 0, nullable: false }) // Cambiado a 0 para activo como default
  activo!: number;

  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.servicios)
  @JoinColumn({ name: 'id_negocio' })
  negocio!: Negocio; // Propiedad para acceder al objeto Negocio relacionado

  @OneToMany(() => DetalleFactura, (detalleFactura) => detalleFactura.servicio)
  detallesFactura!: DetalleFactura[]; // Relación inversa a DetalleFactura

  @ManyToOne(() => TipoServicio, (tipoServicio) => tipoServicio.servicios)
  @JoinColumn({ name: 'id_tipo_servicio' })
  tipoServicio!: TipoServicio; // Propiedad para acceder al objeto TipoServicio relacionado
  
  @OneToMany(() => DetalleVenta, (detalleVenta) => detalleVenta.producto)
  detallesVenta!: DetalleVenta[];

  @OneToMany(() => Reserva, (reserva) => reserva.servicio)
  reservas!: Reserva[];
}
