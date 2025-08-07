import { Request, Response } from 'express';
import * as GastosService from '../services/GastoService';

export class GastosController {

  static async crear(req: Request, res: Response) {
    try {

    // Llamamos a crearGasto con objetos anidados sólo con el id
   const { monto, descripcion, fecha, idusuario, tipo, categoria } = req.body;

    const nuevo = await GastosService.crearGasto({ 
      monto, 
      descripcion, 
      fecha, 
      usuarioId: idusuario, 
      tipoId: tipo, 
      categoriaId: categoria
    });

      res.status(201).json(nuevo);
      
      
      
    } catch (error) {
      console.error("Error creando usuario:", error);
      res.status(500).json({ mensaje: "Error al crear usuario", error: error.message });
    }
  }
  
  
    static async listar(req: Request, res: Response) {
      const usuarios = await GastosService.obtenerUsuarios();
      res.json(usuarios);
    }
  
   
  
    static async obtenerPorId(req: Request, res: Response) {
      const id = parseInt(req.params.id);
      const usuario = await GastosService.obtenerGastoPorId(id);
      if (usuario) res.json(usuario);
      else res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    static async obtenerTodosIngresosCategorias(req: Request, res: Response) {
      const idtipo = req.body.tipo;
      console.log("el tipo es "+idtipo);
      const usuario = await GastosService.obtenerTipoIngresoCategorias(idtipo);
      if (usuario) res.json(usuario);
      else res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

     static async obtenerTodosGastosCategorias(req: Request, res: Response) {
      const idtipo = req.body.tipo;
      console.log("el tipo es "+idtipo);
      
      const usuario = await GastosService.obtenerTiposGastosCategorias(idtipo);
      if (usuario) res.json(usuario);
      else res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    /*static async LoginPorMail(req: Request, res: Response) {
      const { email, password } = req.body;
      console.log(email, password)
      const usuario = await GastosService.obtenerGastoxx(email, password);

      if (usuario) {
        res.json(usuario);
      } else {
        res.status(401).json({ mensaje: 'Credenciales inválidas' });
      }
    }*/

  
  }
  

