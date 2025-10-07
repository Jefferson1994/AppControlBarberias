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
import { EstadoSuscripcion } from './EstadoSuscripcion';

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

    // 2. Relación ManyToOne con TipoPlan (El Catálogo)
    @ManyToOne(() => TipoPlan, tipoPlan => tipoPlan.suscripciones)
    @JoinColumn({ name: 'id_tipo_plan' }) // La FK que apunta al catálogo
    tipoPlan!: TipoPlan;
    
    @Column({ type: 'int', nullable: false, name: 'id_tipo_plan' })
    idTipoPlan!: number; 

    // --- CONTROL DEL ESTADO Y TIEMPO ---
    @ManyToOne(() => EstadoSuscripcion, estado => estado.suscripciones)
    @JoinColumn({ name: 'id_estado_suscripcion' }) 
    estado!: EstadoSuscripcion;
    
    // Columna para acceder al ID sin cargar toda la relación
    @Column({ type: 'tinyint', nullable: false, name: 'id_estado_suscripcion', default:4})
    idEstadoSuscripcion!: number;

    @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()', name: 'fecha_inicio' })
    fechaInicio!: Date;

    @Column({ type: 'datetime2', nullable: true, name: 'fecha_vencimiento' })
    fechaVencimiento!: Date | null;
    
    
    @UpdateDateColumn({ type: 'datetime2', nullable: true, name: 'ultima_modificacion' })
    ultimaModificacion!: Date | null;


    // --- CONTADOR ESPECÍFICO DE ESTA EMPRESA ---
    @Column({ type: 'int', default: 0, nullable: false, name: 'contador_facturas_actual' })
    contadorFacturasActual!: number; 
}