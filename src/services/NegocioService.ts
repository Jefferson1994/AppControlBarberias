import { AppDataSource } from "../config/data-source";
import { Negocio } from "../entities/Negocio";
import { Usuario } from "../entities/Usuario"; // Necesario para buscar el administrador si es requerido
import { QueryFailedError } from "typeorm";
import { CrearEmpresaDatos } from "../interfaces/crearEmpresaDatos";
import { TipoEmpresa } from "../entities/TipoEmpresa"; 
import { DatosContactoEmpresa } from "../entities/DatosContactoEmpresa";
import { Producto } from "../entities/Producto";

/**
 * Crea un nuevo negocio en la base de datos.
 *
 * @param datos Objeto con las propiedades del nuevo negocio (nombre, direccion, id_administrador).
 * @returns Una promesa que resuelve al objeto Negocio creado.
 * @throws {Error} Si faltan datos obligatorios, el negocio ya existe, o falla la creación.
 */
export const crearNegocio = async (datos: CrearEmpresaDatos): Promise<Negocio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones de campos obligatorios para Negocio
      if (!datos.nombre) {
        throw new Error("El nombre de la empresa es obligatorio.");
      }
      if (!datos.ruc) {
        throw new Error("El RUC de la empresa es obligatorio.");
      }
      if (!datos.id_administrador) {
        throw new Error("El ID del administrador es obligatorio.");
      }
      if (!datos.id_tipo_empresa) {
        throw new Error("El ID del tipo de empresa es obligatorio.");
      }
      if (!datos.horario_apertura) {
        throw new Error("El horario de apertura es obligatorio.");
      }
      if (!datos.horario_cierre) {
        throw new Error("El horario de cierre es obligatorio.");
      }

      // 2. Verificar existencia del administrador
      const administradorExistente = await transactionalEntityManager.findOne(Usuario, {
        where: { id: datos.id_administrador },
      });
      if (!administradorExistente) {
        throw new Error("El administrador especificado no existe.");
      }

      // 3. Verificar existencia del TipoEmpresa
      const tipoEmpresaExistente = await transactionalEntityManager.findOne(TipoEmpresa, {
        where: { id: datos.id_tipo_empresa },
      });
      if (!tipoEmpresaExistente) {
        throw new Error("El tipo de empresa especificado no existe.");
      }

      // 4. Verificar unicidad de RUC antes de la creación
      const negocioConMismoRuc = await transactionalEntityManager.findOne(Negocio, {
        where: { ruc: datos.ruc },
      });
      if (negocioConMismoRuc) {
        throw new Error("Ya existe una empresa con este RUC.");
      }

      let datosContactoEmpresaGuardados: DatosContactoEmpresa | null = null;

      // 5. Crear y guardar DatosContactoEmpresa si los datos son proporcionados
      if (datos.datos_contacto && Object.keys(datos.datos_contacto).length > 0) {
        const nuevoDatosContacto = transactionalEntityManager.create(DatosContactoEmpresa, datos.datos_contacto);
        datosContactoEmpresaGuardados = await transactionalEntityManager.save(DatosContactoEmpresa, nuevoDatosContacto);
      }

      // 6. Prepara los datos para la entidad Negocio
      const datosParaNegocio = { ...datos };
      delete datosParaNegocio.datos_contacto;

      // --- DEBUGGING: Añade este console.log para ver los datos antes de crear la entidad Negocio ---
      console.log("DEBUG: datosParaNegocio antes de crear entidad Negocio:", datosParaNegocio);
      // -------------------------------------------------------------------------------------------------

      // Crea una nueva instancia de la entidad Negocio con los datos principales
      const nuevoNegocio = transactionalEntityManager.create(Negocio, datosParaNegocio);

      // 7. Vincular DatosContactoEmpresa si se crearon
      if (datosContactoEmpresaGuardados) {
        nuevoNegocio.id_datos_contacto = datosContactoEmpresaGuardados.id;
        nuevoNegocio.datosContactoEmpresa = datosContactoEmpresaGuardados;
      }

      // 8. Guarda la nueva empresa en la base de datos
      const negocioGuardado = await transactionalEntityManager.save(Negocio, nuevoNegocio);

      return negocioGuardado;
    } catch (error: unknown) {
      console.error("Error detallado en crearNegocio (Servicio):", error);
      if (error instanceof QueryFailedError) {
        const driverErrorCode = (error.driverError as any)?.number;
        const errorMessage = (error as Error).message;

        if (driverErrorCode === 2627 || driverErrorCode === 2601) {
          if (errorMessage.includes('ruc') || errorMessage.includes('unique_ruc_constraint_name_if_exists')) {
            throw new Error("El RUC proporcionado ya está registrado para otra empresa.");
          }
          if (errorMessage.includes('id_datos_contacto')) {
            throw new Error("Ya existe una empresa vinculada a estos datos de contacto.");
          }
          throw new Error("Conflicto de datos: Ya existe una empresa con propiedades similares.");
        }
      }
      throw new Error((error as Error).message || "No se pudo crear la empresa. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};


export const actualizarNegocio = async (id: number, datosActualizacion: Partial<CrearEmpresaDatos>): Promise<Negocio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validar que al menos se proporcionen datos para actualizar
      const hasDirectUpdates = Object.keys(datosActualizacion).filter(key => key !== 'datos_contacto' && key !== 'ruc').length > 0;
      const hasContactUpdates = datosActualizacion.datos_contacto && Object.keys(datosActualizacion.datos_contacto).length > 0;

      if (!hasDirectUpdates && !hasContactUpdates && datosActualizacion.datos_contacto !== null) {
        throw new Error("No se proporcionaron datos válidos para actualizar.");
      }

      // 2. Bloquear la actualización del RUC
      if (datosActualizacion.ruc !== undefined) {
        throw new Error("No está permitido actualizar el RUC de una empresa.");
      }

      // 3. Buscar el negocio existente, incluyendo los datos de contacto si existen
      const negocioExistente = await transactionalEntityManager.findOne(Negocio, {
        where: { id: id },
        relations: ['datosContactoEmpresa'] // Cargar la relación para poder actualizarla
      });

      if (!negocioExistente) {
        throw new Error("Negocio no encontrado para la actualización.");
      }

      // 4. Manejo de actualización del Tipo de Empresa
      if (datosActualizacion.id_tipo_empresa && datosActualizacion.id_tipo_empresa !== negocioExistente.id_tipo_empresa) {
        const tipoEmpresaExistente = await transactionalEntityManager.findOne(TipoEmpresa, {
          where: { id: datosActualizacion.id_tipo_empresa },
        });
        if (!tipoEmpresaExistente) {
          throw new Error("El tipo de empresa especificado no existe.");
        }
      }

      // 5. Manejo de actualización de DatosContactoEmpresa
      if (datosActualizacion.datos_contacto !== undefined) { // Check if 'datos_contacto' property was provided at all
        if (datosActualizacion.datos_contacto === null) {
          // Si el cliente envía 'datos_contacto: null' y ya existe un contacto, desvincular/eliminar
          if (negocioExistente.datosContactoEmpresa) {
            await transactionalEntityManager.remove(DatosContactoEmpresa, negocioExistente.datosContactoEmpresa);
            negocioExistente.id_datos_contacto = null; // Asegura que la FK se pone a NULL
            negocioExistente.datosContactoEmpresa = null; // Asegura que el objeto relacionado se pone a NULL
          }
        } else if (Object.keys(datosActualizacion.datos_contacto).length > 0) {
          // Si hay datos en datos_contacto
          if (negocioExistente.datosContactoEmpresa) {
            // Si ya tiene datos de contacto, actualizarlos
            Object.assign(negocioExistente.datosContactoEmpresa, datosActualizacion.datos_contacto);
            await transactionalEntityManager.save(DatosContactoEmpresa, negocioExistente.datosContactoEmpresa);
          } else {
            // Si no tiene datos de contacto, crear uno nuevo y vincularlo
            const nuevoDatosContacto = transactionalEntityManager.create(DatosContactoEmpresa, datosActualizacion.datos_contacto);
            const datosContactoGuardados = await transactionalEntityManager.save(DatosContactoEmpresa, nuevoDatosContacto);
            negocioExistente.id_datos_contacto = datosContactoGuardados.id;
            negocioExistente.datosContactoEmpresa = datosContactoGuardados;
          }
        } else { // datosActualizacion.datos_contacto es un objeto vacío {}
          console.warn("Se proporcionó un objeto 'datos_contacto' vacío para la actualización. Ignorando.");
        }
      }

      // 6. Fusionar los datos de actualización con el negocio existente (excluyendo 'datos_contacto' y 'ruc')
      const datosPrincipalesParaActualizar: Partial<Negocio> = {};
      for (const key in datosActualizacion) {
        if (key !== 'datos_contacto' && key !== 'ruc' && datosActualizacion.hasOwnProperty(key)) { // Excluir 'ruc' también
          if ((datosActualizacion as any)[key] !== undefined) {
             (datosPrincipalesParaActualizar as any)[key] = (datosActualizacion as any)[key];
          }
        }
      }
      
      Object.assign(negocioExistente, datosPrincipalesParaActualizar);

      // 7. Guardar el negocio actualizado
      const negocioActualizado = await transactionalEntityManager.save(Negocio, negocioExistente);

      return negocioActualizado;
    } catch (error: unknown) {
      console.error("Error detallado en actualizarNegocio (Servicio):", error);
      if (error instanceof QueryFailedError) {
        const driverErrorCode = (error.driverError as any)?.number;
        const errorMessage = (error as Error).message;

        if (driverErrorCode === 2627 || driverErrorCode === 2601) {
          if (errorMessage.includes('ruc')) {
            throw new Error("El RUC proporcionado ya está registrado para otra empresa."); // Aunque no permitimos actualizar, el error de unicidad aún podría ocurrir en otras operaciones si el RUC se intenta manejar incorrectamente.
          }
          if (errorMessage.includes('id_datos_contacto')) {
            throw new Error("Ya existe una empresa vinculada a estos datos de contacto.");
          }
          throw new Error("Conflicto de datos: No se pudo actualizar por datos duplicados.");
        }
      }
      throw new Error((error as Error).message || "No se pudo actualizar el negocio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};


export const eliminarLogicoNegocio = async (id: number): Promise<Negocio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Buscar el negocio existente
      const negocioExistente = await transactionalEntityManager.findOne(Negocio, { where: { id: id } });

      if (!negocioExistente) {
        throw new Error("Negocio no encontrado para la eliminación.");
      }

      // 2. Verificar si el negocio ya está inactivo
      if (negocioExistente.activo === 1) { // activo = 1 es inactivo
        throw new Error("El negocio ya se encuentra inactivo.");
      }

      // 3. Cambiar el estado 'activo' a 1 (inactivo)
      negocioExistente.activo = 1;

      // 4. Guardar el negocio con el estado actualizado
      const negocioDesactivado = await transactionalEntityManager.save(Negocio, negocioExistente);

      return negocioDesactivado;
    } catch (error: unknown) {
      console.error("Error detallado en eliminarLogicoNegocio (Servicio):", error);
      throw new Error((error as Error).message || "No se pudo eliminar el negocio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};

export const obtenerProductosPorNegocio = async (idNegocio: number): Promise<Producto[]> => {
  try {
    const productoRepository = AppDataSource.getRepository(Producto);
    const productos = await productoRepository.find({
      where: { id_negocio: idNegocio, activo: 1 }, 
      relations: ['tipoProducto'], 
      order: { nombre: 'ASC' }, 
    });
    return productos;
  } catch (error: unknown) {
    console.error("Error en ProductoService.obtenerProductosPorNegocio:", (error as Error).message);
    throw new Error("No se pudieron obtener los productos para este negocio. Por favor, inténtalo de nuevo más tarde.");
  }
};

export const obtenerProductoPorId = async (id: number, idNegocio: number): Promise<Producto | null> => {
  try {
    const productoRepository = AppDataSource.getRepository(Producto);
    const producto = await productoRepository.findOne({
      where: {
        id: id,
        id_negocio: idNegocio, // ¡FILTRO AÑADIDO!: Filtrar por el ID del negocio
      },
      relations: ['negocio', 'tipoProducto'], // Cargar las relaciones con el negocio y tipo de producto
    });
    return producto;
  } catch (error: unknown) {
    console.error("Error en ProductoService.obtenerProductoPorId:", (error as Error).message);
    throw new Error("No se pudo obtener el producto para el negocio especificado. Por favor, inténtalo de nuevo más tarde.");
  }
};


export const obtenerEmpresasPorAdmin = async (idAdmin: number): Promise<Negocio[]> => {
    // 1. Validar la entrada. El ID del administrador debe ser un número válido.
    if (!idAdmin || typeof idAdmin !== 'number' || idAdmin <= 0) {
        throw new Error("ID de administrador no válido. Por favor, proporcione un número positivo.");
    }


    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
        try {
            const administradorExistente = await transactionalEntityManager.findOne(Usuario, {
                where: { id: idAdmin },
            });
            if (!administradorExistente) {
                throw new Error("El administrador especificado no existe.");
            }

            // 4. Construir y ejecutar la consulta.
            const empresas = await transactionalEntityManager.find(Negocio, {
                where: {
                    id_administrador: idAdmin,
                    activo: 1, 
                },
                relations: [
                    'datosContactoEmpresa', 
                    'tipoEmpresa'
                ],
            });

            // 5. Verificar si se encontraron empresas.
            if (empresas.length === 0) {
                // En lugar de un error, es mejor devolver un array vacío o un mensaje descriptivo
                // si no se encuentran empresas. Un error se usa para fallos inesperados.
                console.log(`No se encontraron empresas activas para el administrador con ID ${idAdmin}.`);
                return [];
            }

            return empresas;
        } catch (error) {
            console.error("Error detallado en obtenerEmpresasPorAdmin (Servicio):", error);
            
            // 7. Lanzar un error más amigable para el cliente.
            if (error instanceof QueryFailedError) {
                throw new Error("No se pudieron obtener las empresas. Error en la consulta a la base de datos.");
            }
            throw new Error((error as Error).message || "No se pudo obtener la lista de empresas. Por favor, inténtalo de nuevo más tarde.");
        }
    });
};