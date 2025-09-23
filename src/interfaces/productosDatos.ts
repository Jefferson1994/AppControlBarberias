export interface CrearActualizarProductoDatos {
  nombre: string;
  descripcion?: string | null;
  precio_compra: number;
  precio_venta: number;
  precio_promocion?: number | null;
  precio_descuento?: number | null;
  stock_actual?: number; // Opcional al crear, pero útil en actualizaciones de stock
  id_negocio: number; // ¡ACTUALIZADO!: Ahora es solo number, ya que es NOT NULL en la entidad.
  id_tipo_producto: number; // ¡ACTUALIZADO!: Ahora es solo number, ya que es NOT NULL en la entidad.
}
