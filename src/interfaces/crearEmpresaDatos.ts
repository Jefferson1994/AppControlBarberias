/**
 * Interfaz para los datos de contacto y ubicación de una empresa.
 * Se usará anidada dentro de CrearEmpresaDatos.
 */
export interface ContactoUbicacionDatos {
  telefono_contacto?: string | null;
  email_contacto?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/**
 * Interfaz que define la estructura de los datos necesarios
 * para crear una nueva empresa (negocio), con los datos de contacto/ubicación
 * en un objeto anidado 'datos_contacto'.
 */
export interface CrearEmpresaDatos {
  nombre: string;
  ruc: string; // Obligatorio
  
  descripcion?: string | null;
  activo?: number; // 0 o 1, por defecto 1 en la entidad
  id_tipo_empresa: number; // Obligatorio
  direccion?: string | null;
  horario_apertura: string; // Obligatorio
  horario_cierre: string; // Obligatorio
  id_administrador: number; // Se asigna desde el token

  // Campo anidado para datos de contacto y ubicación
  datos_contacto?: ContactoUbicacionDatos;
  imagen?: Express.Multer.File;
}


export interface EstadisticasInventario {
  valorTotalInventario: number;
  totalProductos: number;
  productosConPocoStock: number;
  gananciaPotencial: number;
}
