// src/controllers/ReservaController.ts

import { Request, Response } from 'express';
import { ReservaService } from '../services/ReservaServices';
import { CrearReservaDatos } from '../interfaces/ReservaInterfaces';

// Interfaz extendida para Request para incluir la información del usuario del token JWT
interface CustomRequest extends Request {
  user?: {
    id: number;
    correo: string;
    id_rol: number;
    rolNombre: string | null;
  };
}

const reservaService = new ReservaService();


export class ReservaController {

  
    static async crearReservaPendiente(req: CustomRequest, res: Response): Promise<Response> {
        try {
            // 1. Verificar si el usuario está autenticado y tiene los datos del token
            //if (!req.user || !req.user.id) {
            //    return res.status(401).json({ mensaje: "No autorizado." });
            //}
            // 2. Control de Acceso: El cliente es quien crea la reserva.
            // Aquí puedes agregar un chequeo de rol si es necesario, por ejemplo, para asegurar
            // que solo un rol 'Cliente' pueda usar esta ruta, aunque la lógica del token ya lo hace.

            // 3. Extraer los datos de la solicitud
            const { id_colaborador, id_servicio, fecha_hora_inicio } = req.body;
            
            const datosReserva: CrearReservaDatos = {
                id_cliente: 2, // El ID del cliente se toma del token, no del body
                id_colaborador: parseInt(id_colaborador, 10),
                id_servicio: parseInt(id_servicio, 10),
                fecha_hora_inicio: new Date(fecha_hora_inicio),
            };

            // 4. Llamar al servicio de negocio para crear la reserva pendiente
            const nuevaReserva = await reservaService.crearReservaPendiente(datosReserva);

            return res.status(201).json({
                mensaje: "Reserva creada exitosamente en estado Pendiente.",
                reserva: nuevaReserva
            });

        } catch (error: unknown) {
            console.error("Error en ReservaController.crearReservaPendiente:", (error as Error).message);
            return res.status(400).json({
                mensaje: "Error al crear la reserva.",
                error: (error as Error).message,
            });
        }
    }

    static async confirmarReserva(req: CustomRequest, res: Response): Promise<Response> {
        try {
            // El token del usuario que confirma la reserva (podría ser un administrador o un webhook con token especial)
            //if (!req.user || !req.user.id) {
            //    return res.status(401).json({ mensaje: "No autorizado." });
            //}

            // Aquí podrías validar que solo administradores o el sistema de pago pueda hacer esto
            /*if (req.user.rolNombre !== 'Administrador') {
                 console.warn(`Intento de confirmar reserva por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
                 return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores pueden confirmar reservas." });
            }*/

            // El ID de la reserva se obtiene de los parámetros de la URL
            
            const { id_reserva } = req.body;
            console.log("id enviado desde json"+ id_reserva)
            if (!id_reserva) {
                return res.status(400).json({ mensaje: "El ID de la reserva es obligatorio." });
            }

            const reservaConfirmada = await reservaService.confirmarReserva(parseInt(id_reserva, 10));

            return res.status(200).json({
                mensaje: "Reserva confirmada exitosamente.",
                reserva: reservaConfirmada
            });

        } catch (error: unknown) {
            console.error("Error en ReservaController.confirmarReserva:", (error as Error).message);
            return res.status(400).json({
                mensaje: "Error al confirmar la reserva.",
                error: (error as Error).message,
            });
        }
    }

    static async listarReservasPendientes(req: CustomRequest, res: Response): Promise<Response> {
        try {
            // El token del usuario podría ser el de un administrador o del propio colaborador
            /*
            if (!req.user || !req.user.id) {
                return res.status(401).json({ mensaje: "No autorizado." });
            }
            // Aquí podrías validar que solo administradores o colaboradores puedan listar reservas
            if (req.user.rolNombre !== 'Administrador' && req.user.rolNombre !== 'Colaborador') {
                 return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores y colaboradores pueden ver esta información." });
            }
            */

            const { id_colaborador, id_negocio } = req.body; // Se obtienen los IDs de los parámetros de la URL (?id_colaborador=1&id_negocio=2)

            if (!id_colaborador || !id_negocio) {
                return res.status(400).json({ mensaje: "Los IDs de colaborador y negocio son obligatorios." });
            }

            const reservasPendientes = await reservaService.listarReservasPendientesPorColaboradorYNegocio(
                parseInt(id_colaborador as string, 10),
                parseInt(id_negocio as string, 10)
            );

            return res.status(200).json({
                mensaje: "Reservas pendientes listadas exitosamente.",
                reservas: reservasPendientes
            });

        } catch (error: unknown) {
            console.error("Error en ReservaController.listarReservasPendientes:", (error as Error).message);
            return res.status(400).json({
                mensaje: "Error al listar las reservas.",
                error: (error as Error).message,
            });
        }
    }

    static async listarReservasConfirmadas(req: CustomRequest, res: Response): Promise<Response> {
        try {
            // El token del usuario podría ser el de un administrador o del propio colaborador
            /*
            if (!req.user || !req.user.id) {
                return res.status(401).json({ mensaje: "No autorizado." });
            }
            // Aquí podrías validar que solo administradores o colaboradores puedan listar reservas
            if (req.user.rolNombre !== 'Administrador' && req.user.rolNombre !== 'Colaborador') {
                 return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores y colaboradores pueden ver esta información." });
            }
            */

            const { id_colaborador, id_negocio } = req.body; // Se obtienen los IDs de los parámetros de la URL (?id_colaborador=1&id_negocio=2)

            if (!id_colaborador || !id_negocio) {
                return res.status(400).json({ mensaje: "Los IDs de colaborador y negocio son obligatorios." });
            }

            const reservasPendientes = await reservaService.listarReservasConfirmadasPorColaboradorYNegocio(
                parseInt(id_colaborador as string, 10),
                parseInt(id_negocio as string, 10)
            );

            return res.status(200).json({
                mensaje: "Reservas pendientes listadas exitosamente.",
                reservas: reservasPendientes
            });

        } catch (error: unknown) {
            console.error("Error en ReservaController.listarReservasPendientes:", (error as Error).message);
            return res.status(400).json({
                mensaje: "Error al listar las reservas.",
                error: (error as Error).message,
            });
        }
    }
}