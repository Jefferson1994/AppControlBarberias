import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

import { Usuario } from './Usuario';
import { Colaborador } from './Colaborador';
import { Caja } from './Cajas'; // CORREGIDO: Importación de './Caja' en singular
import { Producto } from './Producto';
import { Servicio } from './Servicio';
import { Factura } from './Facturas';
import { TipoEmpresa } from './TipoEmpresa';
import { DatosContactoEmpresa } from './DatosContactoEmpresa';
import { ImagenEmpresa } from './ImagenEmpresa';
import { Suscripcion } from './suscripciones';
@Entity('empresas') 
export class Negocio {

  @PrimaryGeneratedColumn()
  id!: number;


  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre!: string;

 
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  ruc!: string; 

  @Column({ type: 'varchar', length: 3, nullable: false, default: '001' })
  codigo_establecimiento!: string;

  // Descripción detallada del negocio, sus servicios, historia, etc.
  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;


  @Column({ type: 'tinyint', default: 1, nullable: false })
  activo!: number;


  @Column({ type: 'int', nullable: false })
  id_tipo_empresa!: number;


  @Column({ type: 'int', unique: true, nullable: true })
  id_datos_contacto!: number | null;

  // Dirección física detallada del negocio.
  @Column({ type: 'text', nullable: true })
  direccion!: string | null;

  // Horario de apertura del negocio (ej. "09:00:00"). Sugerencia: obligatorio.
  @Column({ type: 'time', nullable: false })
  horario_apertura!: string; 

  // Horario de cierre del negocio (ej. "18:00:00"). Sugerencia: obligatorio.
  @Column({ type: 'time', nullable: false })
  horario_cierre!: string; 


  @Column({ type: 'int', nullable: false })
  id_administrador!: number;

  //fechas de creacion 

  @CreateDateColumn({ type: 'datetime2', default: () => 'GETDATE()' })
  creado_en!: Date;
  
  @UpdateDateColumn({ type: 'datetime2', nullable: true, name: 'modificado_en' })
  modificadoEn!: Date | null; 

    // 🛑 NUEVO: Columna para registrar el ID del usuario que realizó la última modificación
  @Column({ type: 'int', nullable: true, name: 'modificado_por_usuario_id' })
  modificadoPorUsuarioId!: number | null; 

  

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
  @JoinColumn({ name: 'id_datos_contacto' }) 
  datosContactoEmpresa!: DatosContactoEmpresa | null; 

  // relacion con suscripcion 
  @OneToOne(() => Suscripcion, suscripcion => suscripcion.negocio, {
    cascade: ['insert', 'update'], 
    onDelete: 'CASCADE', 
  })
  suscripcion!: Suscripcion; 

  @OneToMany(() => ImagenEmpresa, (imagen) => imagen.negocio, {
    cascade: true,
  })
  imagenes!: ImagenEmpresa[];

  distancia_km?: number; // Propiedad adicional para almacenar la distancia en kilómetros (no mapeada a la base de datos)

 
}
