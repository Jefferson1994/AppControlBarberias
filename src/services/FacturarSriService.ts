import { EntityManager } from "typeorm";
import { Venta } from "../entities/Venta";
import { Negocio } from "../entities/Negocio";
import { Colaborador } from "../entities/Colaborador";
import { Usuario  } from "../entities/Usuario";
import { DatosContactoEmpresa  } from "../entities/DatosContactoEmpresa";
import { DetalleVenta } from "../entities/DetalleVenta";
import PDFDocument from 'pdfkit';
import { Cliente } from "../entities/Cliente";
export const facturarSRI = async (
  transactionalEntityManager: EntityManager,
  venta: Venta,
  negocio: Negocio,
  colaborador: Colaborador,
  detallesVenta: DetalleVenta[]
): Promise<boolean> => {
  console.log("[facturarSRI] Iniciando simulación de facturación al SRI...");
  console.log("[facturarSRI] Datos de la venta para el SRI:", venta);
  console.log("[facturarSRI] Datos del negocio para el SRI:", negocio);
  console.log("[facturarSRI] Datos del colaborador para el SRI:", colaborador);
  console.log("[facturarSRI] Detalles de la venta para el SRI:", detallesVenta);

  // --- Lógica FUTURA de integración con el SRI ---
  // Aquí es donde en el futuro:
  // 1. Armarías el XML o JSON requerido por el SRI.
  // 2. Firmarías electrónicamente el documento.
  // 3. Enviarías la solicitud al endpoint del SRI.
  // 4. Procesarías la respuesta del SRI (autorización, errores, etc.).
  // 5. Actualizarías el estado de la Venta (ej. 'FACTURADA_SRI', 'RECHAZADA_SRI').
  // 6. Guardarías el número de autorización del SRI en la Venta.
  // 7. Podrías generar el RIDE (Representación Impresa del Documento Electrónico).

  // Por ahora, solo devolvemos true y dejamos un log.
  console.log("[facturarSRI] Simulación de facturación al SRI completada exitosamente.");
  return true;
};

export const generarComprobanteSimple = async (
  transactionalEntityManager: EntityManager,
  venta: Venta,
  negocio: Negocio,
  colaborador: Colaborador,
  detallesVenta: DetalleVenta[]
): Promise<string> => {
  console.log("[generarComprobanteSimple] Iniciando generación de comprobante simple en PDF...");

  let cliente: Cliente | null = null;
  try {
    if (venta.id_cliente) {
      cliente = await transactionalEntityManager.findOne(Cliente, { where: { id: venta.id_cliente } });
      if (!cliente) {
        console.warn(`[generarComprobanteSimple] No se encontró el cliente con ID: ${venta.id_cliente}`);
      }
    }
  } catch (dbError) {
    console.error(`[generarComprobanteSimple] Error al buscar el cliente con ID ${venta.id_cliente}:`, dbError);
    // Continuar sin información del cliente si falla la búsqueda
  }

  let datosContactoEmpresa: DatosContactoEmpresa | null = null;
  try {
    // Asumo que DatosContactoEmpresa se relaciona con Negocio por 'id_negocio'
    datosContactoEmpresa = await transactionalEntityManager.findOne(DatosContactoEmpresa, {
      where: { id: negocio.id },
    });
    if (!datosContactoEmpresa) {
      console.warn(`[generarComprobanteSimple] No se encontraron datos de contacto para el negocio con ID: ${negocio.id}`);
    }
  } catch (dbError) {
    console.error(`[generarComprobanteSimple] Error al buscar datos de contacto para el negocio con ID ${negocio.id}:`, dbError);
    // Continuar sin datos de contacto si falla la búsqueda
  }


  try {
    return await new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A6', // Un tamaño más pequeño, como un recibo
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });
      let buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer.toString('base64'));
      });
      doc.on('error', (err: any) => {
        console.error("[generarComprobanteSimple] Error en el stream del PDF:", err);
        // En caso de error en el stream del PDF, resolvemos con una cadena vacía.
        resolve('');
      });

      // --- Contenido del Comprobante Simple ---
      const primaryColor = '#2c3e50'; // Dark blue/grey for headers
      const accentColor = '#3498db'; // Lighter blue for highlights

      // Header del Negocio
      doc.fillColor(primaryColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(negocio.nombre?.toUpperCase() || 'NEGOCIO DESCONOCIDO', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(negocio.descripcion || '', { align: 'center' })
        .text(`RUC: ${negocio.ruc || 'N/A'}`, { align: 'center' })
        // Usar datosContactoEmpresa para dirección y teléfono
        .text(`${negocio.direccion || 'Dirección Desconocida'}`, { align: 'center' }) // Asumo que negocio tiene una propiedad 'direccion'
        .text(`Teléfono: ${datosContactoEmpresa?.telefono_contacto || 'N/A'}`, { align: 'center' })
        .moveDown(1.5);

      // Título del Comprobante
      doc.fillColor(accentColor)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('COMPROBANTE DE VENTA SIMPLE', { align: 'center' })
        .moveDown(0.5);

      doc.fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica')
        .text(`N° Comprobante: ${venta.numero_comprobante}`, { align: 'center' })
        .text(`Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-EC')}`, { align: 'center' })
        .moveDown(1);

      // Información del Cliente (si existe)
      if (cliente) {
        doc.fillColor(primaryColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('CLIENTE:', { continued: true })
          .font('Helvetica')
          .text(` ${cliente.nombre} `) // Usar nombre y apellido del Cliente
          .moveDown(0.5);
      } else if (venta.id_cliente) {
        // Si id_cliente existe pero el cliente no se encontró o hubo un error al buscarlo
        doc.fillColor(primaryColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('CLIENTE:', { continued: true })
          .font('Helvetica')
          .text(` ID: ${venta.id_cliente} (Información no disponible)`)
          .moveDown(0.5);
      }

      // Colaborador que realizó la venta
      doc.fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ATENDIDO POR:', { continued: true })
        .font('Helvetica')
        .text(` ${colaborador.usuario.nombre} `) // Asumo que colaborador tiene una propiedad 'usuario' con 'nombre' y 'apellido'
        .moveDown(1);

      // Detalles de la Venta (Tabla)
      const tableTop = doc.y;
      const itemX = 30;
      const qtyX = 180;
      const priceX = 230;
      const totalX = 290;

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Descripción', itemX, tableTop);
      doc.text('Cant.', qtyX, tableTop, { width: 40, align: 'right' });
      doc.text('P. Unit.', priceX, tableTop, { width: 50, align: 'right' });
      doc.text('Total', totalX, tableTop, { width: 50, align: 'right' });

      doc.moveTo(itemX, tableTop + 15)
        .lineTo(itemX + 310, tableTop + 15)
        .stroke(primaryColor);

      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);
      detallesVenta.forEach(detalle => {
        doc.text(detalle.nombre_producto || 'N/A', itemX, y, { width: 140 });
        doc.text(detalle.cantidad.toString(), qtyX, y, { width: 40, align: 'right' });
        doc.text(detalle.precio_unitario.toFixed(2), priceX, y, { width: 50, align: 'right' });
        doc.text(detalle.subtotal.toFixed(2), totalX, y, { width: 50, align: 'right' });
        y += 15;
      });

      doc.moveTo(itemX, y)
        .lineTo(itemX + 310, y)
        .stroke(primaryColor);
      y += 10;

      // Totales
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Subtotal:', priceX, y, { width: 50, align: 'right' });
      doc.text(venta.subtotal.toFixed(2), totalX, y, { width: 50, align: 'right' });
      y += 15;

      doc.text('IVA:', priceX, y, { width: 50, align: 'right' });
      doc.text(venta.iva.toFixed(2), totalX, y, { width: 50, align: 'right' });
      y += 15;

      doc.fillColor(accentColor)
        .fontSize(12)
        .text('TOTAL:', priceX, y, { width: 50, align: 'right' });
      doc.text(`$${venta.total.toFixed(2)}`, totalX, y, { width: 50, align: 'right' });
      y += 20;

      // Observaciones (si existen)
      if (venta.observaciones) {
        doc.fillColor(primaryColor)
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('OBSERVACIONES:', itemX, y)
          .font('Helvetica')
          .text(venta.observaciones, itemX, y + 10, { width: 300 });
        y += 30;
      }

      // Mensaje de pie de página
      doc.moveTo(itemX, doc.page.height - 50)
        .lineTo(itemX + 310, doc.page.height - 50)
        .stroke(primaryColor);

      doc.fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('¡GRACIAS POR SU COMPRA!', itemX, doc.page.height - 40, { align: 'center' });

      doc.end();
    });
  } catch (err: any) {
    console.error("[generarComprobanteSimple] Error general al generar PDF:", err);
    // Si un error ocurre aquí (fuera del stream del PDF), también devolvemos una cadena vacía.
    return '';
  }
};