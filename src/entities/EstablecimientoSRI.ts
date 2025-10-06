import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Negocio } from "./Negocio";

@Entity('establecimientos_sri')
export class EstablecimientoSRI {
    @PrimaryGeneratedColumn()
    id!: number;
    
    // Clave foránea al Negocio principal
    @Column({ type: 'int', nullable: false, name: 'id_negocio' })
    idNegocio!: number;

    /*@ManyToOne(() => Negocio, (negocio) => negocio.establecimientos)
    @JoinColumn({ name: 'id_negocio' })
    negocio!: Negocio;*/

    // --- DATOS DEL ESTABLECIMIENTO ---
    
    @Column({ type: 'varchar', length: 255, nullable: true, name: 'nombre_fantasia' })
    nombreFantasiaComercial!: string | null; // Data: nombreFantasiaComercial

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'tipo_establecimiento' })
    tipoEstablecimiento!: string | null; // Data: tipoEstablecimiento (MAT)

    @Column({ type: 'text', nullable: false, name: 'direccion_completa' })
    direccionCompleta!: string; // Data: direccionCompleta (CRÍTICO para facturación)

    @Column({ type: 'varchar', length: 50, nullable: false, name: 'estado_establecimiento' })
    estadoEstablecimiento!: string; // Data: estado (ABIERTO/CERRADO)

    @Column({ type: 'varchar', length: 3, nullable: false, name: 'numero_establecimiento', unique: true })
    numeroEstablecimiento!: string; // Data: numeroEstablecimiento (001)
    
    @Column({ type: 'tinyint', default: 0, nullable: false, name: 'es_matriz' })
    esMatriz!: number; // Mapea "SI" -> 1 y "NO" -> 0. Data: matriz
}