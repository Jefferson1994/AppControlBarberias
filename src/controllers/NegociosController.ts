import { Request, Response } from 'express';
import * as NegocioService from '../services/NegocioService'; // ¡Importa el servicio de Negocio!
import { CrearEmpresaDatos } from '../interfaces/crearEmpresaDatos'; 
import * as ColaboradorService from '../services/ColaboradorService';
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



  static async crear(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica si el usuario está autenticado y tiene los datos del token
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de creación de negocio por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden crear negocios." });
      }

      // 3. Tipar el cuerpo de la solicitud directamente con la interfaz
      const datosEmpresa: CrearEmpresaDatos = req.body; 

      // Asignar el id_administrador del usuario autenticado
      datosEmpresa.id_administrador = req.user.id; 

      const nuevaEmpresa = await NegocioService.crearNegocio(datosEmpresa);

      // 4. Envía la respuesta de éxito
      res.status(201).json({
        mensaje: "Empresa creada correctamente.",
        empresa: nuevaEmpresa, // 
      });

    } catch (error: unknown) {
      console.error("Error en NegocioController.crear:", error);
      // Propagar el mensaje de error específico del servicio
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al crear la empresa." });
    }
  }

   static async actualizar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica autenticación y rol
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden actualizar negocios." });
      }

      // 2. Obtener el ID del negocio de los parámetros de la URL
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ mensaje: "ID de negocio inválido." });
      }

      // 3. Obtener los datos a actualizar del cuerpo de la solicitud
      // Usamos Partial para indicar que no todos los campos de CrearEmpresaDatos son obligatorios aquí.
      const datosActualizacion: Partial<CrearEmpresaDatos> = req.body;

      // 4. Llama al servicio para actualizar el negocio
      const negocioActualizado = await NegocioService.actualizarNegocio(id, datosActualizacion);

      // 5. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Empresa actualizada correctamente.",
        empresa: negocioActualizado,
      });

    } catch (error: unknown) {
      console.error("Error en NegocioController.actualizar:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al actualizar la empresa." });
    }
  }

  static async eliminar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica autenticación y rol
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden eliminar negocios." });
      }

      // 2. Obtener el ID del negocio de los parámetros de la URL
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ mensaje: "ID de negocio inválido." });
      }

      // 3. Llama al servicio para realizar la eliminación lógica
      const negocioEliminado = await NegocioService.eliminarLogicoNegocio(id);

      // 4. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Empresa desactivada correctamente.",
        empresa: negocioEliminado, // Devuelve el negocio con el estado 'activo' actualizado
      });

    } catch (error: unknown) {
      console.error("Error en NegocioController.eliminar:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desactivar la empresa." });
    }
  }


  static async agregarColaborador(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación y rol del solicitante
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de agregar colaborador por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden agregar colaboradores." });
      }

      // 2. Obtener los IDs del negocio y del usuario del cuerpo de la solicitud
      const { id_negocio, id_usuario,codigo_punto_emision_movil } = req.body;

      // 3. Validaciones básicas de entrada
      if (typeof id_negocio !== 'number' || isNaN(id_negocio)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número." });
      }
      if (typeof id_usuario !== 'number' || isNaN(id_usuario)) {
        return res.status(400).json({ mensaje: "El ID del usuario (colaborador) es obligatorio y debe ser un número." });
      }
      if (typeof codigo_punto_emision_movil !== 'string' || codigo_punto_emision_movil.trim() === '') {
        return res.status(400).json({ mensaje: "El código de punto de emisión móvil es obligatorio y debe ser una cadena de texto." });
      }

      // 2. Verificar que tenga exactamente 3 caracteres y que todos sean dígitos
      const regexNumeros = /^\d{3}$/; // Expresión regular: ^inicio, \d{3} tres dígitos, $fin

      if (!regexNumeros.test(codigo_punto_emision_movil)) {
        return res.status(400).json({ mensaje: "El código de punto de emisión móvil debe ser una cadena de 3 dígitos numéricos (ej. '001')." });
      }

      // 4. Llamar al servicio para agregar el colaborador
      const nuevoColaborador = await ColaboradorService.agregarColaboradorANegocio(id_negocio, id_usuario,codigo_punto_emision_movil);

      // 5. Enviar respuesta de éxito
      res.status(201).json({
        mensaje: "Colaborador agregado al negocio exitosamente.",
        empleado: nuevoColaborador,
      });

    } catch (error: unknown) {
      console.error("Error en NegocioController.agregarColaborador:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al agregar el colaborador." });
    }
  }

  static async desvincularColaborador(req: CustomRequest, res: Response) {
    console.log("--- Inicio de NegocioController.desvincularColaborador ---");
    try {
      // 1. Verificar autenticación y rol del solicitante
      console.log("Paso 1: Verificando autenticación y rol...");
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      console.log(`Usuario autenticado: ${req.user.correo}, Rol: ${req.user.rolNombre}`);
      if (req.user.rolNombre !== 'Administrador') {
        
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden desvincular colaboradores." });
      }
      console.log("Paso 1 Completo: Autenticación y rol verificados.");
      // 2. Obtener los IDs del negocio y del usuario del cuerpo de la solicitud
      console.log("Paso 2: Obteniendo IDs del cuerpo de la solicitud...");
      const { id_negocio, id_usuario } = req.body;
      // 3. Validaciones básicas de entrada

      if (typeof id_negocio !== 'number' || isNaN(id_negocio)) {

        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número." });
      }
      if (typeof id_usuario !== 'number' || isNaN(id_usuario)) {
        return res.status(400).json({ mensaje: "El ID del usuario (colaborador) es obligatorio y debe ser un número." });
      }
      // 4. Llamar al servicio para desvincular al colaborador
  
      const colaboradorDesvinculado = await ColaboradorService.desvincularColaborador(id_negocio, id_usuario);

      // 5. Enviar respuesta de éxito
     
      res.status(200).json({
        mensaje: "Colaborador desvinculado exitosamente.",
        empleado: colaboradorDesvinculado, // Devolver el registro de empleado actualizado
      });
      console.log("--- Fin de NegocioController.desvincularColaborador (Éxito) ---");

    } catch (error: unknown) {

      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desvincular el colaborador." });

    }
  }

 

}
