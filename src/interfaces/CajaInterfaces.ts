
export interface AbrirCajaDatos {
  id_colaborador: number; // ID del colaborador que abre la caja (obtenido del token JWT)
  id_negocio: number;  // ID del negocio al que pertenece la caja (obtenido del token JWT/contexto)
  total_inicial_efectivo?: number; // Monto con el que se abre la caja, opcional.
  observaciones?: string | null; // Alguna observación al abrir la caja.
}


export interface RegistrarMovimientoCajaDatos {
  id_caja: number;      // ID de la caja activa donde se registra el movimiento.
  monto: number;       // Cantidad del movimiento (ej. 15.00).
  tipo: 'ingreso' | 'egreso'; // Tipo de movimiento.
  id_metodo_pago: number; // ID del método de pago asociado al movimiento (ej. 1 para Efectivo, 2 para Tarjeta).
  id_factura?: number | null; // Opcional: ID de la factura asociada si es un ingreso por venta.
  detalle?: string | null;     // Descripción adicional del movimiento.
}


export interface CerrarCajaDatos {
  id_caja: number;      // ID de la caja que se va a cerrar.
  total_real_efectivo: number; // Monto real de efectivo al momento del cierre.
  observaciones?: string | null; // Observaciones al cerrar la caja.
}


export interface ItemFacturaDatos {
  id_producto?: number | null; // ID del producto (si es un producto)
  id_servicio?: number | null; // ID del servicio (si es un servicio)
  cantidad: number;            // Cantidad del ítem
  precio_unitario: number;     // Precio unitario del ítem (puede ser el de venta o con descuento)
  descripcion?: string | null; // Descripción si no es un producto/servicio específico o para override
}


export interface RegistrarVentaCajaDatos {
  id_caja: number;                 // ID de la caja activa.
  id_metodo_pago: number;          // Método de pago principal de la venta.
  id_cliente?: number | null;      // Opcional: ID del cliente.
  observaciones_factura?: string | null; // Observaciones para la factura.
  items: ItemFacturaDatos[];       // Lista de productos y/o servicios vendidos.
}