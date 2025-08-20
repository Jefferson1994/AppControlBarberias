import { AppDataSource } from "../config/data-source";
import { Caja } from "../entities/Cajas"; 
import { Colaborador } from "../entities/Colaborador"; 
import { Negocio } from "../entities/Negocio";
import { AbrirCajaDatos } from "../interfaces/CajaInterfaces";
import { In } from "typeorm"; // Importar 'In' para consultas WHERE IN

/**
 * Servicio para manejar las operaciones de la entidad Caja.
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
      
      const colaboradorRepository = transactionalEntityManager.getRepository(Colaborador); // Usamos Colaborador aquí, que es tu entidad para Colaborador
      const colaborador = await colaboradorRepository.findOne({
        where: { id_usuario: datos.id_colaborador, id_negocio: datos.id_negocio }, // Buscar por id_usuario y id_negocio
        relations: ['usuario', 'negocio'], // Cargar el usuario y el negocio para más detalles en errores
      });
      
      if (!colaborador) {
        
        throw new Error(`Colaborador con ID ${datos.id_colaborador} no encontrado.`); 
      }
      
      if (colaborador.activo === false) { // Asumiendo 'false' para inactivo
        
        throw new Error(`El colaborador '${colaborador.usuario?.nombre || datos.id_colaborador}' está inactivo y no puede abrir una caja.`); // Cambiado a colaborador
      }
      

      // 3. Verificar existencia del negocio
      
      const negocioRepository = transactionalEntityManager.getRepository(Negocio);
      const negocio = await negocioRepository.findOne({
        where: { id: datos.id_negocio },
      });

      if (!negocio) {
        
        throw new Error(`Negocio con ID ${datos.id_negocio} no encontrado.`);
      }
      
      if (negocio.activo === 0) { // Asumiendo '0' para inactivo
        console.log(`[abrirCaja] Error de Estado: Negocio '${negocio.nombre}' está inactivo.`);
        throw new Error(`El negocio '${negocio.nombre}' está inactivo y no puede tener cajas abiertas.`);
      }

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
          estado: 1, 
        },
      });

      if (cajaAbiertaExistente) {
        
        throw new Error(`Ya existe una caja abierta para el colaborador ${colaborador.usuario?.nombre || datos.id_colaborador} en el negocio '${negocio.nombre}'. Cierre la caja actual antes de abrir una nueva.`); // Cambiado a colaborador
      }

      if(negocio.horario_apertura){

      }
      

      // 5. Crear la nueva instancia de Caja
      
      const nuevaCaja = transactionalEntityManager.create(Caja, {
        id_Colaborador: colaborador.id, // CORREGIDO: Usar id_Colaborador (MAYÚSCULA) para coincidir con la entidad Caja
        id_negocio: datos.id_negocio,
        fecha_apertura: new Date(), // Se establecerá con la fecha y hora actual
        total_esperado: datos.total_inicial_efectivo ?? 0.00, // Usar 0 si no se proporciona
        total_real: datos.total_inicial_efectivo ?? 0.00,    // El real es igual al esperado al inicio
        observaciones: datos.observaciones ?? null,
        estado: 1, 
      });
      
      const cajaGuardada = await transactionalEntityManager.save(Caja, nuevaCaja);
      
      return cajaGuardada;
    } catch (error: unknown) {
      
      throw new Error((error as Error).message || "No se pudo abrir la caja. Por favor, inténtalo de nuevo más tarde.");
    } finally {
      
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


// Puedes añadir otras funciones del servicio de caja aquí (registrarMovimiento, cerrarCaja, etc.)
