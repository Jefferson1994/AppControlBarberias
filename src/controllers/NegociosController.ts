import { Request, Response } from 'express';
import * as NegocioService from '../services/NegocioService'; // ¡Importa el servicio de Negocio!

// Importa la interfaz CustomRequest para extender el objeto Request de Express
interface CustomRequest extends Request {
  user?: {
    id: number;
    correo: string;
    id_rol: number;
    rolNombre: string | null;
  };
}

export class NegocioController {

  /**
   * Maneja la petición HTTP para crear un nuevo negocio.
   * Extrae los datos del cuerpo de la petición y el ID del administrador del token JWT.
   * Delega la lógica de negocio al NegocioService.
   * @param req El objeto de petición de Express (con información de usuario autenticado).
   * @param res El objeto de respuesta de Express.
   */
    static async crear(req: CustomRequest, res: Response) {
      try {
        // 1. Verifica si el usuario está autenticado y tiene los datos del token
        if (!req.user) {
          return res.status(401).json({ mensaje: "Usuario no autenticado." });
        }

        // 2. Control de Acceso Basado en Rol (RBAC)
        // Solo permite a usuarios con rol 'Administrador' crear negocios.
        // Asegúrate que 'rolNombre' coincida exactamente con el nombre de tu rol en la DB.
        if (req.user.rolNombre !== 'Administrador') {
          console.warn(`Intento de creación de negocio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
          return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden crear negocios." });
        }

        const { nombre, direccion } = req.body;
        const id_administrador = req.user.id; // El administrador es el usuario autenticado del token

        // Validaciones básicas de entrada antes de llamar al servicio
        if (!nombre) {
          return res.status(400).json({ mensaje: "El nombre del negocio es obligatorio." });
        }

        // Llama al servicio para crear el negocio.
        const nuevoNegocio = await NegocioService.crearNegocio({
          nombre,
          direccion,
          id_administrador,
        });

        // Envía la respuesta de éxito
        res.status(201).json({
          mensaje: "Negocio creado correctamente.",
          negocio: nuevoNegocio,
        });

      } catch (error: unknown) {
        console.error("Error en NegocioController.crear:", error);
        res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al crear el negocio." });
      }
    }

  // --- Métodos placeholder para otras operaciones (si los mantienes) ---
  // Estos métodos por ahora solo devuelven un 501 No Implementado.
  // Deberán ser implementados y llamar a su respectivo servicio cuando sea necesario.

  static async obtenerTodos(req: Request, res: Response) {
    res.status(501).json({ mensaje: "Funcionalidad 'obtenerTodos' no implementada aún." });
  }

  static async obtenerPorId(req: Request, res: Response) {
    res.status(501).json({ mensaje: "Funcionalidad 'obtenerPorId' no implementada aún." });
  }

  static async actualizar(req: Request, res: Response) {
    res.status(501).json({ mensaje: "Funcionalidad 'actualizar' no implementada aún." });
  }

  static async eliminar(req: Request, res: Response) {
    res.status(501).json({ mensaje: "Funcionalidad 'eliminar' no implementada aún." });
  }
}
