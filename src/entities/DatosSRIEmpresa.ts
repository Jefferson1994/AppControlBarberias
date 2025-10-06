import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Negocio } from "./Negocio";

@Entity('datos_sri_empresa')
export class DatosSRIEmpresa {
    @PrimaryGeneratedColumn()
    id!: number;
    
    // Clave de búsqueda y coherencia
    @Column({ type: 'varchar', length: 20, unique: true, nullable: false, name: 'ruc' })
    ruc!: string;
    
    // Relación de vuelta a Negocio (donde está la FK) descomentar 
    //@OneToOne(() => Negocio, (negocio) => negocio.datosSri)
    //negocio!: Negocio;

    // --- DATOS PRINCIPALES ---
    @Column({ type: 'varchar', length: 255, nullable: false, name: 'razon_social' })
    razonSocial!: string; // Data: razonSocial

    @Column({ type: 'varchar', length: 50, nullable: false, name: 'estado_contribuyente' })
    estadoContribuyente!: string; // Data: estadoContribuyenteRuc

    @Column({ type: 'varchar', length: 50, nullable: false, name: 'tipo_contribuyente' })
    tipoContribuyente!: string; // Data: tipoContribuyente

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'regimen_tributario' })
    regimenTributario!: string | null; // Data: regimen

    @Column({ type: 'text', nullable: true, name: 'actividad_principal' })
    actividadPrincipal!: string | null; // Data: actividadEconomicaPrincipal

    @Column({ type: 'tinyint', default: 0, nullable: false, name: 'lleva_contabilidad' })
    llevaContabilidad!: number; // Mapea "NO" -> 0, "SI" -> 1. Data: obligadoLlevarContabilidad

    @Column({ type: 'tinyint', default: 0, nullable: false, name: 'agente_retencion' })
    agenteRetencion!: number; // Mapea "NO" -> 0, "SI" -> 1. Data: agenteRetencion
    
    @Column({ type: 'varchar', length: 50, nullable: true, name: 'contribuyente_especial' })
    contribuyenteEspecial!: string | null; // Data: contribuyenteEspecial

    // --- DATOS DE FECHAS ---
    @Column({ type: 'datetime2', nullable: true, name: 'fecha_inicio_act' })
    fechaInicioActividades!: Date | null; // Data: informacionFechasContribuyente.fechaInicioActividades
    
    @Column({ type: 'datetime2', nullable: true, name: 'fecha_cese' })
    fechaCese!: Date | null; // Data: informacionFechasContribuyente.fechaCese

    @Column({ type: 'datetime2', nullable: true, name: 'fecha_reinicio_act' })
    fechaReinicioActividades!: Date | null; // Data: informacionFechasContribuyente.fechaReinicioActividades

    @Column({ type: 'datetime2', nullable: true, name: 'fecha_actualizacion_sri' })
    fechaActualizacionSRI!: Date | null; // Data: informacionFechasContribuyente.fechaActualizacion

    // --- OTROS DATOS DE CONTROL ---
    @Column({ type: 'tinyint', default: 0, nullable: false, name: 'contribuyente_fantasma' })
    contribuyenteFantasma!: number; // Data: contribuyenteFantasma
    
    @Column({ type: 'tinyint', default: 0, nullable: false, name: 'transacciones_inexistente' })
    transaccionesInexistente!: number; // Data: transaccionesInexistente
}