import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Suscripcion } from './suscripciones'; // Relación de vuelta

@Entity('tipos_plan')
export class TipoPlan {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: false, name: 'nombre_interno' })
    nombreInterno!: string; 

    @Column({ type: 'varchar', length: 100, nullable: false, name: 'nombre_publico' })
    nombrePublico!: string; 

    @Column({ type: 'text', nullable: true, name: 'descripcion' })
    descripcion!: string | null;


    @Column({ type: 'int', default: 0, nullable: false, name: 'limite_facturas' })
    limiteFacturas!: number; 
    

    @Column({ type: 'int', default: 1, nullable: false, name: 'duracion_meses' })
    duracionMeses!: number; 
    
    @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.00, nullable: false, name: 'costo' })
    costo!: number;

    @Column({ type: 'tinyint', default: 1, nullable: false, name: 'activo' })
    activo!: number;

    @OneToMany(() => Suscripcion, suscripcion => suscripcion.tipoPlan)
    suscripciones!: Suscripcion[];
}