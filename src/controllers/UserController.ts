import { Request, Response } from 'express';
import * as UsuarioService from '../services/UserService';
import { crearUsuario } from '../services/UserService';

export class UserController {

  static async crear(req: Request, res: Response) {
    try {
      // Desestructurar los datos del cuerpo de la solicitud
      // Asegúrate de que los nombres de las propiedades coincidan con tu entidad Usuario
      const { nombre, correo, contrasena, rol, numero_telefono, numero_identificacion } = req.body;

      // Validaciones básicas de entrada desde la solicitud
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

      // Llamar al servicio para crear el usuario con los datos correctos
      const nuevoUsuario = await crearUsuario({
        nombre,
        correo,
        contrasena, // Aquí pasarías la contraseña en texto plano para que el servicio la hashee
        rol,
        numero_telefono, // Estos son opcionales según tu entidad
        numero_identificacion, // Estos son opcionales según tu entidad
      });

      // Prepara el objeto de respuesta para el cliente, excluyendo la contraseña
      const usuarioParaRespuesta = { ...nuevoUsuario };
      //delete usuarioParaRespuesta.contrasena; // Elimina la contraseña (hasheada) del objeto de respuesta

      res.status(201).json({
        mensaje: "Usuario creado correctamente. Por favor, inicia sesión.", // Mensaje de éxito
        usuario: usuarioParaRespuesta // Devuelve el usuario sin la contraseña
      });
    } catch (error) {
      console.error("Error creando usuario:", error);
      // Manejo de errores más específico, por ejemplo, si el correo ya existe
      if (error.message.includes('UNIQUE constraint failed')) { // Ejemplo para errores de unicidad
        return res.status(409).json({ mensaje: "Error al crear usuario: El correo electrónico ya está registrado.", error: error.message });
      }
      res.status(500).json({ mensaje: "Error interno del servidor al crear usuario", error: error.message });
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
    const { email, password } = req.body;
    console.log(email, password)
    const usuario = await UsuarioService.obtenerLoginPorMail(email, password);

    if (usuario) {
      res.json(usuario);
    } else {
      res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
  }


}


