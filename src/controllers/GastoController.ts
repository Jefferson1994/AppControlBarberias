import { Request, Response } from 'express';

// Si las funcionalidades de "Gasto" ya no son parte de este proyecto,
// este controlador debería ser eliminado o adaptado para nuevas funcionalidades.
// Por ahora, lo mantenemos con una estructura válida.

export class GastoController {
  /*
  // Los métodos comentados deben estar dentro de la clase GastoController
  static async crearGasto(req: Request, res: Response) {
    try {

      res.status(404).json({ mensaje: "Funcionalidad de Gasto no implementada o deshabilitada." });

    } catch (error: unknown) { // Añadido : unknown
      console.error("Error creando gasto:", (error as Error).message); // Corregido: TS18046
      res.status(500).json({ mensaje: "Error al crear gasto", error: (error as Error).message }); // Corregido: TS18046
    }
  }
  */

  // Este es un método de ejemplo válido si quieres mantener el controlador pero sin funcionalidad actual
  static async healthCheck(req: Request, res: Response) {
    res.status(200).json({ mensaje: "GastoController está activo pero sus funcionalidades están deshabilitadas." });
  }
}

/*import { Request, Response } from 'express';
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

  
  //}
  

