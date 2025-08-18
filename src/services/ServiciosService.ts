import { AppDataSource } from "../config/data-source";
import { Servicio } from "../entities/Servicio";
import { Negocio } from "../entities/Negocio"; // Importar Negocio para validación
import { TipoServicio } from "../entities/TipoServicio"; // ¡NUEVO: Importar TipoServicio!
import { QueryFailedError } from "typeorm";
import { CrearActualizarServicioDatos } from "../interfaces/servicioDatos"; // Importar la interfaz


export const obtenerTiposServicioActivos = async (): Promise<TipoServicio[]> => {
  try {
    const tipoServicioRepository = AppDataSource.getRepository(TipoServicio);

    // Busca todos los tipos de servicio donde la propiedad 'activo' sea 0
    const tiposServicioActivos = await tipoServicioRepository.find({
      where: { activo: 1 }, 
      order: { nombre: 'ASC' }, 
    });

    return tiposServicioActivos;
  } catch (error: unknown) {
    console.error("Error en TipoServicioService.obtenerTiposServicioActivos:", (error as Error).message);
    // Relanza el error para que el controlador o la capa superior puedan manejarlo
    throw new Error("No se pudieron obtener los tipos de servicio activos. Por favor, inténtalo de nuevo más tarde.");
  }
};

export const crearServicio = async (datos: CrearActualizarServicioDatos): Promise<Servicio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones de campos obligatorios
      if (!datos.nombre) throw new Error("El nombre del servicio es obligatorio.");
      if (datos.precio === undefined || datos.precio === null) {
        throw new Error("El precio del servicio es obligatorio.");
      }
      if (!datos.id_negocio) throw new Error("El ID del negocio al que pertenece el servicio es obligatorio.");
      if (!datos.id_tipo_servicio) throw new Error("El ID del tipo de servicio es obligatorio.");

      // 2. Verificar existencia del negocio
      const negocioExistente = await transactionalEntityManager.findOne(Negocio, {
        where: { id: datos.id_negocio },
      });
      if (!negocioExistente) {
        throw new Error(`Negocio con ID ${datos.id_negocio} no encontrado.`);
      }

      // 3. Verificar existencia del TipoServicio
      const tipoServicioExistente = await transactionalEntityManager.findOne(TipoServicio, {
        where: { id: datos.id_tipo_servicio },
      });
      if (!tipoServicioExistente) {
        throw new Error(`Tipo de servicio con ID ${datos.id_tipo_servicio} no encontrado.`);
      }

      // 4. Preparar datos para la creación, incluyendo los nuevos campos de descuento.
      const serviceDataToCreate: Partial<Servicio> = {
        nombre: datos.nombre,
        precio: datos.precio,
        // Asignar precio_descuento y porcentaje_descuento, si se proporcionan, si no serán null
        precio_descuento: datos.precio_descuento === undefined ? null : datos.precio_descuento,
        porcentaje_descuento: datos.porcentaje_descuento === undefined ? null : datos.porcentaje_descuento,
        id_negocio: datos.id_negocio,
        id_tipo_servicio: datos.id_tipo_servicio,
        descripcion: datos.descripcion === null ? null : datos.descripcion, // Manejar nulos/undefined
        activo: datos.activo === undefined ? 0 : datos.activo, // Por defecto, el servicio se crea como activo (0)
      };

      // 5. Crear la nueva instancia de Servicio
      const nuevoServicio = transactionalEntityManager.create(Servicio, serviceDataToCreate);

      // 6. Guardar el nuevo servicio
      const servicioGuardado = await transactionalEntityManager.save(Servicio, nuevoServicio);

      return servicioGuardado;
    } catch (error: unknown) {
      console.error("Error en ServicioService.crearServicio:", error);
      throw new Error((error as Error).message || "No se pudo crear el servicio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};



export const obtenerServiciosPorNegocio = async (idNegocio: number): Promise<Servicio[]> => {
  try {
    const servicioRepository = AppDataSource.getRepository(Servicio);
    const servicios = await servicioRepository.find({
      where: { id_negocio: idNegocio, activo: 1 }, // Filtrar por negocio Y por activo = 0
      relations: ['tipoServicio'], // ¡NUEVO: Cargar la relación con el tipo de servicio!
      order: { nombre: 'ASC' }, // Ordenar por nombre para mejor visualización
    });
    return servicios;
  } catch (error: unknown) {
    console.error("Error en ServicioService.obtenerServiciosPorNegocio:", (error as Error).message);
    throw new Error("No se pudieron obtener los servicios para este negocio. Por favor, inténtalo de nuevo más tarde.");
  }
};


export const actualizarServicio = async (id: number, datosActualizacion: Partial<CrearActualizarServicioDatos>): Promise<Servicio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Buscar el servicio existente
      const servicioExistente = await transactionalEntityManager.findOne(Servicio, {
        where: { id: id },
      });

      if (!servicioExistente) {
        throw new Error("Servicio no encontrado para la actualización.");
      }

      // 2. Verificar existencia del TipoServicio si se intenta actualizar
      if (datosActualizacion.id_tipo_servicio !== undefined) {
        const tipoServicioExistente = await transactionalEntityManager.findOne(TipoServicio, {
          where: { id: datosActualizacion.id_tipo_servicio },
        });
        if (!tipoServicioExistente) {
          throw new Error(`Tipo de servicio con ID ${datosActualizacion.id_tipo_servicio} no encontrado.`);
        }
      }

      // 3. Fusionar los datos de actualización con el servicio existente,
      // incluyendo los nuevos campos de descuento y manejando los nulls.
      Object.assign(servicioExistente, {
        ...datosActualizacion,
        descripcion: datosActualizacion.descripcion === null ? null : datosActualizacion.descripcion,
        // Manejar explícitamente los campos de descuento para permitir nulls
        precio_descuento: datosActualizacion.precio_descuento === undefined ? servicioExistente.precio_descuento : datosActualizacion.precio_descuento,
        porcentaje_descuento: datosActualizacion.porcentaje_descuento === undefined ? servicioExistente.porcentaje_descuento : datosActualizacion.porcentaje_descuento,
      });

      // 4. Guardar el servicio actualizado
      const servicioActualizado = await transactionalEntityManager.save(Servicio, servicioExistente);

      return servicioActualizado;
    } catch (error: unknown) {
      console.error("Error en ServicioService.actualizarServicio:", error);
      throw new Error((error as Error).message || "No se pudo actualizar el servicio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};


export const eliminarLogicoServicio = async (id: number): Promise<Servicio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      const servicioExistente = await transactionalEntityManager.findOne(Servicio, {
        where: { id: id },
        relations: ['detallesFactura'], // Cargar la relación para verificar si tiene facturas asociadas
      });

      if (!servicioExistente) {
        throw new Error("Servicio no encontrado para la eliminación lógica.");
      }

      // Verificar si el servicio ya está inactivo (activo = 1)
      if (servicioExistente.activo === 0) { // 
        throw new Error("El servicio ya se encuentra inactivo.");
      }

      // Verificar si el servicio ya está en algún detalle de factura
      if (servicioExistente.detallesFactura && servicioExistente.detallesFactura.length > 0) {
        throw new Error("No se puede desactivar el servicio porque está asociado a una o más facturas.");
      }

      
      servicioExistente.activo = 0;

      // Guardar el servicio con el estado actualizado
      const servicioDesactivado = await transactionalEntityManager.save(Servicio, servicioExistente);

      return servicioDesactivado;
    } catch (error: unknown) {
      console.error("Error en ServicioService.eliminarLogicoServicio:", error);
      throw new Error((error as Error).message || "No se pudo desactivar el servicio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};


export const obtenerServicioPorId = async (id: number, idNegocio: number): Promise<Servicio | null> => {
  try {
    const servicioRepository = AppDataSource.getRepository(Servicio);
    const servicio = await servicioRepository.findOne({
      where: {
        id: id,
        id_negocio: idNegocio, 
        activo: 1 
      },
      relations: ['negocio', 'tipoServicio'], // Cargar la relación con el tipo de servicio
    });
    return servicio;
  } catch (error: unknown) {
    console.error("Error en ServicioService.obtenerServicioPorId:", (error as Error).message);
    throw new Error("No se pudo obtener el servicio. Por favor, inténtalo de nuevo más tarde.");
  }
};
