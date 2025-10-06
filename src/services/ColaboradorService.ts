import { AppDataSource } from "../config/data-source";
import { Colaborador } from "../entities/Colaborador";
import { Negocio } from "../entities/Negocio";
import { Usuario } from "../entities/Usuario";
import { Rol } from "../entities/Rol"; 
import { json } from "body-parser";


export const agregarColaboradorANegocio = async (idNegocio: number, idUsuario: number ,codigo_punto_emision_movil:string): Promise<Colaborador> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // 1. Verificar la existencia del Negocio y cargar su nombre
    const negocio = await transactionalEntityManager.findOne(Negocio, { where: { id: idNegocio } });
    if (!negocio) {
      throw new Error(`Negocio con ID ${idNegocio} no encontrado.`);
    }

    // 2. Verificar la existencia del Usuario y cargar su rol
    const usuario = await transactionalEntityManager.findOne(Usuario, {
      where: { id: idUsuario }
      //relations: ['rol'],
    });
    if (!usuario) {
      throw new Error(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    console.log('el usuario con este id PARA AGREGAR COLABORADRO',JSON.stringify(usuario))

    // 3. Verificar que el Usuario tenga el rol de 'Cliente' aqui es para que recien asiganarle un rol de colaborador
    //if (usuario.rol.nombre.trim() == 'Cliente' ) {
    //  throw new Error(`El usuario con ID ${idUsuario} no tiene el rol de 'Colaboradorrrr'${usuario.rol.nombre}`);
    //}

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

    const rolColaborador = await transactionalEntityManager.findOne(Rol, { where: { nombre: 'Colaborador', activo:0 } });
    if (!rolColaborador) {
        throw new Error("El rol 'Colaborador' no se encuentra en la base de datos.");
    }

    console.log ('el rol del coloaborador', JSON.stringify(rolColaborador))

    usuario.id_rol = rolColaborador.id;

    console.log('EL USUARIO ACTULIZADO ',JSON.stringify(usuario))
    await transactionalEntityManager.save(Usuario, usuario);


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

export const vacacionesColaborador = async (idNegocio: number, idUsuario: number): Promise<Colaborador> => {
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
      throw new Error(`El colaborador para el usuario ${usuario?.nombre} en la empresa ${Empresa?.nombre} ya está de vacaciones.`);
    }

    // Cambiar el estado a inactivo (false)
    colaborador.vacaciones = true; // activo: false se mapea a 0 en la base de datos (inactivo)

    // Guardar los cambios
    const colaboradorDesvinculado = await transactionalEntityManager.save(Colaborador, colaborador);

    return colaboradorDesvinculado;
  });
};

export const ReintegrarvacacionesColaborador = async (idNegocio: number, idUsuario: number): Promise<Colaborador> => {
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
      throw new Error(`El colaborador para el usuario ${usuario?.nombre} en la empresa ${Empresa?.nombre} ya está de vacaciones.`);
    }

    // Cambiar el estado a inactivo (false)
    colaborador.vacaciones = false; // activo: false se mapea a 0 en la base de datos (inactivo)

    // Guardar los cambios
    const colaboradorDesvinculado = await transactionalEntityManager.save(Colaborador, colaborador);

    return colaboradorDesvinculado;
  });
};


export const TodosColaboradorXEmpresa = async (idNegocio: number): Promise<Colaborador[]> => {
  try {
    const colaboradorRepository = AppDataSource.getRepository(Colaborador);

    const colaboradores = await colaboradorRepository.find({
      where: {
        id_negocio: idNegocio, 
        activo: true          
      },
      relations: {
        usuario: true 
      }
    });

    return colaboradores;

  } catch (error) {
    console.error("Error al obtener los colaboradores por empresa:", error);
    // Lanza un error genérico para que sea manejado por la capa superior (controlador/servicio)
    throw new Error("No se pudieron obtener los colaboradores. Inténtalo de nuevo más tarde.");
  }
};
