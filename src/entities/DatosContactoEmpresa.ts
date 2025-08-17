import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne, // Necesario para la relación OneToOne con Negocio
} from 'typeorm';

import { Negocio } from './Negocio'; // Importar la entidad Negocio para la relación inversa


@Entity('datos_contacto_empresa') 
export class DatosContactoEmpresa {
  @PrimaryGeneratedColumn()
  id!: number; // ID autoincremental de los datos de contacto

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono_contacto!: string | null; // Número de teléfono de contacto principal

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_contacto!: string | null; // Correo electrónico de contacto principal

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad!: string | null; // Ciudad de ubicación de la empresa

  @Column({ type: 'varchar', length: 100, nullable: true })
  provincia!: string | null; // Provincia o estado de ubicación

  @Column({ type: 'varchar', length: 100, nullable: true })
  pais!: string | null; // País de ubicación

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitud!: number | null; // Coordenada de latitud para geolocalización

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitud!: number | null; // Coordenada de longitud para geolocalización

  // Relación OneToOne con Negocio: Un DatosContactoEmpresa está asociado a un único Negocio.
  // La clave foránea estará en la tabla Negocio.
  @OneToOne(() => Negocio, (negocio) => negocio.datosContactoEmpresa)
  negocio!: Negocio;
}
