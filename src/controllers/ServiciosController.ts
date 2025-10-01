import { Request, Response } from 'express';
// Importa todas las funciones del servicio de Servicio
import {
  crearServicio,
  obtenerServiciosPorNegocio,
  actualizarServicio,
  eliminarLogicoServicio,
  obtenerServicioPorId
} from '../services/ServiciosService';
// Importa la función para obtener tipos de servicio activos
import { obtenerTiposServicioActivos } from '../services/ServiciosService'; // ¡NUEVO: Importar TipoServicioService!

import { CrearActualizarServicioDatos } from '../interfaces/servicioDatos';
import { Servicio } from '../entities/Servicio'; // Importa la entidad Servicio

// Interfaz extendida para Request para incluir la información del usuario del token JWT
interface CustomRequest extends Request {
  user?: {
    id: number;
    correo: string;
    id_rol: number;
    rolNombre: string | null;
  };
}

/**
 * Controlador para manejar las operaciones relacionadas con la entidad Servicio.
 */
export class ServicioController {

  
  static async obtenerTiposActivos(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica si el usuario está autenticado y tiene los datos del token
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Solo permite a usuarios con rol 'Administrador' ver los tipos de servicio.
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de acceso a tipos de servicio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden ver los tipos de servicio." });
      }

      const { id_empresa } = req.body;
      console.log("ID Empresa recibido en el cuerpo:", id_empresa);

      // Llama al servicio para obtener los tipos de servicio activos.
      const tiposServicio = await obtenerTiposServicioActivos(id_empresa);

      // Si la operación es exitosa, devuelve la lista de tipos de servicio activos.
      res.status(200).json(tiposServicio);
    } catch (error: unknown) {
      // Captura y registra cualquier error que ocurra en el servicio o durante la petición.
      console.error("Error en ServicioController.obtenerTiposActivos:", (error as Error).message);
      // Devuelve una respuesta de error al cliente.
      res.status(500).json({
        mensaje: "Error interno del servidor al obtener tipos de servicio activos.",
        error: (error as Error).message,
      });
    }
  }

  static async crear(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica si el usuario está autenticado y tiene los datos del token
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Solo permite a usuarios con rol 'Administrador' crear servicios.
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de creación de servicio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden crear servicios." });
      }

      // 3. Tipar el cuerpo de la solicitud directamente con la interfaz
      const datosServicio: CrearActualizarServicioDatos = req.body;

      // 4. Llama al servicio para crear el servicio.
      const nuevoServicio = await crearServicio(datosServicio);

      // 5. Envía la respuesta de éxito
      res.status(201).json({
        mensaje: "Servicio creado correctamente.",
        servicio: nuevoServicio,
      });

    } catch (error: unknown) {
      console.error("Error en ServicioController.crear:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al crear el servicio." });
    }
  }

  
  static async actualizar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica autenticación y rol
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden actualizar servicios." });
      }

      // 2. Obtener el ID del servicio DEL CUERPO de la solicitud
      const { id } = req.body; // Extrae el 'id' del cuerpo
      const idServicio = parseInt(id, 10); // Convierte el ID a número

      if (isNaN(idServicio)) {
        return res.status(400).json({ mensaje: "ID de servicio inválido en el cuerpo de la solicitud." });
      }

      // 3. Obtener los datos a actualizar del cuerpo de la solicitud
      // Usamos la desestructuración para separar el 'id' del resto de los datos.
      const { id: _, ...datosActualizacion } = req.body;
      
      // 4. Llama al servicio para actualizar el servicio
      const servicioActualizado = await actualizarServicio(idServicio, datosActualizacion);

      // 5. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Servicio actualizado correctamente.",
        servicio: servicioActualizado,
      });

    } catch (error: unknown) {
      console.error("Error en ServicioController.actualizar:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al actualizar el servicio." });
    }
  }

 
  static async eliminar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica autenticación y rol
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de eliminar (lógico) servicio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden desactivar servicios." });
      }

      // 2. Obtener el ID del servicio del CUERPO de la solicitud
      const { id } = req.body;

      const idServicio = parseInt(id, 10);
      if (isNaN(idServicio)) {
        return res.status(400).json({ mensaje: "ID de servicio inválido en el cuerpo de la solicitud." });
      }

      // 3. Llama al servicio para realizar la eliminación lógica (desactivación)
      const servicioDesactivado = await eliminarLogicoServicio(idServicio);

      // 4. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Servicio desactivado correctamente.",
        servicio: servicioDesactivado,
      });

    } catch (error: unknown) {
      console.error("Error en ServicioController.eliminar (lógica):", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desactivar el servicio." });
    }
  }

  
  static async obtenerServiciosPorEmpresa(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación y rol del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      // Permitir acceso a Administradores y Colaboradores
      if (req.user.rolNombre !== 'Administrador' && req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de obtener servicios por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores y colaboradores pueden ver servicios." });
      }

      // 2. Obtener el ID del negocio del cuerpo de la solicitud
      const { id_empresa } = req.body;

      if (typeof id_empresa !== 'number' || isNaN(id_empresa)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número válido en el cuerpo de la solicitud." });
      }

      // 3. Llama al servicio para obtener los servicios del negocio
      const servicios = await obtenerServiciosPorNegocio(id_empresa);

      // 4. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: `Servicios obtenidos correctamente para el negocio ID ${id_empresa}.`,
        servicios: servicios,
      });

    } catch (error: unknown) {
      console.error("Error en ServicioController.obtenerServiciosPorEmpresa:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener los servicios." });
    }
  }

  static async obtenerPorIdYNegocio(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación y rol del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      // Permitir acceso a Administradores y Colaboradores
      if (req.user.rolNombre !== 'Administrador' && req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de obtener servicio por ID y negocio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores y colaboradores pueden ver servicios de negocio." });
      }

      // 2. Obtener el ID del servicio y el ID del negocio del CUERPO de la solicitud
      const { id, id_empresa } = req.body;

      if (typeof id !== 'number' || isNaN(id)) {
        return res.status(400).json({ mensaje: "El ID del servicio es obligatorio y debe ser un número válido." });
      }
      if (typeof id_empresa !== 'number' || isNaN(id_empresa)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número válido." });
      }

      // 3. Llama al servicio para obtener el servicio
      // Ahora obtenerServicioPorId en el servicio espera ambos IDs.
      const servicio = await obtenerServicioPorId(id, id_empresa);

      // 4. Envía la respuesta
      if (servicio) {
        res.status(200).json({
          mensaje: `Servicio ID ${id} encontrado para el negocio ID ${id_empresa}.`,
          servicio: servicio,
        });
      } else {
        res.status(404).json({
          mensaje: `Servicio ID ${id} no encontrado o no pertenece al negocio ID ${id_empresa}.`
        });
      }

    } catch (error: unknown) {
      console.error("Error en ServicioController.obtenerPorIdYNegocio:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener el servicio." });
    }
  }
}
