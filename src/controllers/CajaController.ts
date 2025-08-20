import { Request, Response } from 'express';
import * as CajaService from '../services/CajaServices'; 
import { AbrirCajaDatos } from '../interfaces/CajaInterfaces'; 

interface CustomRequest extends Request {
  user?: {
    id: number; // ID del usuario autenticado (que será el colaborador)
    correo: string;
    id_rol: number;
    rolNombre: string | null; // Nombre del rol del usuario (ej. 'Colaborador')
  };
}

export class CajaController {

 
  static async abrirCaja(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      
      if (req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de abrir caja por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los colaboradores pueden abrir cajas." });
      }

      // 3. Obtener el ID del colaborador del token JWT (fuente segura)
      const id_colaborador = req.user.id; // Asumiendo que el ID del usuario es el ID del colaborador

      // 4. Obtener el ID del negocio y otros datos del cuerpo de la solicitud
      const { id_negocio, total_inicial_efectivo, observaciones } = req.body;

      // 5. Validaciones para asegurar que id_negocio sea un número válido.
      if (typeof id_negocio !== 'number' || isNaN(id_negocio)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número válido." });
      }

      // 6. Preparar los datos para el servicio
      const datosAbrirCaja: AbrirCajaDatos = {
        id_colaborador: id_colaborador,
        id_negocio: id_negocio,
        total_inicial_efectivo: total_inicial_efectivo,
        observaciones: observaciones,
      };

      // 7. Llamar al servicio para abrir la caja
      const nuevaCaja = await CajaService.abrirCaja(datosAbrirCaja);

      // 8. Enviar la respuesta de éxito
      res.status(201).json({
        mensaje: "Caja abierta exitosamente.",
        caja: nuevaCaja,
      });

    } catch (error: unknown) {
      console.error("Error en CajaController.abrirCaja:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al abrir la caja." });
    }
  }

  /**
   * Maneja la petición GET para obtener la caja activa de un colaborador para un negocio específico.
   * Requiere autenticación JWT y que el usuario sea un 'Colaborador'.
   * El ID del negocio se espera en los parámetros de la URL.
   *
   * @param req Objeto de petición de Express, extendido con datos de usuario del JWT.
   * @param res Objeto de respuesta de Express.
   */
  static async obtenerCajaActiva(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Solo permite a usuarios con rol 'Colaborador' consultar sus cajas.
      if (req.user.rolNombre !== 'Colaborador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los colaboradores pueden consultar sus cajas." });
      }

      // 3. Obtener el ID del colaborador del token JWT.
      const id_colaborador = req.user.id;
      // 4. Obtener el ID del negocio de los parámetros de la URL
      const id_negocio = parseInt(req.params.id_negocio, 10);

      // 5. Validar el ID del negocio
      if (isNaN(id_negocio)) {
        return res.status(400).json({ mensaje: "ID de negocio inválido en la URL." });
      }

      // 6. Llamar al servicio para obtener la caja activa
      const cajaActiva = await CajaService.obtenerCajaActivaPorColaboradorYNegocio(id_colaborador, id_negocio);

      // 7. Enviar la respuesta
      if (!cajaActiva) {
        return res.status(404).json({ mensaje: "No se encontró una caja activa para este colaborador en este negocio." });
      }

      res.status(200).json({
        mensaje: "Caja activa obtenida exitosamente.",
        caja: cajaActiva,
      });

    } catch (error: unknown) {
      console.error("Error en CajaController.obtenerCajaActiva:", error);
      res.status(500).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener la caja activa." });
    }
  }
}
