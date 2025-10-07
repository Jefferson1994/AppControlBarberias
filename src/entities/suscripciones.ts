import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    ManyToOne, // 🛑 CAMBIO: Ahora es ManyToOne con TipoPlan
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Negocio } from './Negocio';
import { TipoPlan } from './tipoPlan'; 

@Entity('suscripciones')
export class Suscripcion {

    @PrimaryGeneratedColumn()
    id!: number;

    // --- RELACIONES ---

    @OneToOne(() => Negocio, negocio => negocio.suscripcion)

    @JoinColumn({ name: 'id_negocio' })
    negocio!: Negocio;
    
    @Column({ type: 'int', unique: true, nullable: false, name: 'id_negocio' })
    idNegocio!: number;

    // 🛑 2. Relación ManyToOne con TipoPlan (El Catálogo)
    @ManyToOne(() => TipoPlan, tipoPlan => tipoPlan.suscripciones)
    @JoinColumn({ name: 'id_tipo_plan' }) // La FK que apunta al catálogo
    tipoPlan!: TipoPlan;
    
    @Column({ type: 'int', nullable: false, name: 'id_tipo_plan' })
    idTipoPlan!: number; 


    // --- CONTROL DEL ESTADO Y TIEMPO ---
    
    @Column({ type: 'tinyint', default: 4, nullable: false, name: 'estado_suscripcion' })
    estadoSuscripcion!: number; // 1=ACTIVO, 2=VENCIDO, 3=CANCELADO, 4=PRUEBA

    @Column({ type: 'datetime2', nullable: true, name: 'fecha_vencimiento' })
    fechaVencimiento!: Date | null;
    
    @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()', name: 'fecha_inicio' })
    fechaInicio!: Date;
    
    @UpdateDateColumn({ type: 'datetime2', nullable: true, name: 'ultima_modificacion' })
    ultimaModificacion!: Date | null;


    // --- CONTADOR ESPECÍFICO DE ESTA EMPRESA ---
    
    // 🛑 Solo necesitamos el contador actual. El LÍMITE viene de TipoPlan.
    @Column({ type: 'int', default: 0, nullable: false, name: 'contador_facturas_actual' })
    contadorFacturasActual!: number; 
}