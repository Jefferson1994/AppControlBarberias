import { Request, Response } from 'express';
import { crearUsuario, obtenerLoginPorMail, obtenerRolesActivos } from '../services/UserService'; // Importa tus funciones de servicio
import { AppDataSource } from '../config/data-source'; // Asegúrate de importar AppDataSource
import { Usuario } from '../entities/Usuario'; // Asegúrate de importar la entidad Usuario


export class UserController {
  
  
  static async crear(req: Request, res: Response) {
    try {
      const { nombre, correo, contrasena, id_rol, numero_telefono, numero_identificacion } = req.body;

      if (!contrasena || contrasena.length < 8) {
        return res.status(400).json({ mensaje: "La contraseña es demasiado corta o no fue proporcionada (mínimo 8 caracteres)." });
      }
      if (!correo) {
        return res.status(400).json({ mensaje: "El correo electrónico es obligatorio." });
      }
      if (!nombre) {
        return res.status(400).json({ mensaje: "El nombre es obligatorio." });
      }
      if (!id_rol) {
        return res.status(400).json({ mensaje: "El ID del rol es obligatorio." });
      }

      const nuevoUsuario = await crearUsuario({
        nombre,
        correo,
        contrasena,
        id_rol,
        numero_telefono,
        numero_identificacion,
      });

      const usuarioParaRespuesta: Partial<Usuario> = { ...nuevoUsuario };
      delete (usuarioParaRespuesta as any).contrasena;

      res.status(201).json({
        mensaje: "Usuario creado correctamente. Por favor, inicia sesión.",
        usuario: usuarioParaRespuesta
      });
    } catch (error: unknown) {
      console.error("Error creando usuario:", (error as Error).message);
      
      // CORREGIDO: Eliminar la lógica duplicada para errores de unicidad
      // Ahora el controlador solo propaga el mensaje de error lanzado por el servicio
      res.status(400).json({ // Usar 400 o 409 si es un error de negocio esperado del servicio
        mensaje: (error as Error).message // Propagar el mensaje específico del servicio
      });
    }
  }

  /*static async obtenerPorId(req: Request, res: Response) {
    const id = parseInt( req.body.id);
    console.log("METODO LISTA ID", id)
    const usuario = await UsuarioService.obtenerUsuarioPorId(id);
    if (usuario) res.json(usuario);
    else res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }*/

  static async LoginPorMail(req: Request, res: Response) {
    try {
      const { email, password } = req.body; // Controller extracts data from the request

      // Controller calls the service function, passing the extracted data
      const usuario = await obtenerLoginPorMail(email, password);

      if (usuario) {
        // Controller processes the result from the service and sends an HTTP response
        res.status(200).json({ message: 'Inicio de sesión exitoso', user: usuario });
      } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
      }
    } catch (error: unknown) {
      // ... error handling ...
    }
  }



  static async RolesActivos(req: Request, res: Response) {
    try {
      // Llama al servicio para obtener los roles activos.
      // El servicio ya contiene la lógica de filtrado y manejo de errores.
      const roles = await obtenerRolesActivos();

      // Si la operación es exitosa, devuelve la lista de roles activos.
      res.status(200).json(roles);
    } catch (error: unknown) {
      // Captura y registra cualquier error que ocurra en el servicio o durante la petición.
      console.error("Error en RolController.obtenerActivos:", (error as Error).message);
      // Devuelve una respuesta de error al cliente.
      res.status(500).json({
        mensaje: "Error interno del servidor al obtener roles activos.",
        error: (error as Error).message,
      });
    }
  }

  /* a futuro poder administar roles desde sistena
  static async crearRol(req: Request, res: Response) {
    try {
      const { nombre, descripcion, activo } = req.body;
      // Llama a un servicio para crear el rol
      // const nuevoRol = await RolService.crearRol({ nombre, descripcion, activo });
      // res.status(201).json(nuevoRol);
      res.status(501).json({ mensaje: "Crear rol aún no implementado." });
    } catch (error: unknown) {
      console.error("Error al crear rol:", (error as Error).message);
      res.status(500).json({ mensaje: "Error al crear rol.", error: (error as Error).message });
    }
  }*/
}
