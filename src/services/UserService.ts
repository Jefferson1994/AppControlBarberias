import { AppDataSource } from '../config/data-source';
import { Usuario } from '../entities/Usuario';
//import bcrypt from 'bcrypt';

const usuarioRepository = AppDataSource.getRepository(Usuario);

export const obtenerUsuarios = async () => {
  return await usuarioRepository.find();
};

export const crearUsuario = async (datos: Partial<Usuario>): Promise<Usuario> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // Validaciones para los campos obligatorios (NOT NULL) de tu entidad Usuario
    if (!datos.correo) {
      throw new Error("El correo electrónico es obligatorio.");
    }
    if (!datos.nombre) {
      throw new Error("El nombre es obligatorio.");
    }
    if (!datos.contrasena) {
      throw new Error("La contraseña es obligatoria.");
    }
    if (!datos.rol) {
      throw new Error("El rol del usuario es obligatorio."); // El rol es NOT NULL en tu esquema
    }

    const nuevoUsuario = transactionalEntityManager.create(Usuario, datos);

    // Guarda el nuevo usuario en la base de datos
    return await transactionalEntityManager.save(Usuario, nuevoUsuario);
  });
};



type TipoResumen = "ingresos" | "egresos";

/*export const obtenerUsuarioPorId = async (id: number): Promise<any> => {
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

/*export const obtenerLoginPorMail = async (email: string, password: string): Promise<any> => {
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
};*/
export const obtenerLoginPorMail = async (correo: string, contrasena: string): Promise<Usuario | null> => {
  // Service directly interacts with the database
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const usuario = await usuarioRepository.findOne({ where: { correo: correo } });

  // Service performs business logic (password comparison)
  if (usuario && usuario.contrasena === contrasena) {
    return usuario; // Service returns the raw data
  }

  return null;
};


