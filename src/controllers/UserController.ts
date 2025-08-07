import { Request, Response } from 'express';
import * as UsuarioService from '../services/UserService';

export class UserController {

  static async crear(req: Request, res: Response) {
    try {
      const { nombre, email, password } = req.body;
      if (password && password.length >= 8) {
        const nuevo = await UsuarioService.crearUsuario({ nombre, email, password });
        res.status(201).json(nuevo);
      } else {
        res.status(500).json({ mensaje: "contrasenia demasiado corta" });
      }
      
      
    } catch (error) {
      console.error("Error creando usuario:", error);
      res.status(500).json({ mensaje: "Error al crear usuario", error: error.message });
    }
  }
  
  
    static async listar(req: Request, res: Response) {
      const usuarios = await UsuarioService.obtenerUsuarios();
      res.json(usuarios);
    }
  
   
  
    static async obtenerPorId(req: Request, res: Response) {
      const id = parseInt( req.body.id);
      console.log("METODO LISTA ID", id)
      const usuario = await UsuarioService.obtenerUsuarioPorId(id);
      if (usuario) res.json(usuario);
      else res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

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
  

