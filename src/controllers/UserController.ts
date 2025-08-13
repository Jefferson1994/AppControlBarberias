import { Request, Response } from 'express';
import { crearUsuario, obtenerLoginPorMail } from '../services/UserService'; // Importa tus funciones de servicio
import { AppDataSource } from '../config/data-source'; // Asegúrate de importar AppDataSource
import { Usuario } from '../entities/Usuario'; // Asegúrate de importar la entidad Usuario


export class UserController {
  static async crear(req: Request, res: Response) {
    try {
      const { nombre, correo, contrasena, rol, numero_telefono, numero_identificacion } = req.body;

      if (!contrasena || contrasena.length < 8) {
        return res.status(400).json({ mensaje: "La contraseña es demasiado corta o no fue proporcionada (mínimo 8 caracteres)." });
      }
      if (!correo) {
        return res.status(400).json({ mensaje: "El correo electrónico es obligatorio." });
      }
      if (!nombre) {
        return res.status(400).json({ mensaje: "El nombre es obligatorio." });
      }
      if (!rol) {
        return res.status(400).json({ mensaje: "El rol del usuario es obligatorio." });
      }

      const nuevoUsuario = await crearUsuario({
        nombre,
        correo,
        contrasena, // Aquí pasarías la contraseña en texto plano para que el servicio la hashee
        rol,
        numero_telefono,
        numero_identificacion,
      });

      const usuarioParaRespuesta: Partial<Usuario> = { ...nuevoUsuario };
      delete (usuarioParaRespuesta as any).contrasena; // CORREGIDO: Vuelve a habilitar el delete con as any para seguridad.

      res.status(201).json({
        mensaje: "Usuario creado correctamente. Por favor, inicia sesión.",
        usuario: usuarioParaRespuesta
      });
    } catch (error: unknown) { // CORREGIDO: Añadido : unknown para tipado explícito
      console.error("Error creando usuario:", (error as Error).message); // CORREGIDO: Asertado a Error
      
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ mensaje: "Error al crear usuario: El correo electrónico ya está registrado.", error: error.message });
      }
      res.status(500).json({ mensaje: "Error interno del servidor al crear usuario", error: (error as Error).message }); // CORREGIDO: Asertado a Error
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
    const { correo, contrasena } = req.body; // Controller extracts data from the request

    // Controller calls the service function, passing the extracted data
    const usuario = await obtenerLoginPorMail(correo, contrasena);

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

}
