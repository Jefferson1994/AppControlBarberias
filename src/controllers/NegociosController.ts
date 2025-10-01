import { Request, Response } from 'express';
import * as NegocioService from '../services/NegocioService'; // ¡Importa el servicio de Negocio!
import { CrearEmpresaDatos } from '../interfaces/crearEmpresaDatos'; 
import * as ColaboradorService from '../services/ColaboradorService';
// Importa la interfaz CustomRequest para extender el objeto Request de Express
interface CustomRequest extends Request  {
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
      // --- 1. Verificaciones de Usuario y Rol (Se mantienen igual) ---
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden crear negocios." });
      }

      // --- 2. Recolección de Datos Adaptada ---
      const datosDelBody = req.body;
      const archivosImagenes = req.files as Express.Multer.File[]; // Los archivos ahora vienen en req.files (plural)

      // --- 3. Parseo de 'datos_contacto' ---
      // Como 'datos_contacto' viene como un string JSON desde el FormData, necesitamos parsearlo.
      if (!datosDelBody.datos_contacto) {
        throw new Error("Los datos de contacto son obligatorios.");
      }
      const datosContactoParseados = JSON.parse(datosDelBody.datos_contacto);
      
      const datosParaServicio: CrearEmpresaDatos = {
        // Campos de texto directos del body
        nombre: datosDelBody.nombre,
        ruc: datosDelBody.ruc,
        descripcion: datosDelBody.descripcion,
        direccion: datosDelBody.direccion,
        horario_apertura: datosDelBody.horario_apertura,
        horario_cierre: datosDelBody.horario_cierre,

        // Campos que necesitan conversión o vienen del token
        id_administrador: req.user.id,
        id_tipo_empresa: parseInt(datosDelBody.id_tipo_empresa, 10),
        
        // Objeto anidado que ya fue parseado
        datos_contacto: {
          telefono_contacto: datosContactoParseados.telefono_contacto,
          email_contacto: datosContactoParseados.email_contacto,
          ciudad: datosContactoParseados.ciudad,
          provincia: datosContactoParseados.provincia,
          pais: datosContactoParseados.pais,
          latitud: parseFloat(datosContactoParseados.latitud),
          longitud: parseFloat(datosContactoParseados.longitud),
        },

        // Arreglo de archivos de imagen
        imagenes: archivosImagenes,
      };
      
      // --- 5. Llamada al Servicio (Se mantiene igual) ---
      const nuevaEmpresa = await NegocioService.crearNegocio(datosParaServicio);

      // --- 6. Respuesta de Éxito (Se mantiene igual) ---
      res.status(201).json({
        mensaje: "Empresa creada correctamente.",
        empresa: nuevaEmpresa,
      });

    } catch (error: unknown) {
      console.error("Error en NegocioController.crear:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor." });
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

  static async vacacionesColaborador(req: CustomRequest, res: Response) {
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
  
      const colaboradorDesvinculado = await ColaboradorService.vacacionesColaborador(id_negocio, id_usuario);

      // 5. Enviar respuesta de éxito
     
      res.status(200).json({
        mensaje: "Colaborador enviado a vacaciones exitosamente.",
        empleado: colaboradorDesvinculado, // Devolver el registro de empleado actualizado
      });
      console.log("--- Fin de NegocioController.desvincularColaborador (Éxito) ---");

    } catch (error: unknown) {

      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desvincular el colaborador." });

    }
  }

  static async ReintegrarvacacionesColaborador(req: CustomRequest, res: Response) {
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
  
      const colaboradorDesvinculado = await ColaboradorService.ReintegrarvacacionesColaborador(id_negocio, id_usuario);

      // 5. Enviar respuesta de éxito
     
      res.status(200).json({
        mensaje: "Colaborador reintegrado de  vacaciones exitosamente.",
        empleado: colaboradorDesvinculado, // Devolver el registro de empleado actualizado
      });
      console.log("--- Fin de NegocioController.desvincularColaborador (Éxito) ---");

    } catch (error: unknown) {

      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desvincular el colaborador." });

    }
  }

  static async obtenerEmpresasPorAdmin(req: CustomRequest, res: Response) {
        console.log("--- Inicio de NegocioController.obtenerEmpresasPorAdmin ---");
        try {

            if (!req.user) {
                return res.status(401).json({ mensaje: "Usuario no autenticado." });
            }

            console.log(`Usuario autenticado: ${req.user.correo}, Rol: ${req.user.rolNombre}`);

            const idAdminSolicitante = req.user.id; 

            if (req.user.rolNombre !== 'Administrador') {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden ver sus empresas asociadas." });
            }

            const empresas = await  NegocioService.obtenerEmpresasPorAdmin(idAdminSolicitante);

            res.status(200).json({
                mensaje: "Empresas obtenidas exitosamente.",
                empresas: empresas,
            });

        } catch (error: unknown) {
            console.error("Error en NegocioController.obtenerEmpresasPorAdmin:", error);
            // 4. Manejar y enviar respuesta de error
            res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener las empresas." });
        }
  }

  static async obtenerEmpresaPorId(req: CustomRequest, res: Response) {
        console.log("--- Inicio de NegocioController.obtenerEmpresaPorId ---");
        try {
            if (!req.user) {
                return res.status(401).json({ mensaje: "Usuario no autenticado." });
            }

            console.log(`Usuario autenticado: ${req.user.correo}, Rol: ${req.user.rolNombre}`);

            if (req.user.rolNombre !== 'Administrador') {
                return res.status(403).json({ mensaje: "Acceso denegado. Función solo para administradores." });
            }

            const idAdminSolicitante = req.user.id;
            const { idEmpresa } = req.body;
  
            const idEmpresa2 = parseInt(idEmpresa, 10);

            console.log(`el ide de la empresa`,idEmpresa);
            console.log(`el ide de la empresa`,idAdminSolicitante);

            if (isNaN(idEmpresa) || idEmpresa <= 0) {
                return res.status(400).json({ mensaje: "El ID de la empresa proporcionado en la URL no es válido." });
            }

            console.log(`Solicitando empresa con ID: ${idEmpresa} para el admin con ID: ${idAdminSolicitante}`);

            // 5. Llamar al servicio con ambos IDs
            const empresa = await NegocioService.obtenerEmpresaPorId(idAdminSolicitante, idEmpresa2);

            // 6. Enviar respuesta exitosa
            res.status(200).json({
                mensaje: "Empresa obtenida exitosamente.",
                empresa: empresa, // Se devuelve el objeto único
            });

        } catch (error: unknown) {
            console.error("Error en NegocioController.obtenerEmpresaPorId:", error);
            
            const errorMessage = (error as Error).message;

            if (errorMessage.includes("No se encontró la empresa")) {
                return res.status(404).json({ mensaje: errorMessage });
            }
            
            res.status(400).json({ mensaje: errorMessage || "Error interno del servidor al obtener la empresa." });
        }
  }

  static async obtenerEstadisticas(req: CustomRequest, res: Response) {
  try {
    // La autenticación
    if (!req.user) {
      return res.status(401).json({ mensaje: "Usuario no autenticado." });
    }
    if (req.user.rolNombre !== 'Administrador') {
      return res.status(403).json({ mensaje: "Acceso denegado." });
    }

 
    const { idEmpresa } = req.body;

    
    const idEmpresaNumerico = parseInt(idEmpresa, 10);
    if (isNaN(idEmpresaNumerico) || idEmpresaNumerico <= 0) {
      return res.status(400).json({ mensaje: "El idEmpresa proporcionado en el body no es válido." });
    }

    const estadisticas = await NegocioService.obtenerEstadisticasInventario(idEmpresaNumerico);

    res.status(200).json(estadisticas);

  } catch (error: unknown) {
    console.error("Error en NegocioController.obtenerEstadisticas:", error);
    res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor." });
  }
  }

  static async getTiposEmpresasActivos(req: Request, res: Response) {
    try {
      const tiposEmpresa = await NegocioService.obtenerTodosTiposEmpresa();
      
      res.status(200).json(tiposEmpresa);

    } catch (error: unknown) {
      // 3. Si algo falla, devuelve un error 500
      res.status(500).json({ mensaje: (error as Error).message });
    }
  }


  static async listarColaboradoresPorEmpresa(req: CustomRequest, res: Response) {
    try {
       if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de agregar colaborador por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden listar colaboradores." });
      }

      const { id_negocio } = req.body;

      const colaboradores = await ColaboradorService.TodosColaboradorXEmpresa(id_negocio);


      if (colaboradores.length > 0) {
        return res.status(200).json({
          mensaje: "Colaboradores del negocio obtenidos exitosamente.",
          colaboradores: colaboradores,
        });
      } else {
        return res.status(200).json({
          mensaje: "No se encontraron colaboradores activos para este negocio.",
          colaboradores: [], 
        });
      }

    } catch (error: unknown) {
      console.error("Error en NegocioController.listarColaboradoresPorEmpresa:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al listar los colaboradores." });
    }
  }

  

 



}
