// src/entity/ComprobanteCounter.ts (o donde guardes tus entidades)
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("comprobante_counters")
@Index(["codigo_establecimiento", "codigo_punto_emision_movil"], { unique: true }) // Asegura unicidad
export class ComprobanteCounter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 3 })
  codigo_establecimiento!: string; // EEE

  @Column({ type: "varchar", length: 3 })
  codigo_punto_emision_movil!: string; // PPP

  @Column({ type: "int", default: 0 })
  last_sequence_number!: number; // NNNNNNNNN (número que se incrementa)

  // Cambiado a 'datetime2' para compatibilidad con SQL Server
  @CreateDateColumn({ type: "datetime2", default: () => "CURRENT_TIMESTAMP" })
  fecha_creacion!: Date;

  // Cambiado a 'datetime2' para compatibilidad con SQL Server
  @UpdateDateColumn({ type: "datetime2", default: () => "CURRENT_TIMESTAMP" })
  fecha_actualizacion!: Date;
}
