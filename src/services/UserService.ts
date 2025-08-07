import { AppDataSource } from '../config/data-source';
import { Usuario } from '../entities/Usuario';
import bcrypt from 'bcrypt';

const usuarioRepository = AppDataSource.getRepository(Usuario);

export const obtenerUsuarios = async () => {
  return await usuarioRepository.find();
};

export const crearUsuario = async (datos: Partial<Usuario>) => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // Validaciones
    if (!datos.email) throw new Error("Email obligatorio");
    if (!datos.nombre) throw new Error("Nombre obligatorio");
    if (!datos.password) throw new Error("Contraseña obligatoria");

    const nuevo = transactionalEntityManager.create(Usuario, datos);
    return await transactionalEntityManager.save(Usuario, nuevo);
  });
};



type TipoResumen = "ingresos" | "egresos";

export const obtenerUsuarioPorId = async (id: number): Promise<any> => {
  const usuario = await usuarioRepository.findOne({
    where: { id },
    relations: ['gastos', 'gastos.categoria', 'gastos.tipo'],
  });

  if (!usuario) {
    return null; // No existe usuario
  }

  
  // Inicializar estructura para agrupar montos
  const resumenGastos: Record<TipoResumen, Record<string, number>> = {
    ingresos: {},
    egresos: {},
  };

  usuario.gastos.forEach((gasto) => {
    // Normalizar el nombre del tipo para agrupar
    const tipoNombreRaw = gasto.tipo?.nombre?.toLowerCase() || '';
    const tipoNombre =
      tipoNombreRaw === 'ingreso' || tipoNombreRaw === 'ingresos'
        ? 'ingresos'
        : tipoNombreRaw === 'egreso' || tipoNombreRaw === 'egresos'
        ? 'egresos'
        : null;

    const catNombre = gasto.categoria?.nombre || 'Sin categoría';

    if (!tipoNombre) return; // Ignorar tipos no válidos

    if (!resumenGastos[tipoNombre][catNombre]) {
      resumenGastos[tipoNombre][catNombre] = 0;
    }

    resumenGastos[tipoNombre][catNombre] += Number(gasto.monto);
  });

  // Omitir password para seguridad
  const { password: _, ...usuarioSinPassword } = usuario;

  return {
    ...usuarioSinPassword,
    resumenGastos,
    gastosDetalle: usuario.gastos, // <-- Aquí agrego el detalle con categorías y tipos
  };
};

export const obtenerLoginPorMail = async (email: string, password: string): Promise<any> => {
  const usuario = await usuarioRepository.findOne({
    where: { email },
    relations: ['gastos', 'gastos.categoria', 'gastos.tipo'],
  });

  if (!usuario) {
    return null; // No existe usuario
  }

  const esValida = password === usuario.password;
  if (!esValida) {
    return null; // Contraseña incorrecta
  }

  // Inicializar estructura para agrupar montos
  const resumenGastos: Record<TipoResumen, Record<string, number>> = {
    ingresos: {},
    egresos: {},
  };

  usuario.gastos.forEach((gasto) => {
    // Normalizar el nombre del tipo para agrupar
    const tipoNombreRaw = gasto.tipo?.nombre?.toLowerCase() || '';
    const tipoNombre =
      tipoNombreRaw === 'ingreso' || tipoNombreRaw === 'ingresos'
        ? 'ingresos'
        : tipoNombreRaw === 'egreso' || tipoNombreRaw === 'egresos'
        ? 'egresos'
        : null;

    const catNombre = gasto.categoria?.nombre || 'Sin categoría';

    if (!tipoNombre) return; // Ignorar tipos no válidos

    if (!resumenGastos[tipoNombre][catNombre]) {
      resumenGastos[tipoNombre][catNombre] = 0;
    }

    resumenGastos[tipoNombre][catNombre] += Number(gasto.monto);
  });

  // Omitir password para seguridad
  const { password: _, ...usuarioSinPassword } = usuario;

  return {
    ...usuarioSinPassword,
    resumenGastos,
    gastosDetalle: usuario.gastos, // <-- Aquí agrego el detalle con categorías y tipos
  };
};



