import { Request, Response } from 'express';
import * as CajaService from '../services/CajaServices'; 
import { AbrirCajaDatos, CerrarCajaDatos, RegistrarMovimientoCajaDatos, RegistrarVenta } from '../interfaces/CajaInterfaces'; 
import { MovimientoCaja } from '../entities/MovimientoCajas';

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

   static async cerrarCaja(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Solo un Colaborador puede cerrar su propia caja o, potencialmente, un Administrador
      // Para este ejemplo, solo permitimos al 'Colaborador' cerrar cajas.
      // Puedes ajustar esta lógica si otros roles (ej. 'Administrador') también pueden cerrar cajas.
      if (req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de cerrar caja por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los colaboradores pueden cerrar cajas." });
      }

      // 3. Obtener el ID del colaborador del token JWT
      const id_colaborador = req.user.id; // Asumiendo que el ID del usuario es el ID del colaborador

      // 4. Obtener los datos del cuerpo de la solicitud
      const { id_caja, total_final_efectivo, observaciones, id_negocio } = req.body;

      // 5. Validaciones para asegurar que id_caja y total_final_efectivo sean válidos
      if (typeof id_caja !== 'number' || isNaN(id_caja)) {
        return res.status(400).json({ mensaje: "El ID de la caja es obligatorio y debe ser un número válido." });
      }
      if (typeof total_final_efectivo !== 'number' || isNaN(total_final_efectivo) || total_final_efectivo < 0) {
        return res.status(400).json({ mensaje: "El total final de efectivo es obligatorio y debe ser un número positivo." });
      }
      if (typeof id_negocio !== 'number' || isNaN(id_negocio)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número válido." });
      }


      // 6. Preparar los datos para el servicio
      const datosCerrarCaja: CerrarCajaDatos = {
        id_caja: id_caja,
        id_colaborador: id_colaborador,
        id_negocio: id_negocio,
        total_final_efectivo: total_final_efectivo,
        observaciones: observaciones || null, // Las observaciones pueden ser opcionales
      };

      // 7. Llamar al servicio para cerrar la caja
      const cajaCerrada = await CajaService.cerrarCaja(datosCerrarCaja);

      // 8. Enviar la respuesta de éxito
      res.status(200).json({
        mensaje: "Caja cerrada exitosamente.",
        caja: cajaCerrada,
      });

    } catch (error: unknown) {
      console.error("Error en CajaController.cerrarCaja:", error);
      // Puedes refinar los mensajes de error según el tipo de error lanzado por el servicio
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al cerrar la caja." });
    }
  }


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


  static async registrarMovimientoCaja(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Asumiendo que solo los colaboradores pueden registrar movimientos de caja.
      if (req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de registrar movimiento por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los colaboradores pueden registrar movimientos de caja." });
      }

      // 3. Obtener los datos del cuerpo de la solicitud para el movimiento.
      // Se asume que el `req.body` contiene todos los campos necesarios para `RegistrarMovimientoCajaDatos`.
      const datosMovimiento: RegistrarMovimientoCajaDatos = req.body;

      // Opcional: Validaciones adicionales de los datos del cuerpo si no usas DTOs con `class-validator`
      // Por ejemplo, si `datosMovimiento.id_caja` es obligatorio:
      if (typeof datosMovimiento.id_caja !== 'number' || isNaN(datosMovimiento.id_caja)) {
        return res.status(400).json({ mensaje: "El ID de caja es obligatorio y debe ser un número válido para registrar un movimiento." });
      }
      // Aquí puedes añadir más validaciones para `tipo_movimiento`, `monto`, `fecha_hora_movimiento`, etc.

      // 4. Llamar al servicio para registrar el movimiento de caja.
      const nuevoMovimiento: MovimientoCaja = await CajaService.registrarMovimientoCaja(datosMovimiento);

      // 5. Enviar la respuesta de éxito
      res.status(201).json({
        mensaje: "Movimiento de caja registrado exitosamente.",
        movimiento: nuevoMovimiento,
      });

    } catch (error: unknown) {
      console.error("Error en CajaController.registrarMovimientoCaja:", error);
      // Asume que los errores lanzados por el servicio ya son mensajes amigables.
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al registrar el movimiento de caja." });
    }
  }

  static async procesarVenta(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Asumiendo que solo los colaboradores pueden procesar ventas.
      if (req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de procesar venta por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los colaboradores pueden procesar ventas." });
      }

      // 3. Obtener los datos del cuerpo de la solicitud para la venta.
      const datosVenta: RegistrarVenta = req.body;

      // Opcional: Validaciones adicionales de los datos del cuerpo
      if (typeof datosVenta.id_caja !== 'number' || isNaN(datosVenta.id_caja)) {
        return res.status(400).json({ mensaje: "El ID de caja es obligatorio y debe ser un número válido para procesar la venta." });
      }
      if (typeof datosVenta.id_colaborador !== 'number' || isNaN(datosVenta.id_colaborador)) {
        return res.status(400).json({ mensaje: "El ID del colaborador es obligatorio y debe ser un número válido para procesar la venta." });
      }
      if (typeof datosVenta.id_metodo_pago_principal !== 'number' || isNaN(datosVenta.id_metodo_pago_principal)) {
        return res.status(400).json({ mensaje: "El ID del método de pago principal es obligatorio y debe ser un número válido para procesar la venta." });
      }
      if (!datosVenta.items || !Array.isArray(datosVenta.items) || datosVenta.items.length === 0) {
        return res.status(400).json({ mensaje: "La venta debe contener al menos un ítem." });
      }
      for (const item of datosVenta.items) {
        if (typeof item.cantidad !== 'number' || isNaN(item.cantidad) || item.cantidad <= 0) {
          return res.status(400).json({ mensaje: "La cantidad de cada ítem debe ser un número positivo." });
        }
        if (!item.id_producto && !item.id_servicio) {
            return res.status(400).json({ mensaje: "Cada ítem debe tener un 'id_producto' o un 'id_servicio'." });
        }
        if (item.id_producto && item.id_servicio) {
            return res.status(400).json({ mensaje: "Cada ítem no puede ser a la vez un producto y un servicio." });
        }
      }

      // 4. Llamar al servicio para procesar la venta.
      const resultadoVenta = await CajaService.procesarVenta(datosVenta);

      // 5. Enviar la respuesta de éxito
      res.status(201).json({
        mensaje: "Venta procesada y movimiento de caja registrado exitosamente.",
        venta: resultadoVenta.venta,
        movimientoCaja: resultadoVenta.movimientoCaja,
        DocumentoVenta: resultadoVenta.DocumentoVenta
      });

    } catch (error: unknown) {
      console.error("Error en CajaController.procesarVenta:", error);
      // Asume que los errores lanzados por el servicio ya son mensajes amigables.
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al procesar la venta." });
    }
  }

  
}
