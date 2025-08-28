import { AppDataSource } from "../config/data-source";
import { Reserva } from "../entities/Reserva";
import { Servicio } from "../entities/Servicio";
import { Cliente } from "../entities/Cliente";
import { Colaborador } from "../entities/Colaborador";
import { EstadoReserva } from "../entities/EstadoReserva";
import { QueryFailedError } from "typeorm";
import { addMinutes } from 'date-fns';

import { CrearReservaDatos } from "../interfaces/ReservaInterfaces";
import { Negocio } from "../entities/Negocio";

export class ReservaService {

  async crearReservaPendiente(datos: CrearReservaDatos): Promise<Reserva> {
    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      try {
        // 1. Validaciones de campos obligatorios
        if (!datos.id_cliente) throw new Error("El ID del cliente es obligatorio.");
        if (!datos.id_colaborador) throw new Error("El ID del colaborador es obligatorio.");
        if (!datos.id_servicio) throw new Error("El ID del servicio es obligatorio.");
        if (!datos.fecha_hora_inicio) throw new Error("La fecha y hora de inicio son obligatorias.");

        // 2. Verificar existencia del Cliente, Colaborador y Servicio
        const clienteExistente = await transactionalEntityManager.findOne(Cliente, { where: { id: datos.id_cliente } });
        if (!clienteExistente) throw new Error(`Cliente con ID ${datos.id_cliente} no encontrado.`);

        const colaboradorExistente = await transactionalEntityManager.findOne(Colaborador, { where: { id: datos.id_colaborador } });
        if (!colaboradorExistente) throw new Error(`Colaborador con ID ${datos.id_colaborador} no encontrado.`);

        const servicioExistente = await transactionalEntityManager.findOne(Servicio, { where: { id: datos.id_servicio } });
        if (!servicioExistente) throw new Error(`Servicio con ID ${datos.id_servicio} no encontrado.`);
        
        const fecha_hora_fin = addMinutes(datos.fecha_hora_inicio, servicioExistente.duracion_minutos);

        // 3. Validar la disponibilidad del colaborador
        const colaboradorOcupado = await transactionalEntityManager
          .createQueryBuilder(Reserva, 'reserva')
          .where('reserva.id_colaborador = :id_colaborador', { id_colaborador: datos.id_colaborador })
          .andWhere('reserva.fecha_hora_inicio < :fecha_hora_fin', { fecha_hora_fin })
          .andWhere('reserva.fecha_hora_fin > :fecha_hora_inicio', { fecha_hora_inicio: datos.fecha_hora_inicio })
          .andWhere('reserva.id_estado NOT IN (:...estados_no_bloqueantes)', { estados_no_bloqueantes: [3, 5] }) 
          .getOne();

        if (colaboradorOcupado) {
          throw new Error('El colaborador no está disponible en el horario seleccionado.');
        }
        
        // 4. Verificar que el estado 'Pendiente' exista
        const estadoPendiente = await transactionalEntityManager.findOne(EstadoReserva, { where: { nombre: 'Pendiente', activo: 1 } });
        if (!estadoPendiente) throw new Error('El estado "Pendiente" no está configurado o está inactivo.');

        // 5. Crear la nueva instancia de Reserva en estado Pendiente
        const reservaDataToCreate: Partial<Reserva> = {
          id_cliente: datos.id_cliente,
          id_colaborador: datos.id_colaborador,
          id_servicio: datos.id_servicio,
          id_estado: estadoPendiente.id,
          fecha_hora_inicio: datos.fecha_hora_inicio,
          fecha_hora_fin: fecha_hora_fin,
        };
        const nuevaReserva = transactionalEntityManager.create(Reserva, reservaDataToCreate);
        const reservaGuardada = await transactionalEntityManager.save(Reserva, nuevaReserva);

        return reservaGuardada;
      } catch (error: unknown) {
        console.error("Error en ReservaService.crearReservaPendiente:", error);
        if (error instanceof QueryFailedError) throw new Error("Error en la base de datos al crear la reserva: " + error.message);
        throw new Error((error as Error).message || "No se pudo crear la reserva. Por favor, inténtalo de nuevo más tarde.");
      }
    });
  }

  // Servicio para actualizar el estado de una reserva a CONFIRMADA
  async confirmarReserva(id_reserva: number): Promise<Reserva> {
    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      try {
        // 1. Validar el ID de la reserva
        if (!id_reserva) throw new Error("El ID de la reserva es obligatorio para confirmar.");

        // 2. Buscar la reserva existente
        const reservaExistente = await transactionalEntityManager.findOne(Reserva, { where: { id: id_reserva } });
        if (!reservaExistente) throw new Error(`Reserva con ID ${id_reserva} no encontrada.`);

        // 3. Verificar que el estado actual sea 'Pendiente'
        const estadoPendiente = await transactionalEntityManager.findOne(EstadoReserva, { where: { nombre: 'Pendiente', activo: 1 } });
        if (!estadoPendiente) throw new Error('El estado "Pendiente" no está configurado o está inactivo.');
        
        if (reservaExistente.id_estado !== estadoPendiente.id) {
          throw new Error('La reserva no se encuentra en estado "Pendiente" y no puede ser confirmada directamente.');
        }

        // 4. Verificar que el estado 'Confirmada' exista
        const estadoConfirmado = await transactionalEntityManager.findOne(EstadoReserva, { where: { nombre: 'Confirmada', activo: 1 } });
        if (!estadoConfirmado) throw new Error('El estado "Confirmada" no está configurado o está inactivo.');

        // 5. Actualizar el estado a 'Confirmada'
        reservaExistente.id_estado = estadoConfirmado.id;

        // 6. Guardar la reserva actualizada
        const reservaActualizada = await transactionalEntityManager.save(Reserva, reservaExistente);

        return reservaActualizada;
      } catch (error: unknown) {
        console.error("Error en ReservaService.confirmarReserva:", error);
        if (error instanceof QueryFailedError) throw new Error("Error en la base de datos al confirmar la reserva: " + error.message);
        throw new Error((error as Error).message || "No se pudo confirmar la reserva. Por favor, inténtalo de nuevo más tarde.");
      }
    });
  }

  async listarReservasPendientesPorColaboradorYNegocio(id_colaborador: number, id_negocio: number): Promise<Reserva[]> {
    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      try {
        // 1. Verificar la existencia y el estado activo de las entidades
        const colaboradorExistente = await transactionalEntityManager.findOne(Colaborador, { where: { id: id_colaborador } });
        if (!colaboradorExistente) throw new Error(`Colaborador con ID ${id_colaborador} no encontrado.`);

        const negocioExistente = await transactionalEntityManager.findOne(Negocio, { where: { id: id_negocio } });
        if (!negocioExistente) throw new Error(`Negocio con ID ${id_negocio} no encontrado.`);

        // 2. Verificar que el estado 'Pendiente' exista
        const estadoPendiente = await transactionalEntityManager.findOne(EstadoReserva, { where: { nombre: 'Pendiente', activo: 1 } });
        if (!estadoPendiente) {
            throw new Error('El estado "Pendiente" no está configurado o está inactivo.');
        }

        // 3. Realizar la consulta con JOINs para filtrar por colaborador y negocio
        const reservas = await transactionalEntityManager
          .createQueryBuilder(Reserva, 'reserva')
          .innerJoin('reserva.colaborador', 'colaborador')
          .innerJoin('colaborador.negocio', 'negocio') 
          .where('reserva.id_estado = :estadoId', { estadoId: estadoPendiente.id })
          .andWhere('reserva.id_colaborador = :colaboradorId', { colaboradorId: id_colaborador })
          .andWhere('negocio.id = :negocioId', { negocioId: id_negocio })
          .getMany();

        if (reservas.length === 0) {
          console.log(`No se encontraron reservas pendientes para el colaborador ID ${id_colaborador} en el negocio ID ${id_negocio}.`);
        }

        return reservas;
        
      } catch (error: unknown) {
        console.error("Error en ReservaService.listarReservasPendientesPorColaboradorYNegocio:", error);
        if (error instanceof QueryFailedError) {
          throw new Error("Error en la base de datos al listar las reservas: " + error.message);
        }
        throw new Error((error as Error).message || "No se pudo listar las reservas. Por favor, inténtalo de nuevo más tarde.");
      }
    });
  }

  async listarReservasConfirmadasPorColaboradorYNegocio(id_colaborador: number, id_negocio: number): Promise<Reserva[]> {
    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      try {
        // 1. Verificar la existencia y el estado activo de las entidades
        const colaboradorExistente = await transactionalEntityManager.findOne(Colaborador, { where: { id: id_colaborador } });
        if (!colaboradorExistente) throw new Error(`Colaborador con ID ${id_colaborador} no encontrado.`);

        const negocioExistente = await transactionalEntityManager.findOne(Negocio, { where: { id: id_negocio } });
        if (!negocioExistente) throw new Error(`Negocio con ID ${id_negocio} no encontrado.`);

        // 2. Verificar que el estado 'Pendiente' exista
        const estadoPendiente = await transactionalEntityManager.findOne(EstadoReserva, { where: { nombre: 'Confirmada', activo: 1 } });
        if (!estadoPendiente) {
            throw new Error('El estado "Pendiente" no está configurado o está inactivo.');
        }

        // 3. Realizar la consulta con JOINs para filtrar por colaborador y negocio
        const reservas = await transactionalEntityManager
          .createQueryBuilder(Reserva, 'reserva')
          .innerJoin('reserva.colaborador', 'colaborador')
          .innerJoin('colaborador.negocio', 'negocio') 
          .where('reserva.id_estado = :estadoId', { estadoId: estadoPendiente.id })
          .andWhere('reserva.id_colaborador = :colaboradorId', { colaboradorId: id_colaborador })
          .andWhere('negocio.id = :negocioId', { negocioId: id_negocio })
          .getMany();

        if (reservas.length === 0) {
          console.log(`No se encontraron reservas pendientes para el colaborador ID ${id_colaborador} en el negocio ID ${id_negocio}.`);
        }

        return reservas;
        
      } catch (error: unknown) {
        console.error("Error en ReservaService.listarReservasPendientesPorColaboradorYNegocio:", error);
        if (error instanceof QueryFailedError) {
          throw new Error("Error en la base de datos al listar las reservas: " + error.message);
        }
        throw new Error((error as Error).message || "No se pudo listar las reservas. Por favor, inténtalo de nuevo más tarde.");
      }
    });
  }
}