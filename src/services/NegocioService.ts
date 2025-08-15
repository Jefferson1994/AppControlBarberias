import { AppDataSource } from "../config/data-source";
import { Negocio } from "../entities/Negocio";
import { Usuario } from "../entities/Usuario"; // Necesario para buscar el administrador si es requerido
import { QueryFailedError } from "typeorm";

/**
 * Crea un nuevo negocio en la base de datos.
 *
 * @param datos Objeto con las propiedades del nuevo negocio (nombre, direccion, id_administrador).
 * @returns Una promesa que resuelve al objeto Negocio creado.
 * @throws {Error} Si faltan datos obligatorios, el negocio ya existe, o falla la creación.
 */
export const crearNegocio = async (datos: { nombre: string; direccion?: string; id_administrador: number }): Promise<Negocio> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // Validaciones básicas
      if (!datos.nombre) {
        throw new Error("El nombre del negocio es obligatorio.");
      }
      if (!datos.id_administrador) {
        throw new Error("El ID del administrador es obligatorio.");
      }

      // Opcional: Verificar si el administrador realmente existe en la base de datos.
      // Esto es una buena práctica para asegurar la integridad referencial antes de guardar.
      const administradorExistente = await transactionalEntityManager.findOne(Usuario, {
        where: { id: datos.id_administrador },
      });

      if (!administradorExistente) {
        throw new Error("El administrador especificado no existe.");
      }

      // Opcional: Verificar si ya existe un negocio con el mismo nombre y/o administrador.
      // Puedes ajustar esta lógica de unicidad según tus reglas de negocio (ej. un admin puede tener varios negocios con nombres diferentes).
      const negocioExistente = await transactionalEntityManager.findOne(Negocio, {
        where: { nombre: datos.nombre, id_administrador: datos.id_administrador },
      });

      if (negocioExistente) {
        throw new Error("Ya existe un negocio con este nombre bajo la administración de este usuario.");
      }

      // Crea una nueva instancia de la entidad Negocio con los datos proporcionados
      const nuevoNegocio = transactionalEntityManager.create(Negocio, datos);

      // Guarda el nuevo negocio en la base de datos
      const negocioGuardado = await transactionalEntityManager.save(Negocio, nuevoNegocio);

      return negocioGuardado;
    } catch (error: unknown) {
      console.error("Error detallado en crearNegocio (Servicio):", error);
      if (error instanceof QueryFailedError) {
        const driverErrorCode = (error.driverError as any)?.number;
        // Códigos de error para violación de unicidad en MSSQL (SQL Server) son 2627 o 2601.
        // Puedes añadir lógica más específica si la DB tiene una restricción UNIQUE en 'nombre'
        // que no sea un nombre+administrador combinado.
        if (driverErrorCode === 2627 || driverErrorCode === 2601) {
            throw new Error("Conflicto de datos: Un negocio con propiedades similares ya existe.");
        }
      }
      throw new Error((error as Error).message || "No se pudo crear el negocio. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};
