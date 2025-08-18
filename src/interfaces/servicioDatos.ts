export interface CrearActualizarServicioDatos {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  precio_descuento?: number | null; // ¡NUEVO CAMPO!: Precio de venta del servicio con descuento
  porcentaje_descuento?: number | null; // ¡NUEVO CAMPO!: Porcentaje de descuento (entero)
  activo?: number; // Opcional para crear (default en entidad), útil para actualizar
  id_negocio: number; // Obligatorio para crear, no se actualiza
  id_tipo_servicio: number; // Obligatorio para crear, actualizable
}