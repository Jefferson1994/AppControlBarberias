import { Request, Response } from 'express';
import { actualizarProducto, eliminarLogicoProducto, obtenerTiposProductoActivos } from '../services/ProductoService'; // Importa el servicio
import { crearProducto } from '../services/ProductoService';
import { CrearActualizarProductoDatos } from '../interfaces/productosDatos';
import { obtenerProductosPorNegocio } from '../services/NegocioService';
import { obtenerProductoPorId } from '../services/NegocioService';
import { obtenerEmpresasCercanas } from '../services/NegocioService';
// Interfaz extendida para Request para incluir la información del usuario del token JWT
interface CustomRequest extends Request {
  user?: {
    id: number;
    correo: string;
    id_rol: number;
    rolNombre: string | null;
  };
}

/**
 * Controlador para manejar las operaciones relacionadas con la entidad TipoProducto.
 */
export class ProductoController {

  static async obtenerActivos(req: CustomRequest, res: Response) { // ¡CAMBIADO: req ahora es CustomRequest!
    try {
      // 1. Verifica si el usuario está autenticado y tiene los datos del token
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de acceso a tipos de producto por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden ver los tipos de producto." });
      }
      const { id_empresa } = req.body; 
      // Llama al servicio para obtener los tipos de producto activos.
      const tiposProducto = await obtenerTiposProductoActivos(id_empresa);

      // Si la operación es exitosa, devuelve la lista de tipos de producto activos.
      res.status(200).json(tiposProducto);
    } catch (error: unknown) {
      // Captura y registra cualquier error que ocurra en el servicio o durante la petición.
      console.error("Error en TipoProductoController.obtenerActivos:", (error as Error).message);
      // Devuelve una respuesta de error al cliente.
      res.status(500).json({
        mensaje: "Error interno del servidor al obtener tipos de producto activos.",
        error: (error as Error).message,
      });
    }
  }


  static async crear(req: CustomRequest, res: Response) {
    try {
      // --- 1. Verificación de usuario y rol ---
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden crear productos." });
      }

      // --- 2. Recolección de datos del body y archivos ---
      const datosDelBody = req.body;
      const archivosImagenes = req.files as Express.Multer.File[]; // req.files contiene las imágenes

      // --- 3. Preparar datos para el servicio ---
      const datosParaServicio: CrearActualizarProductoDatos = {
        nombre: datosDelBody.nombre,
        descripcion: datosDelBody.descripcion,
        precio_venta: parseFloat(datosDelBody.precio_venta),
        precio_compra: parseFloat(datosDelBody.precio_compra),
        precio_promocion: parseFloat(datosDelBody.precio_promocion),
        precio_descuento: parseFloat(datosDelBody.precio_descuento),
        stock_actual: parseInt(datosDelBody.stock_actual, 10),
        id_negocio: parseInt(datosDelBody.id_negocio, 10),
        id_tipo_producto: parseInt(datosDelBody.id_tipo_producto, 10),
        imagenes: archivosImagenes,
      };

      const nuevoProducto = await crearProducto(datosParaServicio);

      res.status(201).json({
        mensaje: "Producto creado correctamente.",
        producto: nuevoProducto,
      });

    } catch (error: unknown) {
      console.error("Error en ProductoController.crear:", error);
      res.status(400).json({
        mensaje: (error as Error).message || "Error interno del servidor al crear el producto."
      });
    }
  }


  static async actualizar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica si el usuario está autenticado y tiene los datos del token
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }

      // 2. Control de Acceso Basado en Rol (RBAC)
      // Solo permite a usuarios con rol 'Administrador' actualizar productos.
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de actualización de producto por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden actualizar productos." });
      }

      // 3. Obtener el ID del producto Y los datos a actualizar del CUERPO de la solicitud
      // Asumimos que el body contendrá al menos 'id' y los campos a actualizar.
      const { id, ...datosActualizacion } = req.body; // Desestructuramos para separar el 'id' del resto de los datos

      const idProducto = parseInt(id, 10); // Convertir el ID a número
      if (isNaN(idProducto)) {
        return res.status(400).json({ mensaje: "ID de producto inválido en el cuerpo de la solicitud." });
      }

      // 4. Llama al servicio para actualizar el producto.
      // Le pasamos el idProducto separado y el resto de los datos (datosActualizacion).
      const productoActualizado = await actualizarProducto(idProducto, datosActualizacion);

      // 5. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Producto actualizado correctamente.",
        producto: productoActualizado,
      });

    } catch (error: unknown) {
      console.error("Error en ProductoController.actualizar:", error);
      // El servicio ya lanza errores específicos, los retransmitimos con un estado 400 por ser errores de cliente/negocio.
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al actualizar el producto." });
    }
  }

  static async eliminar(req: CustomRequest, res: Response) {
    try {
      // 1. Verifica autenticación y rol
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        console.warn(`Intento de eliminar (lógico) producto por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden desactivar productos." });
      }

      // 2. Obtener el ID del producto del CUERPO de la solicitud
      const { id } = req.body; // Se espera { id: number } en el body

      const idProducto = parseInt(id, 10); // Convertir el ID a número
      if (isNaN(idProducto)) { 
        return res.status(400).json({ mensaje: "ID de producto inválido en el cuerpo de la solicitud." });
      }

      // 3. Llama al servicio para realizar la eliminación lógica (desactivación)
      const productoDesactivado = await eliminarLogicoProducto(idProducto);

      // 4. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: "Producto desactivado correctamente.",
        producto: productoDesactivado, // Devuelve el producto con el estado 'activo' actualizado a 0
      });

    } catch (error: unknown) {
      console.error("Error en ProductoController.eliminar (lógica):", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al desactivar el producto." });
    }
  }

  static async obtenerProductoPorEmpresa(req: CustomRequest, res: Response) {
    try {
      // 1. Verificar autenticación y rol del usuario
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      // Permitir acceso a Administradores y Colaboradores
      if (req.user.rolNombre !== 'Administrador' && req.user.rolNombre !== 'Colaborador') {
        console.warn(`Intento de obtener productos por usuario no autorizado: ${req.user.correo} (Rol: ${req.user.rolNombre})`);
        return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores y colaboradores pueden ver productos." });
      }

      // 2. Obtener el ID del negocio del cuerpo de la solicitud
      const { id_empresa } = req.body;

      if (typeof id_empresa !== 'number' || isNaN(id_empresa)) {
        return res.status(400).json({ mensaje: "El ID del negocio es obligatorio y debe ser un número válido en el cuerpo de la solicitud." });
      }

      // 3. Llama al servicio para obtener los productos del negocio
      const productos = await obtenerProductosPorNegocio(id_empresa);

      // 4. Envía la respuesta de éxito
      res.status(200).json({
        mensaje: `Productos obtenidos correctamente para el negocio ID ${id_empresa}.`,
        productos: productos,
      });

    } catch (error: unknown) {
      console.error("Error en ProductoController.obtenerPorNegocio:", error);
      res.status(400).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener los productos." });
    }
  }


  static async obtenerPorId(req: CustomRequest, res: Response) { // ¡MODIFICADO! Ya no espera parámetros en URL
    try {
      if (!req.user) {
        return res.status(401).json({ mensaje: "Usuario no autenticado." });
      }
      if (req.user.rolNombre !== 'Administrador') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo los administradores pueden ver productos." });
      }

      const { id, id_empresa } = req.body; // Obtener ambos IDs del cuerpo de la solicitud

      if (typeof id !== 'number' || isNaN(id)) {
        return res.status(400).json({ mensaje: "ID de producto inválido en el cuerpo de la solicitud." });
      }
      if (typeof id_empresa !== 'number' || isNaN(id_empresa)) {
        return res.status(400).json({ mensaje: "ID de negocio inválido en el cuerpo de la solicitud." });
      }

      // Llama al servicio pasando ambos IDs
      const producto = await obtenerProductoPorId(id, id_empresa); // ¡MODIFICADO AQUÍ!

      if (!producto) {
        return res.status(404).json({ mensaje: `Producto con ID ${id} no encontrado o no pertenece al negocio ID ${id_empresa}.` });
      }

      res.status(200).json(producto);

    } catch (error: unknown) {
      console.error("Error en ProductoController.obtenerPorId:", error);
      res.status(500).json({ mensaje: (error as Error).message || "Error interno del servidor al obtener el producto." });
    }
  }

  



}
