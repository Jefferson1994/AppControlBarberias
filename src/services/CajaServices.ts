import { AppDataSource } from "../config/data-source";
import { Caja } from "../entities/Cajas"; 
import { Colaborador } from "../entities/Colaborador"; 
import { ComprobanteCounter } from "../entities/ComprobanteCounter";
import { DetalleVenta } from "../entities/DetalleVenta";
import { MetodoPago } from "../entities/Metodo_Pago";
import { MovimientoCaja } from "../entities/MovimientoCajas";
import { Negocio } from "../entities/Negocio";
import { ParametroSistema } from "../entities/ParametrosSistema";
import { Producto } from "../entities/Producto";
import { Servicio } from "../entities/Servicio";
import { TipoMovimientoCaja } from "../entities/TipoMovimientoCaja";
import { Venta } from "../entities/Venta";
import { facturarSRI, generarComprobanteSimple } from "./FacturarSriService";
import { AbrirCajaDatos, RegistrarMovimientoCajaDatos, ItemVentaDatos,RegistrarVenta, CerrarCajaDatos} from "../interfaces/CajaInterfaces";
import { EntityManager, In } from "typeorm"; // Importar 'In' para consultas WHERE IN


/**
 * Servicio para manejar las operaciones de la entidad Caja.,
 */

/**
 */
export const abrirCaja = async (datos: AbrirCajaDatos): Promise<Caja> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones básicas de campos obligatorios
      if (!datos.id_colaborador) {
        throw new Error("El ID del colaborador es obligatorio para abrir la caja.");
      }
      if (!datos.id_negocio) {
        throw new Error("El ID del negocio es obligatorio para abrir la caja.");
      }

      // 2. Verificar existencia y estado del colaborador
      const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador);
      const colaborador = await colaboradorRepository.findOne({
        where: { id_usuario: datos.id_colaborador, id_negocio: datos.id_negocio },
        relations: ['usuario', 'negocio'],
      });

      if (!colaborador) {
        throw new Error(`Colaborador con ID de usuario ${datos.id_colaborador} no encontrado para el negocio.`);
      }

      if (colaborador.activo === false) {
        throw new Error(`El colaborador '${colaborador.usuario?.nombre || datos.id_colaborador}' está inactivo y no puede abrir una caja.`);
      }

      // 3. Verificar existencia del negocio
      const negocioRepository = transactionalEntityManager.getRepository(Negocio);
      const negocio = await negocioRepository.findOne({
        where: { id: datos.id_negocio },
      });

      if (!negocio) {
        throw new Error(`Negocio con ID ${datos.id_negocio} no encontrado.`);
      }

      if (negocio.activo === 0) {
        console.log(`[abrirCaja] Error de Estado: Negocio '${negocio.nombre}' está inactivo.`);
        throw new Error(`El negocio '${negocio.nombre}' está inactivo y no puede tener cajas abiertas.`);
      }

      // Validación de horario de apertura
      if (negocio.horario_apertura) {
        const [horas, minutos, segundos] = negocio.horario_apertura.split(':').map(Number);
        const ahora = new Date();
        const horaAperturaNegocio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horas, minutos, segundos);

        const diezMinutosAntes = new Date(horaAperturaNegocio.getTime() - (10 * 60 * 1000));
        const diezMinutosDespues = new Date(horaAperturaNegocio.getTime() + (10 * 60 * 1000));

        console.log(`[abrirCaja] Horario de apertura del negocio: ${negocio.horario_apertura}`);
        console.log(`[abrirCaja] Ventana permitida: ${diezMinutosAntes.toLocaleTimeString()} - ${diezMinutosDespues.toLocaleTimeString()}`);
        console.log(`[abrirCaja] Hora actual: ${ahora.toLocaleTimeString()}`);

        if (ahora < diezMinutosAntes || ahora > diezMinutosDespues) {
          throw new Error(`La caja solo puede ser abierta 10 minutos antes o después de la hora de apertura del negocio (${negocio.horario_apertura}).`);
        }
        console.log("[abrirCaja] Horario de apertura de caja dentro del rango permitido.");
      } else {
        console.warn("[abrirCaja] Advertencia: Horario de apertura del negocio no definido. No se aplicó la validación de horario de apertura.");
      }

      // 4. Verificar si ya existe una caja ABIERTA para este colaborador en este negocio
      const cajaRepository = transactionalEntityManager.getRepository(Caja);
      const cajaAbiertaExistente = await cajaRepository.findOne({
        where: {
          id_Colaborador: colaborador.id,
          id_negocio: datos.id_negocio,
          estado: 1, // Asumiendo '1' para ABIERTA
        },
      });

      if (cajaAbiertaExistente) {
        throw new Error(`Ya existe una caja abierta para el colaborador ${colaborador.usuario?.nombre || datos.id_colaborador} en el negocio '${negocio.nombre}'. Cierre la caja actual antes de abrir una nueva.`);
      }

      // 5. Obtener el tipo de movimiento 'Apertura de Caja'
      const tipoMovimientoCajaRepository = transactionalEntityManager.getRepository(TipoMovimientoCaja);
      const tipoMovimiento = await tipoMovimientoCajaRepository.findOne({
        where: { activo: 1, nombre: 'Apertura de Caja' },
      });

      if (!tipoMovimiento) {
        throw new Error(`No existe el tipo de movimiento para aperturar la caja.`);
      }

      // 6. Obtener el método de pago 'Efectivo' (más robusto buscar por nombre)
      const metodoPagoRepository = transactionalEntityManager.getRepository(MetodoPago);
      const metodoPago = await metodoPagoRepository.findOne({
        where: { activo: true, nombre: 'Efectivo' }, // Buscar por nombre para mayor claridad y robustez
      });

      if (!metodoPago) {
        throw new Error(`No existe el método de pago 'Efectivo' para aperturar la caja.`);
      }

      // 7. Crear la nueva instancia de Caja y GUARDARLA para obtener su ID
      const nuevaCaja = transactionalEntityManager.create(Caja, {
        id_Colaborador: colaborador.id,
        id_negocio: datos.id_negocio,
        fecha_apertura: new Date(),
        monto_inicial: datos.total_inicial_efectivo ?? 0.00,
        total_esperado: datos.total_inicial_efectivo ?? 0.00,
        total_real: datos.total_inicial_efectivo ?? 0.00,
        observaciones: datos.observaciones ?? null,
        estado: 1,
      });

      const cajaGuardada = await transactionalEntityManager.save(Caja, nuevaCaja); // ¡Guardar aquí para obtener el ID!
      
      // 8. Crear el movimiento de apertura de caja usando el ID de la caja guardada
      const nuevoMovimiento = transactionalEntityManager.create(MovimientoCaja, {
        id_caja: cajaGuardada.id, // Usamos el ID de la caja ya guardada
        monto: cajaGuardada.monto_inicial,
        id_tipo_movimiento_caja: tipoMovimiento.id,
        id_metodo_pago: metodoPago.id,
        id_venta: null, // Más apropiado usar null si no hay venta asociada
        detalle: 'Apertura de caja',
        tipo_transaccion: 'INGRESO', // Añadir el tipo de transacción
        fecha_movimiento: new Date(), // Añadir la fecha de movimiento
        observaciones: datos.observaciones || "Apertura de caja.", // Añadir observaciones
      });

      await transactionalEntityManager.save(MovimientoCaja, nuevoMovimiento); // Guardar el movimiento

      return cajaGuardada;
    } catch (error: unknown) {
      console.error("[abrirCaja] Error al abrir la caja:", error);
      throw new Error((error as Error).message || "No se pudo abrir la caja. Por favor, inténtalo de nuevo más tarde.");
    }
    // El bloque finally está vacío y se puede omitir.
  });
};

export const cerrarCaja = async (datos: CerrarCajaDatos): Promise<Caja> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones básicas de campos obligatorios para el cierre.
      if (!datos.id_caja) {
        console.error("[cerrarCaja] Error: El ID de la caja es obligatorio para cerrarla.");
        throw new Error("El ID de la caja es obligatorio para cerrarla.");
      }

      if (datos.total_final_efectivo === undefined || datos.total_final_efectivo === null) {
        console.error("[cerrarCaja] Error: 'total_final_efectivo' es obligatorio para cerrar la caja y realizar la conciliación.");
        throw new Error("'total_final_efectivo' es obligatorio para cerrar la caja y realizar la conciliación.");
      }

      // 2. Obtener los repositorios de las entidades necesarias.
      const cajaRepository = transactionalEntityManager.getRepository(Caja);
      const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador);
      const movimientoCajaRepository = transactionalEntityManager.getRepository(MovimientoCaja);

      // Buscar la caja por su ID y cargar las relaciones con el colaborador y negocio.
      const caja = await cajaRepository.findOne({
        where: { id: datos.id_caja },
        relations: ['Colaborador', 'negocio']
      });

      if (!caja) {
        console.error(`[cerrarCaja] Error: Caja con ID ${datos.id_caja} no encontrada.`);
        throw new Error(`Caja con ID ${datos.id_caja} no encontrada.`);
      }

      // 3. Verificar el estado actual de la caja.
      if (caja.estado !== 1) { // 1 = Abierta
        const estadoCaja = caja.estado === 0 ? "cerrada" : "en un estado desconocido";
        console.error(`[cerrarCaja] Error: La caja con ID ${datos.id_caja} ya está ${estadoCaja}.`);
        throw new Error(`La caja con ID ${datos.id_caja} no está abierta o ya ha sido cerrada.`);
      }

      // 4. Validaciones adicionales de seguridad (opcional).
      let colaboradorQueCierra: Colaborador | null = null;
      if (datos.id_colaborador) {
        colaboradorQueCierra = await colaboradorRepository.findOne({
          where: { id_usuario: datos.id_colaborador, id_negocio: caja.id_negocio },
        });

        if (!colaboradorQueCierra) {
          console.error(`[cerrarCaja] Error: Colaborador con ID de usuario ${datos.id_colaborador} no encontrado para el negocio de la caja.`);
          throw new Error(`El colaborador con ID de usuario ${datos.id_colaborador} no está asociado al negocio de esta caja.`);
        }

        if (caja.id_Colaborador !== colaboradorQueCierra.id) {
          console.error(`[cerrarCaja] Error de autorización: El colaborador que intenta cerrar la caja (ID de usuario: ${datos.id_colaborador}) no coincide con el colaborador que la abrió (ID de colaborador: ${caja.id_Colaborador}).`);
          throw new Error(`El colaborador que intenta cerrar la caja no es quien la abrió.`);
        }
      }

      if (datos.id_negocio && caja.id_negocio !== datos.id_negocio) {
        console.error(`[cerrarCaja] Error de negocio: El negocio especificado (${datos.id_negocio}) no coincide con el negocio de la caja abierta (ID de negocio: ${caja.id_negocio}).`);
        throw new Error(`El negocio especificado no coincide con el negocio de la caja abierta.`);
      }

      // Obtener el colaborador que abrió la caja para obtener su porcentaje_ganancia como fallback
      const colaboradorDeLaCaja = await colaboradorRepository.findOne({
        where: { id: caja.id_Colaborador },
      });

      if (!colaboradorDeLaCaja) {
        console.error(`[cerrarCaja] Error: No se encontró al colaborador con ID ${caja.id_Colaborador} asociado a la caja.`);
        throw new Error(`No se encontró el colaborador que abrió esta caja.`);
      }

      // Porcentaje de ganancia del colaborador de la caja, usado como fallback si el servicio no tiene uno específico.
      const porcentajeGananciaColaboradorFallback = colaboradorDeLaCaja.porcentaje_ganancia || 0;


      // 5. Calcular el 'total_sistema' a partir de los movimientos de caja y las comisiones de servicios.
      const movimientosCaja = await movimientoCajaRepository.find({
        where: {
          id_caja: caja.id,
          //anulado: 0 // Solo movimientos no anulados
        },
        relations: [
          'tipoMovimientoCaja',
          'ventas',                 // Carga la relación 'ventas' en MovimientoCaja (objeto Venta)
          'ventas.detalles',        // Carga los 'detalles' de cada 'venta' (array de DetalleVenta)
          'ventas.detalles.servicio' // Carga el 'servicio' de cada 'detalle' (objeto Servicio)
        ]
      });

      

      const cajaCerrada = await transactionalEntityManager.save(Caja, caja);

      const tipoMovimientoCajaRepository = transactionalEntityManager.getRepository(TipoMovimientoCaja);
      const tipoMovimiento = await tipoMovimientoCajaRepository.findOne({
        where: { activo: 1, nombre: 'Cierre de Caja' },
      });

      if (!tipoMovimiento) {
        throw new Error(`No existe el tipo de movimiento para aperturar la caja.`);
      }

      // 6. Obtener el método de pago 'Efectivo' (más robusto buscar por nombre)
      const metodoPagoRepository = transactionalEntityManager.getRepository(MetodoPago);
      const metodoPago = await metodoPagoRepository.findOne({
        where: { activo: true, nombre: 'Efectivo' }, // Buscar por nombre para mayor claridad y robustez
      });

      if (!metodoPago) {
        throw new Error(`No existe el método de pago 'Efectivo' para aperturar la caja.`);
      }

      let totalCalculadoPorSistema = caja.monto_inicial;
      let totalComisionesGeneradas = 0;

      for (const movimiento of movimientosCaja) {
        // Verificar si es un movimiento de Ingreso (basado en el nombre del tipo de movimiento)
        if (movimiento.tipoMovimientoCaja?.nombre === 'Ingreso') {
          totalCalculadoPorSistema += movimiento.monto;

          // Ahora 'movimiento.ventas' es de tipo 'Venta | null' y TypeScript sabrá que tiene 'detalles'
          if (movimiento.ventas && movimiento.ventas.detalles && movimiento.ventas.detalles.length > 0) {
            for (const detalle of movimiento.ventas.detalles) { // Accede a los detalles de la venta
              // Verificar si el detalle de venta corresponde a un servicio y si el servicio está cargado
              if (detalle.id_servicio !== null && detalle.servicio) {
                let porcentajeComision = 0;

                // Priorizar el porcentaje de comisión definido en el servicio
                if (detalle.servicio.porcentaje_comision_colaborador !== null && detalle.servicio.porcentaje_comision_colaborador > 0) {
                  porcentajeComision = detalle.servicio.porcentaje_comision_colaborador;
                } else {
                  // Si el servicio no tiene un porcentaje específico, usar el del colaborador de la caja
                  porcentajeComision = porcentajeGananciaColaboradorFallback;
                }

                // Calcular la comisión para este servicio
                const comisionPorServicio = detalle.subtotal * (porcentajeComision / 100);
                totalComisionesGeneradas += comisionPorServicio;
              }
            }
          }
        } else {
          // Si es un egreso, simplemente restar el monto.
          totalCalculadoPorSistema -= movimiento.monto;
        }
      }

      // Asignar los totales calculados y reales.
      caja.total_calculado = totalCalculadoPorSistema + caja.monto_inicial;
      caja.total_esperado = totalCalculadoPorSistema + caja.monto_inicial;
      caja.total_real = caja.total_real|| 0;
      caja.total_comisiones_generadas = totalComisionesGeneradas;

      // 6. Calcular sobrante y faltante.
      const diferencia = datos.total_final_efectivo - caja.total_calculado;

      if (diferencia > 0) {
        caja.sobrante = diferencia;
        caja.faltante = 0.00;
      } else if (diferencia < 0) {
        caja.faltante = Math.abs(diferencia);
        caja.sobrante = 0.00;
      } else {
        caja.sobrante = 0.00;
        caja.faltante = 0.00;
      }

      // 7. Actualizar los campos de la caja para reflejar el cierre.
      caja.fecha_cierre = new Date();
      caja.estado = 0; // Cambia el estado de la caja a 'cerrada' (0).

      if (datos.observaciones !== undefined) {
        caja.observaciones = datos.observaciones;
      }
      const cajaFinalizada = await transactionalEntityManager.save(Caja, caja);
      // 8. Guarda los cambios de la caja en la base de datos dentro de la transacción.
      
      // 8. Crear el movimiento de apertura de caja usando el ID de la caja guardada
      const nuevoMovimiento = transactionalEntityManager.create(MovimientoCaja, {
        id_caja: cajaCerrada.id, // Usamos el ID de la caja ya guardada
        monto: cajaCerrada.total_esperado,
        id_tipo_movimiento_caja: tipoMovimiento.id,
        id_metodo_pago: metodoPago.id,
        id_venta: null, // Más apropiado usar null si no hay venta asociada
        detalle: 'Cierre  de caja',
        tipo_transaccion: 'EGRESO', // Añadir el tipo de transacción
        fecha_movimiento: new Date(), // Añadir la fecha de movimiento
        observaciones: datos.observaciones || "Cierre  de caja", // Añadir observaciones
      });

      await transactionalEntityManager.save(MovimientoCaja, nuevoMovimiento); // Guardar el movimiento

      console.log(`[cerrarCaja] Caja con ID ${caja.id} cerrada exitosamente. Total comisiones generadas: ${totalComisionesGeneradas.toFixed(2)}.`);
      return cajaCerrada;

    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "No se pudo cerrar la caja. Por favor, inténtalo de nuevo más tarde.";
      console.error(`[cerrarCaja] Error al cerrar la caja: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  });
};



export const obtenerCajaActivaPorColaboradorYNegocio = async (idColaborador: number, idNegocio: number): Promise<Caja | null> => {
  try {
    const cajaRepository = AppDataSource.getRepository(Caja);
    const cajaActiva = await cajaRepository.findOne({
      where: {
        id_Colaborador: idColaborador, 
        id_negocio: idNegocio,
        estado: 1,
      },
      relations: ['colaborador', 'negocio'], // Corregido: 'Colaborador' a 'colaborador' (minúscula)
    });
    return cajaActiva;
  } catch (error: unknown) {
    console.error("Error en CajaService.obtenerCajaActivaPorColaboradorYNegocio:", (error as Error).message);
    throw new Error("No se pudo verificar el estado de la caja. Por favor, inténtalo de nuevo más tarde.");
  }
};



export const registrarMovimientoCaja = async (datos: RegistrarMovimientoCajaDatos): Promise<MovimientoCaja> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Validaciones básicas de campos obligatorios
      console.log("[registrarMovimientoCaja] Iniciando validaciones para movimiento:", datos);

      if (!datos.id_caja) {
        throw new Error("El ID de la caja es obligatorio para registrar un movimiento.");
      }
      if (datos.monto <= 0) {
        throw new Error("El monto del movimiento debe ser un valor positivo.");
      }
      // La validación del 'tipo' como string se remueve, ahora es un ID.
      if (!datos.tipo) {
        throw new Error("El ID del tipo de movimiento es obligatorio.");
      }
      if (!datos.id_colaborador) {
        throw new Error("El ID del colaborador es obligatorio para registrar un movimiento.");
      }
      if (!datos.id_metodo_pago) {
        throw new Error("El ID del método de pago es obligatorio para registrar un movimiento.");
      }

      // 2. Verificar existencia y estado de la Caja
      const cajaRepository = transactionalEntityManager.getRepository(Caja);
      const caja = await cajaRepository.findOne({
        where: { id: datos.id_caja, estado: 1 }, // 1 siginifa caja abierta 
      });

      if (!caja) {
        throw new Error(`Caja con ID ${datos.id_caja} no encontrada o no está abierta.`);
      }
      console.log(`[registrarMovimientoCaja] Caja ${caja.id} encontrada y abierta.`);

      // 3. Verificar existencia y estado del Colaborador
      const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador);
      const colaborador = await colaboradorRepository.findOne({
        where: { id_usuario: datos.id_colaborador, id_negocio: caja.id_negocio },
        relations: ['usuario'],
      });

      if (!colaborador) {
        throw new Error(`Colaborador con ID de usuario ${datos.id_colaborador} no encontrado para el negocio de la caja.`);
      }
      if (colaborador.activo === false) {
        throw new Error(`El colaborador '${colaborador.usuario?.nombre || datos.id_colaborador}' está inactivo y no puede registrar movimientos.`);
      }
      console.log(`[registrarMovimientoCaja] Colaborador ${colaborador.id} (${colaborador.usuario?.nombre}) encontrado y activo.`);

      // 4. Verificar existencia y estado del Método de Pago
      const metodoPagoRepository = transactionalEntityManager.getRepository(MetodoPago);
      const metodoPago = await metodoPagoRepository.findOne({
        where: { id: datos.id_metodo_pago, activo: true },
      });

      if (!metodoPago) {
        throw new Error(`Método de pago con ID ${datos.id_metodo_pago} no encontrado o inactivo.`);
      }
      console.log(`[registrarMovimientoCaja] Método de pago '${metodoPago.nombre}' encontrado y activo.`);

      // 5. Obtener el TipoMovimientoCaja para determinar si es INGRESO o EGRESO
      // Ahora se busca por el ID proporcionado en `datos.tipo`
      const tipoMovimientoCajaRepository = transactionalEntityManager.getRepository(TipoMovimientoCaja);
      const tipoMovimiento = await tipoMovimientoCajaRepository.findOne({
        where: { id: datos.tipo, activo:1},
      });

      if (!tipoMovimiento) {
        throw new Error(`Tipo de movimiento con ID ${datos.tipo} no encontrado en la base de datos.`);
      }
      // Es crucial que 'TipoMovimientoCaja' tenga un campo (ej. 'codigo')
      // que te permita saber si el ID corresponde a un INGRESO o a un EGRESO.
      // Asumo que tienes un campo 'codigo' que es 'INGRESO' o 'EGRESO'.
      if (!['INGRESO', 'EGRESO'].includes(tipoMovimiento.codigo)) {
        throw new Error(`El tipo de movimiento con ID ${datos.tipo} no es un 'INGRESO' o 'EGRESO' válido para la caja.`);
      }
      console.log(`[registrarMovimientoCaja] Tipo de movimiento ${tipoMovimiento.nombre} (Código: ${tipoMovimiento.codigo}) encontrado.`);


      // 6. Crear la nueva instancia de MovimientoCaja
      const nuevoMovimiento = transactionalEntityManager.create(MovimientoCaja, {
        id_caja: caja.id,
        monto: datos.monto,
        id_tipo_movimiento_caja: datos.tipo, // Directamente el ID del tipo de movimiento
        id_metodo_pago: metodoPago.id,
        id_factura: datos.id_factura ?? null, // Ya es number | null en la interfaz
        detalle: datos.detalle ?? null, // Ya es string | null en la interfaz
        // 'creado_en' es @CreateDateColumn, la DB lo gestiona automáticamente
      });
      console.log("[registrarMovimientoCaja] Creando nuevo movimiento:", nuevoMovimiento);

      // 7. Actualizar el total_real de la Caja
      // La lógica de suma/resta se basa ahora en el `codigo` del TipoMovimientoCaja
      if (tipoMovimiento.codigo === 'INGRESO') {
        caja.total_real += datos.monto;
        console.log(`[registrarMovimientoCaja] Tipo: INGRESO. Nuevo total real de caja: ${caja.total_real}`);
      } else if (tipoMovimiento.codigo === 'EGRESO') {
        if (caja.total_real < datos.monto) {
          console.warn(`[registrarMovimientoCaja] Advertencia: EGRESO de ${datos.monto} excede el total actual de caja ${caja.total_real}.`);
          // Opcional: throw new Error("Monto de EGRESO excede el efectivo actual en caja.");
        }
        caja.total_real -= datos.monto;
        console.log(`[registrarMovimientoCaja] Tipo: EGRESO. Nuevo total real de caja: ${caja.total_real}`);
      } else {
        // Esto debería ser capturado por la validación anterior, pero es un fallback seguro
        throw new Error(`Tipo de movimiento inválido '${tipoMovimiento.codigo}'. Solo 'INGRESO' o 'EGRESO' son permitidos para el cálculo de caja.`);
      }

      // 8. Guardar los cambios en la Caja y el nuevo MovimientoCaja
      await transactionalEntityManager.save(Caja, caja);
      const movimientoGuardado = await transactionalEntityManager.save(MovimientoCaja, nuevoMovimiento);
      console.log("[registrarMovimientoCaja] Movimiento y caja actualizados exitosamente.");

      return movimientoGuardado;

    } catch (error: unknown) {
      console.error("[registrarMovimientoCaja] Error al registrar movimiento de caja:", error);
      throw new Error((error as Error).message || "No se pudo registrar el movimiento de caja. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};


export const _registrarMovimientoCajaInterno = async (
  transactionalEntityManager: EntityManager,
  datos: RegistrarMovimientoCajaDatos
): Promise<MovimientoCaja> => {
  try {
    console.log("[_registrarMovimientoCajaInterno] Iniciando validaciones para movimiento:", datos);

    // 1. Validaciones básicas de campos obligatorios
    if (!datos.id_caja) {
      throw new Error("El ID de la caja es obligatorio para registrar un movimiento.");
    }
    if (datos.monto <= 0) {
      throw new Error("El monto del movimiento debe ser un valor positivo.");
    }
    if (!datos.tipo) {
      throw new Error("El ID del tipo de movimiento es obligatorio.");
    }
    if (!datos.id_colaborador) {
      throw new Error("El ID del colaborador es obligatorio para registrar un movimiento.");
    }
    if (!datos.id_metodo_pago) {
      throw new Error("El ID del método de pago es obligatorio para registrar un movimiento.");
    }

    // 2. Verificar existencia y estado de la Caja
    const cajaRepository = transactionalEntityManager.getRepository(Caja);
    const caja = await cajaRepository.findOne({
      where: { id: datos.id_caja, estado: 1 }, // 1 siginifa caja abierta
    });

    if (!caja) {
      throw new Error(`Caja con ID ${datos.id_caja} no encontrada o no está abierta.`);
    }
    console.log(`[_registrarMovimientoCajaInterno] Caja ${caja.id} encontrada y abierta.`);

    // 3. Verificar existencia y estado del Colaborador
    const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador);
   

    const colaborador = await colaboradorRepository.findOne({
        where: { id: datos.id_colaborador, id_negocio: caja.id_negocio , activo:true},
        relations: ['usuario'],
    });

    if (!colaborador) {
      throw new Error(`Colaborador con ID de usuario ${datos.id_colaborador} no encontrado para el negocio de la caja. ${caja.id_negocio}`);
    }
    if (colaborador.activo === false) {
      throw new Error(`El colaborador '${colaborador.usuario?.nombre || datos.id_colaborador}' está inactivo y no puede registrar movimientos.`);
    }
    console.log(`[_registrarMovimientoCajaInterno] Colaborador ${colaborador.id} (${colaborador.usuario?.nombre}) encontrado y activo.`);

    // 4. Verificar existencia y estado del Método de Pago
    const metodoPagoRepository = transactionalEntityManager.getRepository(MetodoPago);
    const metodoPago = await metodoPagoRepository.findOne({
      where: { id: datos.id_metodo_pago, activo: true },
    });
    

    if (!metodoPago) {
      throw new Error(`Método de pago con ID ${datos.id_metodo_pago} no encontrado o inactivo.`);
    }
    console.log(`[_registrarMovimientoCajaInterno] Método de pago '${metodoPago.nombre}' encontrado y activo.`);

    // 5. Obtener el TipoMovimientoCaja para determinar si es INGRESO o EGRESO
    const tipoMovimientoCajaRepository = transactionalEntityManager.getRepository(TipoMovimientoCaja);
    const tipoMovimiento = await tipoMovimientoCajaRepository.findOne({
      where: { id: datos.tipo, activo: 1 },
    });

    if (!tipoMovimiento) {
      throw new Error(`Tipo de movimiento con ID ${datos.tipo} no encontrado en la base de datos.`);
    }
    if (!['INGRESO', 'EGRESO'].includes(tipoMovimiento.codigo)) {
      throw new Error(`El tipo de movimiento con ID ${datos.tipo} no es un 'INGRESO' o 'EGRESO' válido para la caja.`);
    }
    console.log(`[_registrarMovimientoCajaInterno] Tipo de movimiento ${tipoMovimiento.nombre} (Código: ${tipoMovimiento.codigo}) encontrado.`);

    // 6. Crear la nueva instancia de MovimientoCaja
    const nuevoMovimiento = transactionalEntityManager.create(MovimientoCaja, {
      id_caja: caja.id,
      monto: datos.monto,
      id_tipo_movimiento_caja: datos.tipo,
      id_metodo_pago: metodoPago.id,
      id_venta: datos.id_venta,
      detalle: datos.detalle ?? null,
    });
    console.log("[_registrarMovimientoCajaInterno] Creando nuevo movimiento:", nuevoMovimiento);


    if(!caja){
      throw new Error(`Problemas con la caja `);
    }
    // 7. Actualizar el total_real de la Caja
    if (tipoMovimiento.codigo === 'INGRESO') {
      caja.total_real! += datos.monto || 0;
      console.log(`[_registrarMovimientoCajaInterno] Tipo: INGRESO. Nuevo total real de caja: ${caja.total_real}`);
    } else if (tipoMovimiento.codigo === 'EGRESO') {
      if (caja.total_real! < datos.monto) {
        console.warn(`[_registrarMovimientoCajaInterno] Advertencia: EGRESO de ${datos.monto} excede el total actual de caja ${caja.total_real}.`);
        // Opcional: throw new Error("Monto de EGRESO excede el efectivo actual en caja.");
      }
      caja.total_real! -= datos.monto ;
      console.log(`[_registrarMovimientoCajaInterno] Tipo: EGRESO. Nuevo total real de caja: ${caja.total_real}`);
    } else {
      throw new Error(`Tipo de movimiento inválido '${tipoMovimiento.codigo}'. Solo 'INGRESO' o 'EGRESO' son permitidos para el cálculo de caja.`);
    }

    const cajaCerrada = await transactionalEntityManager.save(Caja, caja);

    // 8. Guardar los cambios en la Caja y el nuevo MovimientoCaja
    await transactionalEntityManager.save(Caja, caja);
    const movimientoGuardado = await transactionalEntityManager.save(MovimientoCaja, nuevoMovimiento);
    console.log("[_registrarMovimientoCajaInterno] Movimiento y caja actualizados exitosamente.");

    return movimientoGuardado;

  } catch (error: unknown) {
    console.error("[_registrarMovimientoCajaInterno] Error al registrar movimiento de caja:", error);
    // Re-lanzamos el error para que la transacción padre lo capture y haga rollback
    throw new Error((error as Error).message || "No se pudo registrar el movimiento de caja interno. Por favor, inténtalo de nuevo más tarde.");
  }
};


const validarDatosInicialesVenta = (datosVenta: RegistrarVenta): void => {
  if (!datosVenta.id_caja || !datosVenta.id_colaborador || !datosVenta.id_metodo_pago_principal || !datosVenta.items || datosVenta.items.length === 0) {
    throw new Error("Datos de venta incompletos. Se requieren ID de caja, colaborador, método de pago principal y al menos un ítem.");
  }
  if (datosVenta.items.some(item => item.cantidad <= 0)) {
    // Solo validamos cantidad, el precio unitario puede ser 0 en casos especiales (descuentos totales) o se determinará.
    throw new Error("La cantidad de todos los ítems debe ser un valor positivo.");
  }
  console.log("[validarDatosInicialesVenta] Validaciones iniciales completadas.");
};


const verificarEntidadesExistentes = async (
  transactionalEntityManager: EntityManager,
  datosVenta: RegistrarVenta
): Promise<{ caja: Caja; colaborador: Colaborador; metodoPago: MetodoPago; tipoMovimientoVenta: TipoMovimientoCaja }> => {
  const cajaRepository = transactionalEntityManager.getRepository(Caja);
  const caja = await cajaRepository.findOne({
    where: { id: datosVenta.id_caja, estado: 1 },
  });
  if (!caja) {
    throw new Error(`Caja con ID ${datosVenta.id_caja} no encontrada o no está abierta para la venta.`);
  }
  console.log(`[verificarEntidadesExistentes] Caja ${caja.id} encontrada y abierta.`);

  const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador);
  const colaborador = await colaboradorRepository.findOne({
    where: { id: datosVenta.id_colaborador, id_negocio: caja.id_negocio },
    relations: ['usuario'],
  });
  if (!colaborador) {
    throw new Error(`Colaborador con ID ${datosVenta.id_colaborador} no encontrado para el negocio de la caja.`);
  }
  if (colaborador.activo === false) {
    throw new Error(`El colaborador '${(colaborador as any).usuario?.nombre || datosVenta.id_colaborador}' está inactivo y no puede registrar ventas.`);
  }
  console.log(`[verificarEntidadesExistentes] Colaborador ${colaborador.id} (${(colaborador as any).usuario?.nombre}) encontrado y activo.`);

  const metodoPagoRepository = transactionalEntityManager.getRepository(MetodoPago);
  const metodoPago = await metodoPagoRepository.findOne({
    where: { id: datosVenta.id_metodo_pago_principal, activo: true },
  });
  if (!metodoPago) {
    throw new Error(`Método de pago con ID ${datosVenta.id_metodo_pago_principal} no encontrado o inactivo para la venta.`);
  }
  console.log(`[verificarEntidadesExistentes] Método de pago '${metodoPago.nombre}' encontrado y activo.`);

  const tipoMovimientoCajaRepository = transactionalEntityManager.getRepository(TipoMovimientoCaja);
  const tipoMovimientoVenta = await tipoMovimientoCajaRepository.findOne({
    where: { codigo: 'INGRESO', nombre: 'Ingreso', activo: 1 },
  });
  if (!tipoMovimientoVenta) {
    throw new Error("Tipo de movimiento 'Venta' (INGRESO) no configurado en la base de datos o inactivo.");
  }
  console.log(`[verificarEntidadesExistentes] Tipo de movimiento para Venta (${tipoMovimientoVenta.nombre}) encontrado.`);

  return { caja, colaborador, metodoPago, tipoMovimientoVenta };
};


const prepararDetallesVentaYActualizarStock = async (
  transactionalEntityManager: EntityManager,
  datosVenta: RegistrarVenta,
  idNegocio: number
): Promise<{ totalSubtotal: number; detallesVenta: DetalleVenta[] }> => {
  let totalSubtotal = 0;
  const detallesVenta: DetalleVenta[] = [];
  const productoRepository = transactionalEntityManager.getRepository(Producto);
  const servicioRepository = transactionalEntityManager.getRepository(Servicio);

  for (const item of datosVenta.items) {
    let nombreItem: string;
    let idEntidad: number;
    let tipoEntidad: 'producto' | 'servicio';
    let precioUnitarioFinal: number;

    if (item.id_producto && item.id_servicio) {
      throw new Error("Cada ítem de venta no puede ser a la vez un producto y un servicio. Especifique solo uno.");
    }
    if (!item.id_producto && !item.id_servicio) {
      throw new Error("Cada ítem de venta debe especificar un 'id_producto' o un 'id_servicio'.");
    }
    if (item.cantidad <= 0) {
      throw new Error(`La cantidad para un ítem de venta debe ser mayor a 0. ID Producto/Servicio: ${item.id_producto || item.id_servicio}.`);
    }

    if (item.id_producto) {
      tipoEntidad = 'producto';
      const producto = await productoRepository.findOne({
        where: { id: item.id_producto, id_negocio: idNegocio, activo: 1 },
      });

      if (!producto) {
        throw new Error(`Producto con ID ${item.id_producto} no encontrado, inactivo o no pertenece a este negocio.`);
      }
      if (producto.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto '${producto.nombre}'. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}.`);
      }

      precioUnitarioFinal = item.precio_unitario ?? (producto.precio_descuento ?? producto.precio_promocion ?? producto.precio_venta);

      nombreItem = producto.nombre;
      idEntidad = producto.id!;

      producto.stock_actual -= item.cantidad;
      await transactionalEntityManager.save(Producto, producto);
      console.log(`[prepararDetallesVentaYActualizarStock] Stock actualizado para ${producto.nombre}. Nuevo stock: ${producto.stock_actual}`);

    } else { // item.id_servicio
      tipoEntidad = 'servicio';
      const servicio = await servicioRepository.findOne({
        where: { id: item.id_servicio!, id_negocio: idNegocio, activo: 1 },
      });

      if (!servicio) {
        throw new Error(`Servicio con ID ${item.id_servicio} no encontrado, inactivo o no pertenece a este negocio.`);
      }

      precioUnitarioFinal = item.precio_unitario ?? (servicio.precio_descuento ?? servicio.precio);

      nombreItem = servicio.nombre;
      idEntidad = servicio.id!;
      console.log(`[prepararDetallesVentaYActualizarStock] Servicio '${servicio.nombre}' agregado a la venta. No hay gestión de stock.`);
    }

    const detalle = transactionalEntityManager.create(DetalleVenta, {
      id_producto: tipoEntidad === 'producto' ? idEntidad : null,
      id_servicio: tipoEntidad === 'servicio' ? idEntidad : null,
      nombre_producto: nombreItem,
      cantidad: item.cantidad,
      precio_unitario: precioUnitarioFinal,
      subtotal: item.cantidad * precioUnitarioFinal,
    });
    detallesVenta.push(detalle);
    totalSubtotal += detalle.subtotal;
    console.log(`[prepararDetallesVentaYActualizarStock] Detalle de venta creado para ${nombreItem}. Subtotal: ${detalle.subtotal}`);
  }

  return { totalSubtotal, detallesVenta };
};

const calcularTotalesVenta = async (
  transactionalEntityManager: EntityManager,
  venta: Venta,
  totalSubtotal: number
): Promise<void> => {
  const ValorIvaCajaRepository = transactionalEntityManager.getRepository(ParametroSistema);
  const ValorIva = await ValorIvaCajaRepository.findOne({
    where: { nombre: 'IVA_PORCENTAJE', activo: 1 },
  });
  // Asegurarse de que tasaIVA sea un número y manejar el caso de que no exista el parámetro
  const tasaIVA = parseFloat(ValorIva?.valor_desarrollo ?? '0');

  venta.subtotal = parseFloat(totalSubtotal.toFixed(2));
  venta.iva = parseFloat((totalSubtotal * tasaIVA).toFixed(2));
  venta.total = parseFloat((venta.subtotal + venta.iva).toFixed(2));
  console.log(`[calcularTotalesVenta] Subtotal: ${venta.subtotal}, IVA: ${venta.iva}, Total: ${venta.total}`);
};


const guardarVentaYDetalles = async (
  transactionalEntityManager: EntityManager,
  nuevaVenta: Venta,
  detallesVenta: DetalleVenta[]
): Promise<Venta> => {
  const ventaGuardada = await transactionalEntityManager.save(Venta, nuevaVenta);
  console.log("[guardarVentaYDetalles] Venta guardada para obtener ID:", ventaGuardada.id);

  detallesVenta.forEach(detalle => detalle.id_venta = ventaGuardada.id!);
  await transactionalEntityManager.save(DetalleVenta, detallesVenta);
  ventaGuardada.detalles = detallesVenta;
  console.log("[guardarVentaYDetalles] Detalles de venta guardados y asociados a la venta.");

  return ventaGuardada;
};


const registrarMovimientoCajaVenta = async (
  transactionalEntityManager: EntityManager,
  ventaGuardada: Venta,
  datosVenta: RegistrarVenta,
  tipoMovimientoVenta: TipoMovimientoCaja,
  tipoComprobante: string
): Promise<MovimientoCaja> => {
  const datosMovimientoCaja: RegistrarMovimientoCajaDatos = {
    id_venta: ventaGuardada.id,
    id_caja: datosVenta.id_caja,
    monto: ventaGuardada.total,
    tipo: tipoMovimientoVenta.id!,
    id_colaborador: datosVenta.id_colaborador,
    id_metodo_pago: datosVenta.id_metodo_pago_principal,
    id_factura: ventaGuardada.id,
    detalle: datosVenta.observaciones_venta || `Venta #${ventaGuardada.id} - ${tipoComprobante}`,
  };

  const movimientoCaja = await _registrarMovimientoCajaInterno(transactionalEntityManager, datosMovimientoCaja);
  console.log("[registrarMovimientoCajaVenta] Movimiento de caja por venta registrado:", movimientoCaja);
  return movimientoCaja;
};

const pad = (num: string | number, size: number): string => {
  let s = String(num);
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
};



// --- Función principal de procesamiento de venta refactorizada ---



export const procesarVenta = async (datosVenta: RegistrarVenta): Promise<{
  DocumentoVenta: any; venta: Venta; movimientoCaja: MovimientoCaja 
}> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      console.log("[procesarVenta] Iniciando proceso de venta:", datosVenta);
      let comprobantePdfBase64: string | undefined;
      // 1. Validaciones iniciales
      validarDatosInicialesVenta(datosVenta);

      // 2. Verificar existencia de Entidades
      const { caja, colaborador, metodoPago, tipoMovimientoVenta } = await verificarEntidadesExistentes(
        transactionalEntityManager,
        datosVenta
      );

      // --- PASO CLAVE: Obtener códigos de establecimiento y punto de emisión ---
      const negocio = await transactionalEntityManager.findOne(Negocio, { where: { id: caja.id_negocio } });
      if (!negocio) {
        throw new Error("No se encontró el negocio asociado a la caja.");
      }

      const codigoEstablecimiento = negocio.codigo_establecimiento; // EEE
      const codigoPuntoEmisionMovil = colaborador.codigo_punto_emision_movil; // PPP

      if (!codigoEstablecimiento || !codigoPuntoEmisionMovil) {
        throw new Error("Códigos de establecimiento o punto de emisión no definidos para generar el comprobante.");
      }
      // --------------------------------------------------------------------------

      // 3. Determinar el tipo de comprobante
      const tipoComprobante = datosVenta.requiere_factura_formal ? 'FACTURA' : 'COMPROBANTE_SIMPLE';
      console.log(`[procesarVenta] Tipo de comprobante determinado: ${tipoComprobante}`);

      // --- PASO CLAVE: Generar el numero_comprobante secuencial ---
      let comprobanteCounter = await transactionalEntityManager.findOne(ComprobanteCounter, {
        where: {
          codigo_establecimiento: codigoEstablecimiento,
          codigo_punto_emision_movil: codigoPuntoEmisionMovil,
        },
      });

      if (!comprobanteCounter) {
        // Si no existe el contador, crearlo e inicializarlo en 1
        comprobanteCounter = transactionalEntityManager.create(ComprobanteCounter, {
          codigo_establecimiento: codigoEstablecimiento,
          codigo_punto_emision_movil: codigoPuntoEmisionMovil,
          last_sequence_number: 1,
        });
      } else {
        // Si ya existe, incrementar el contador
        comprobanteCounter.last_sequence_number += 1;
      }

      // Guardar (insertar o actualizar) el contador DENTRO de la transacción
      await transactionalEntityManager.save(ComprobanteCounter, comprobanteCounter);

      const numeroSecuencial = pad(comprobanteCounter.last_sequence_number, 9);
      const numeroComprobanteGenerado = `${pad(codigoEstablecimiento, 3)}-${pad(codigoPuntoEmisionMovil, 3)}-${numeroSecuencial}`;
      console.log(`[procesarVenta] Número de comprobante generado: ${numeroComprobanteGenerado}`);
      // ---------------------------------------------------------------

      // 4. Preparar la Venta inicial
      const nuevaVenta = transactionalEntityManager.create(Venta, {
        id_negocio: caja.id_negocio,
        id_cliente: datosVenta.id_cliente ?? null,
        id_colaborador: datosVenta.id_colaborador,
        id_metodo_pago_principal: metodoPago.id,
        tipo_comprobante: tipoComprobante,
        numero_comprobante: numeroComprobanteGenerado, // <-- ¡Aquí se usa el número generado!
        estado: 'EMITIDA', // Por ahora EMITIDA, luego se podría cambiar a 'PENDIENTE_SRI' o similar
        fecha_venta: new Date(),
        observaciones: datosVenta.observaciones_venta ?? '',
        subtotal: 0.00,
        iva: 0.00,
        total: 0.00,
        detalles: [],
      });
      console.log("[procesarVenta] Instancia de Venta creada (pre-cálculo):", nuevaVenta);

      // 5. Procesar DetalleVenta y Actualizar Stock
      const { totalSubtotal, detallesVenta } = await prepararDetallesVentaYActualizarStock(
        transactionalEntityManager,
        datosVenta,
        caja.id_negocio!
      );

      // 6. Calcular Subtotal, IVA y Total de la Venta
      await calcularTotalesVenta(transactionalEntityManager, nuevaVenta, totalSubtotal);

      // 7. Guardar la Venta y sus Detalles
      const ventaGuardada = await guardarVentaYDetalles(transactionalEntityManager, nuevaVenta, detallesVenta);

      // --- Lógica para Facturación SRI ---
      if (datosVenta.requiere_factura_formal) {
        console.log("[procesarVenta] La venta requiere factura formal. Llamando a facturarSRI...");
        const sriResult = await facturarSRI(
          transactionalEntityManager,
          ventaGuardada,
          negocio,
          colaborador,
          detallesVenta // Pasamos los detalles de la venta al servicio SRI
        );

        if (!sriResult) {
          // Aquí manejarías un error si la facturación SRI falla
          throw new Error("La facturación electrónica al SRI falló.");
        }
        // En este punto, podrías actualizar el estado de `ventaGuardada`
        // por ejemplo: ventaGuardada.estado = 'AUTORIZADA_SRI';
        // await transactionalEntityManager.save(Venta, ventaGuardada);
      }else{

          console.log("[procesarVenta] La venta NO requiere factura formal. Generando comprobante simple...");
          comprobantePdfBase64 = await generarComprobanteSimple(
            transactionalEntityManager,
            ventaGuardada,
            negocio,
            colaborador,
            detallesVenta
          );
          if (comprobantePdfBase64) {
            // El PDF se generó exitosamente, puedes guardarlo o enviarlo
            console.log("Comprobante PDF generado exitosamente.");
            // Aquí puedes almacenar pdfBase64 en la base de datos o enviarlo.
          } else {
            // Hubo un error al generar el PDF, pero la venta se completó
            console.warn("No se pudo generar el comprobante PDF para la venta. La venta sigue siendo válida.");
            // Podrías registrar este evento en un sistema de logs o notificar a un administrador.
          }


      }
      // ------------------------------------

      // 8. Registrar el movimiento de caja
      const movimientoCaja = await registrarMovimientoCajaVenta(
        transactionalEntityManager,
        ventaGuardada,
        datosVenta,
        tipoMovimientoVenta,
        tipoComprobante
      );

      // 9. Retornar la Venta y el Movimiento de Caja
      return { venta: ventaGuardada, movimientoCaja: movimientoCaja, DocumentoVenta : comprobantePdfBase64 };

    } catch (error: unknown) {
      console.error("[procesarVenta] Error al procesar la venta:", error);
      throw new Error((error as Error).message || "No se pudo procesar la venta. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};

