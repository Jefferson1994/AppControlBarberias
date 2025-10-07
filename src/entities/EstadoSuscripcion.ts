import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Suscripcion } from './suscripciones'; // Relación de vuelta

@Entity('estados_suscripcion')
export class EstadoSuscripcion {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: false, name: 'nombre_estado' })
    nombreEstado!: string; // Ej: 'ACTIVA', 'VENCIDA', 'PRUEBA'

    @Column({ type: 'text', nullable: true, name: 'descripcion' })
    descripcion!: string | null;

    @Column({ type: 'tinyint', default: 1, nullable: false, name: 'activo' })
    activo!: number;

    // Relación de vuelta: Un estado puede tener muchas suscripciones.
    @OneToMany(() => Suscripcion, suscripcion => suscripcion.estado)
    suscripciones!: Suscripcion[];
}