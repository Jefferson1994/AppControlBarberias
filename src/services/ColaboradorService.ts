import { AppDataSource } from "../config/data-source";
import { Colaborador } from "../entities/Colaborador";
import { Negocio } from "../entities/Negocio";
import { Usuario } from "../entities/Usuario";
import { Rol } from "../entities/Rol"; // Necesario para verificar el rol del usuario

/**
 * Agrega un usuario como colaborador a un negocio específico.
 * Realiza validaciones para asegurar que el negocio y el usuario existen,
 * que el usuario tiene el rol de 'Colaborador', y que no está ya asignado al negocio.
 *
 * @param idNegocio El ID del negocio al que se añadirá el colaborador.
 * @param idUsuario El ID del usuario que se convertirá en colaborador.
 * @returns Una promesa que resuelve con la entidad Colaborador creada o reactivada.
 * @throws {Error} Si el negocio o usuario no existen, el usuario no es 'Colaborador',
 * o si el usuario ya es un colaborador ACTIVO de ese negocio.
 */
export const agregarColaboradorANegocio = async (idNegocio: number, idUsuario: number ,codigo_punto_emision_movil:string): Promise<Colaborador> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // 1. Verificar la existencia del Negocio y cargar su nombre
    const negocio = await transactionalEntityManager.findOne(Negocio, { where: { id: idNegocio } });
    if (!negocio) {
      throw new Error(`Negocio con ID ${idNegocio} no encontrado.`);
    }

    // 2. Verificar la existencia del Usuario y cargar su rol
    const usuario = await transactionalEntityManager.findOne(Usuario, {
      where: { id: idUsuario },
      relations: ['rol'],
    });
    if (!usuario) {
      throw new Error(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    // 3. Verificar que el Usuario tenga el rol de 'Colaborador'
    if (!usuario.rol || usuario.rol.nombre.trim() !== 'Colaborador') {
      throw new Error(`El usuario con ID ${idUsuario} no tiene el rol de 'Colaborador'${usuario.rol.nombre}`);
    }

    // 4. VERIFICACIÓN CRÍTICA: Buscar si el usuario ya es un colaborador ACTIVO en CUALQUIER otro negocio.
    // Usamos QueryBuilder para mayor fiabilidad con la condición "diferente de".
    const colaboradorActivoEnOtroNegocio = await transactionalEntityManager
      .createQueryBuilder(Colaborador, 'Colaborador')
      .leftJoinAndSelect('Colaborador.negocio', 'negocio') // Cargar el negocio para obtener su nombre
      .where('Colaborador.id_usuario = :idUsuario', { idUsuario })
      .andWhere('Colaborador.activo = :activoStatus', { activoStatus: true }) // 'activo: true' mapea a 1 en DB (activo)
      .andWhere('Colaborador.id_negocio != :currentNegocioId', { currentNegocioId: idNegocio }) // Excluir el negocio actual
      .getOne(); // Obtener un solo resultado

    if (colaboradorActivoEnOtroNegocio) {
      // Si se encuentra un registro donde el usuario está activo en un NEGOCIO DIFERENTE
      throw new Error(`El usuario '${usuario.nombre}' con CI # ${usuario.numero_identificacion}  ya es colaborador activo del negocio '${colaboradorActivoEnOtroNegocio.negocio.nombre}'. Primero debe desvincularlo de esa empresa.`);
    }

    // 5. Verificar si el usuario ya es colaborador de ESTE negocio específico (activo o inactivo)
    const existeColaboradorEnEsteNegocio = await transactionalEntityManager.findOne(Colaborador, {
      where: { id_usuario: idUsuario, id_negocio: idNegocio },
    });

    if (existeColaboradorEnEsteNegocio) {
      if (existeColaboradorEnEsteNegocio.activo === true) { // Si el colaborador ya está activo en este negocio (activo = 1)
        throw new Error(`El usuario con ID ${idUsuario} ya es colaborador ACTIVO del negocio '${negocio.nombre}'.`);
      } else { // Si el colaborador existe pero está inactivo (activo = 0), reactivarlo
        existeColaboradorEnEsteNegocio.activo = true; // Establecer a activo (1)
        const colaboradorReactivado = await transactionalEntityManager.save(Colaborador, existeColaboradorEnEsteNegocio);
        return colaboradorReactivado;
      }
    }

    // 6. Crear la nueva instancia de Colaborador (solo si no existía previamente en este negocio)
    const nuevoColaborador = transactionalEntityManager.create(Colaborador, {
      id_usuario: idUsuario,
      id_negocio: idNegocio,
      codigo_punto_emision_movil: codigo_punto_emision_movil, 
      activo: true, 
    });

    // 7. Guardar la nueva instancia de Colaborador
    const colaboradorGuardado = await transactionalEntityManager.save(Colaborador, nuevoColaborador);

    return colaboradorGuardado;
  });
};


export const desvincularColaborador = async (idNegocio: number, idUsuario: number): Promise<Colaborador> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // Buscar el registro de Colaborador específico para desvincular
    const colaborador = await transactionalEntityManager.findOne(Colaborador, {
      where: { id_usuario: idUsuario, id_negocio: idNegocio },
    });

    const usuario = await transactionalEntityManager.findOne(Usuario, {
      where: { id: idUsuario },
      relations: ['rol'],
    });

    const Empresa = await transactionalEntityManager.findOne(Negocio, {
      where: { id: idNegocio }
    });

    if(!Empresa){
      throw new Error(`No existe la empresa`);
    }

    if (!colaborador) {
      throw new Error(`Colaborador no encontrado para el usuario ${usuario?.nombre} en el empresa ${Empresa?.nombre}.`);
    }

    if (colaborador.activo === false) { // activo: false significa 0 (inactivo)
      throw new Error(`El colaborador para el usuario ${usuario?.nombre} en la empresa ${Empresa?.nombre} ya está inactivo.`);
    }

    // Cambiar el estado a inactivo (false)
    colaborador.activo = false; // activo: false se mapea a 0 en la base de datos (inactivo)

    // Guardar los cambios
    const colaboradorDesvinculado = await transactionalEntityManager.save(Colaborador, colaborador);

    return colaboradorDesvinculado;
  });
};
