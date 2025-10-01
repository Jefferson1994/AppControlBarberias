import { AppDataSource } from "../config/data-source";
import { TipoProducto } from "../entities/TipoProducto"; // Asegúrate de importar la entidad TipoProducto
import { Producto } from "../entities/Producto";
import { CrearActualizarProductoDatos, ProductoData } from "../interfaces/productosDatos";
import { Negocio } from "../entities/Negocio";
import { TipoEmpresa } from "../entities/TipoEmpresa";
import { ImagenProducto } from "../entities/ImagenProducto";
import cloudinary from "../config/cloudinary";

export const obtenerTiposProductoActivos = async (idTipoEmpresa: number): Promise<TipoProducto[]> => {
  try {
    const tipoEmpresaRepository = AppDataSource.getRepository(TipoEmpresa);

    // 2. Buscamos UN tipo de empresa por su ID y le pedimos a TypeORM que cargue su relación.
    const tipoEmpresa = await tipoEmpresaRepository.findOne({
      where: { id: idTipoEmpresa },
      relations: {
        tiposProductoPermitidos: true, // <-- Esta es la magia: carga el arreglo de productos
      },
    });

    // 3. Si no se encuentra el tipo de empresa, devolvemos un arreglo vacío.
    if (!tipoEmpresa) {
      console.warn(`No se encontró un Tipo de Empresa con ID: ${idTipoEmpresa}`);
      return [];
    }

    const tiposActivos = tipoEmpresa.tiposProductoPermitidos.filter(tipo => tipo.activo === 1);

    return tiposActivos;
  } catch (error: unknown) {
    console.error("Error en TipoProductoService.obtenerTiposProductoActivos:", (error as Error).message);
    // Relanza el error para que el controlador o la capa superior puedan manejarlo
    throw new Error("No se pudieron obtener los tipos de producto activos. Por favor, inténtalo de nuevo más tarde.");
  }
};


/*export const crearProducto = async (datos: CrearActualizarProductoDatos): Promise<Producto> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones de campos obligatorios
      if (!datos.nombre) throw new Error("El nombre del producto es obligatorio.");
      if (datos.precio_venta === undefined || datos.precio_venta === null) {
        throw new Error("El precio de venta del producto es obligatorio.");
      }
      if (!datos.id_negocio) throw new Error("El ID del negocio al que pertenece el producto es obligatorio.");

      // 2. Verificar existencia del negocio
      const negocioExistente = await transactionalEntityManager.findOne(Negocio, {
        where: { id: datos.id_negocio },
      });
      if (!negocioExistente) {
        throw new Error(`Negocio con ID ${datos.id_negocio} no encontrado.`);
      }

      // 3. Verificar existencia del TipoProducto si se proporciona
      if (datos.id_tipo_producto !== undefined && datos.id_tipo_producto !== null) {
        const tipoProductoExistente = await transactionalEntityManager.findOne(TipoProducto, {
          where: { id: datos.id_tipo_producto },
        });
        if (!tipoProductoExistente) {
          throw new Error(`Tipo de producto con ID ${datos.id_tipo_producto} no encontrado.`);
        }
      }

      

      // 4. Crear la nueva instancia de Producto
      const nuevoProducto = transactionalEntityManager.create(Producto, datos);

      // Si stock_actual no se proporciona al crear, se usará el default de la entidad (0).
      if (datos.stock_actual !== undefined) {
        nuevoProducto.stock_actual = datos.stock_actual;
      } else {
        nuevoProducto.stock_actual = 0; // Asegurar que el stock inicial sea 0 si no se envía
      }

      // 5. Guardar el nuevo producto
      const productoGuardado = await transactionalEntityManager.save(Producto, nuevoProducto);

      return productoGuardado;
    } catch (error: unknown) {
      console.error("Error en ProductoService.crearProducto:", error);
      // Aquí puedes añadir manejo específico para QueryFailedError si hay validaciones UNIQUE en Producto.
      throw new Error((error as Error).message || "No se pudo crear el producto. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};*/

export const crearProducto = async (datos: CrearActualizarProductoDatos): Promise<Producto> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // --- 1. VALIDACIONES (Se mantienen igual) ---
      if (!datos.nombre) throw new Error("El nombre del producto es obligatorio.");
      if (datos.precio_venta === undefined) throw new Error("El precio de venta es obligatorio.");
      if (!datos.id_negocio) throw new Error("El ID del negocio es obligatorio.");

      const negocioExistente = await transactionalEntityManager.findOne(Negocio, { where: { id: datos.id_negocio } });
      if (!negocioExistente) throw new Error(`Negocio con ID ${datos.id_negocio} no encontrado.`);

      if (datos.id_tipo_producto) {
        const tipoProductoExistente = await transactionalEntityManager.findOne(TipoProducto, { where: { id: datos.id_tipo_producto } });
        if (!tipoProductoExistente) throw new Error(`Tipo de producto con ID ${datos.id_tipo_producto} no encontrado.`);
      }

      // --- 2. PREPARAR Y GUARDAR LA ENTIDAD 'PRODUCTO' ---

      // Creamos un objeto limpio sin las imágenes para evitar errores de tipo con TypeORM
      const datosProducto: ProductoData = {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precio_compra: datos.precio_compra,
          precio_venta: datos.precio_venta,
          precio_promocion: datos.precio_promocion,
          precio_descuento: datos.precio_descuento,
          stock_actual: datos.stock_actual, 
          id_negocio: datos.id_negocio,
          id_tipo_producto: datos.id_tipo_producto,
     
      };
            

      const nuevoProducto = transactionalEntityManager.create(Producto, datosProducto);

      if (datos.stock_actual === undefined) {
        nuevoProducto.stock_actual = 0;
      }
      
      // Guarda el producto primero para obtener su ID
      const productoGuardado = await transactionalEntityManager.save(Producto, nuevoProducto);

      // --- 3. PROCESAR Y GUARDAR LAS IMÁGENES ASOCIADAS ---
      if (datos.imagenes && datos.imagenes.length > 0) {
        console.log(`Subiendo ${datos.imagenes.length} imágenes de producto a Cloudinary...`);

        const promesasDeSubida = datos.imagenes.map(file => {
          const base64String = file.buffer.toString('base64');
          const dataUri = `data:${file.mimetype};base64,${base64String}`;
          // Sube a una carpeta específica para productos
          return cloudinary.uploader.upload(dataUri, { folder: 'productos' });
        });

        const resultadosCloudinary = await Promise.all(promesasDeSubida);

        const nuevasImagenes = resultadosCloudinary.map((resultado, index) => {
          const nuevaImagen = new ImagenProducto();
          nuevaImagen.url_imagen = resultado.secure_url;
          nuevaImagen.orden = index + 1;
          nuevaImagen.producto = productoGuardado; // Vincula la imagen con la entidad Producto recién creada
          return nuevaImagen;
        });

        // Guarda todas las nuevas entidades de imágenes
        await transactionalEntityManager.save(ImagenProducto, nuevasImagenes);
        console.log('Imágenes de producto guardadas y vinculadas.');
      }

      return productoGuardado;

    } catch (error: unknown) {
      console.error("Error en ProductoService.crearProducto:", error);
      throw new Error((error as Error).message || "No se pudo crear el producto.");
    }
  });
};

export const actualizarProducto = async (id: number, datosActualizacion: Partial<CrearActualizarProductoDatos>): Promise<Producto> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Buscar el producto existente
      const productoExistente = await transactionalEntityManager.findOne(Producto, {
        where: { id: id },
      });

      if (!productoExistente) {
        throw new Error("Producto no encontrado para la actualización.");
      }

      // 2. Verificar existencia del TipoProducto si se intenta actualizar
      // Si id_tipo_producto es obligatorio, la verificación debe ser más estricta.
      if (datosActualizacion.id_tipo_producto !== undefined) { // No verificar si es null, ya que ahora es number
        const tipoProductoExistente = await transactionalEntityManager.findOne(TipoProducto, {
          where: { id: datosActualizacion.id_tipo_producto },
        });
        if (!tipoProductoExistente) {
          throw new Error(`Tipo de producto con ID ${datosActualizacion.id_tipo_producto} no encontrado.`);
        }
      }

      // 3. Fusionar los datos de actualización con el producto existente
      Object.assign(productoExistente, {
        ...datosActualizacion,
        // Manejo explícito de los campos que pueden ser null en la entidad pero undefined en el DTO
        descripcion: datosActualizacion.descripcion === null ? null : datosActualizacion.descripcion,
        precio_promocion: datosActualizacion.precio_promocion === null ? null : datosActualizacion.precio_promocion,
        precio_descuento: datosActualizacion.precio_descuento === null ? null : datosActualizacion.precio_descuento, // ¡CORRECCIÓN AQUÍ!
      });

      // 4. Guardar el producto actualizado
      const productoActualizado = await transactionalEntityManager.save(Producto, productoExistente);

      return productoActualizado;
    } catch (error: unknown) {
      console.error("Error en ProductoService.actualizarProducto:", error);
      throw new Error((error as Error).message || "No se pudo actualizar el producto. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};

export const eliminarLogicoProducto = async (id: number): Promise<Producto> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      const productoExistente = await transactionalEntityManager.findOne(Producto, {
        where: { id: id },
      });

      if (!productoExistente) {
        throw new Error("Producto no encontrado para la eliminación lógica.");
      }

      // Verificar si el producto ya está inactivo (activo = 0)
      if (productoExistente.activo === 0) { // activo = 1 es activo, activo = 0 es inactivo
        throw new Error("El producto ya se encuentra inactivo.");
      }

      // Cambiar el estado 'activo' a 0 (inactivo)
      productoExistente.activo = 0;

      // Guardar el producto con el estado actualizado
      const productoDesactivado = await transactionalEntityManager.save(Producto, productoExistente);

      return productoDesactivado;
    } catch (error: unknown) {
      console.error("Error en ProductoService.eliminarLogicoProducto:", error);
      throw new Error((error as Error).message || "No se pudo desactivar el producto. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};