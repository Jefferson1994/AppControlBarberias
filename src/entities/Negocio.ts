import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';

import { Usuario } from './Usuario';
import { Colaborador } from './Colaborador';
import { Caja } from './Cajas'; // CORREGIDO: Importación de './Caja' en singular
import { Producto } from './Producto';
import { Servicio } from './Servicio';
import { Factura } from './Facturas';
import { TipoEmpresa } from './TipoEmpresa';
import { DatosContactoEmpresa } from './DatosContactoEmpresa';

/**
 * Entidad Negocio: Representa una empresa (barbería, salón de belleza, etc.) gestionada en el sistema.
 * Contiene propiedades principales del negocio y sus relaciones con otras entidades.
 */
@Entity('empresas') // Nombre de la tabla en la base de datos
export class Negocio {
  // Clave primaria autoincremental para identificar de forma única cada negocio.
  @PrimaryGeneratedColumn()
  id!: number;

  // Nombre de la empresa. Es un campo obligatorio y tiene una longitud máxima.
  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

  // Número de Registro Único de Contribuyentes (RUC) o identificación fiscal de la empresa.
  // Es OBLIGATORIO (`nullable: false`) y debe ser único.
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  ruc!: string; // Sugerencia: `string` y `nullable: false` si es obligatorio.

  // Descripción detallada del negocio, sus servicios, historia, etc.
  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  // Estado de actividad del negocio: 1 para activo, 0 para inactivo.
  // Es un campo obligatorio y por defecto es 1 (activo).
  @Column({ type: 'tinyint', default: 1, nullable: false })
  activo!: number;

  // Clave foránea que enlaza el negocio con su TipoEmpresa (ej. Barbería, Spa).
  // Es un campo obligatorio.
  @Column({ type: 'int', nullable: false })
  id_tipo_empresa!: number;

  // CLAVE FORÁNEA para DatosContactoEmpresa.
  // Almacenará el ID del registro en la tabla 'datos_contacto_empresa'.
  // Es `unique: true` para asegurar la relación uno a uno.
  // Es `nullable: true` porque un Negocio podría no tener datos de contacto al inicio.
  @Column({ type: 'int', unique: true, nullable: true })
  id_datos_contacto!: number | null;

  // Dirección física detallada del negocio.
  @Column({ type: 'text', nullable: true })
  direccion!: string | null;

  // Horario de apertura del negocio (ej. "09:00:00"). Sugerencia: obligatorio.
  @Column({ type: 'time', nullable: false })
  horario_apertura!: string; // Sugerencia: `string` y `nullable: false` si es obligatorio.

  // Horario de cierre del negocio (ej. "18:00:00"). Sugerencia: obligatorio.
  @Column({ type: 'time', nullable: false })
  horario_cierre!: string; // Sugerencia: `string` y `nullable: false` si es obligatorio.

  // Clave foránea que enlaza el negocio con el Usuario que lo administra.
  // Es un campo obligatorio.
  @Column({ type: 'int', nullable: false })
  id_administrador!: number;

  // Fecha y hora en que se creó el registro del negocio.
  // Se autogenera con la fecha y hora actual al insertar.
  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' })
  creado_en!: Date;

  // --- Definición de Relaciones entre Entidades ---

  // Relación ManyToOne (muchos-a-uno) con Usuario:
  // Muchos negocios pueden ser administrados por un único Usuario.
  @ManyToOne(() => Usuario, (usuario) => usuario.negociosAdministrados)
  @JoinColumn({ name: 'id_administrador' }) // Define que 'id_administrador' es la columna FK en esta tabla
  administrador!: Usuario; // Propiedad que contendrá el objeto Usuario relacionado

  // Relación ManyToOne (muchos-a-uno) con TipoEmpresa:
  // Muchos negocios pueden ser de un único TipoEmpresa.
  @ManyToOne(() => TipoEmpresa, (tipoEmpresa) => tipoEmpresa.negocios)
  @JoinColumn({ name: 'id_tipo_empresa' })
  tipoEmpresa!: TipoEmpresa;

  // Relación OneToMany (uno-a-muchos) con Colaborador:
  // Un negocio puede tener muchos Colaboradors asociados.
  @OneToMany(() => Colaborador, (Colaborador) => Colaborador.negocio)
  Colaboradors!: Colaborador[];

  // Relación OneToMany (uno-a-muchos) con Caja:
  // Un negocio puede tener muchas Cajas (puntos de venta o turnos de caja).
  @OneToMany(() => Caja, (caja) => caja.negocio)
  cajas!: Caja[];

  // Relación OneToMany (uno-a-muchos) con Producto:
  // Un negocio puede vender muchos Productos.
  @OneToMany(() => Producto, (producto) => producto.negocio)
  productos!: Producto[];

  // Relación OneToMany (uno-a-muchos) con Servicio:
  // Un negocio puede ofrecer muchos Servicios.
  @OneToMany(() => Servicio, (servicio) => servicio.negocio)
  servicios!: Servicio[];

  // Relación OneToMany (uno-a-muchos) con Factura:
  // Un negocio puede emitir muchas Facturas.
  @OneToMany(() => Factura, (factura) => factura.negocio)
  facturas!: Factura[];

  // Relación OneToOne con DatosContactoEmpresa: Un Negocio tiene un único conjunto de DatosContactoEmpresa.
  // La clave foránea estará en la tabla Negocio.
  @OneToOne(() => DatosContactoEmpresa, (datosContactoEmpresa) => datosContactoEmpresa.negocio, {
    cascade: true, // `cascade: true` permite que las operaciones de guardar/actualizar/eliminar            // en Negocio también se apliquen a su DatosContactoEmpresa asociado.
    onDelete: 'SET NULL', // Si el registro de DatosContactoEmpresa se elimina, el `id_datos_contacto`                  // en esta tabla se establecerá a NULL (requiere que la FK sea nullable).
  })
  @JoinColumn({ name: 'id_datos_contacto' }) // Define que 'id_datos_contacto' es la columna de clave foránea en la tabla 'negocios'.
  datosContactoEmpresa!: DatosContactoEmpresa | null; // Propiedad que contendrá el objeto DatosContactoEmpresa, o null.
}
