import { AppDataSource } from "../config/data-source"; 
import { Usuario } from '../entities/Usuario';
import { Rol } from "../entities/Rol";
import bcrypt from 'bcryptjs';
import { QueryFailedError } from "typeorm"; 
const usuarioRepository = AppDataSource.getRepository(Usuario);

export const obtenerUsuarios = async () => {
  return await usuarioRepository.find();
};

export const crearUsuario = async (datos: Partial<Usuario>): Promise<Usuario> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // Validaciones para los campos obligatorios (NOT NULL)
      if (!datos.correo) throw new Error("El correo electrónico es obligatorio.");
      if (!datos.nombre) throw new Error("El nombre es obligatorio.");
      if (!datos.contrasena) throw new Error("La contraseña es obligatoria.");
      if (!datos.id_rol) throw new Error("El ID del rol es obligatorio.");

      // ¡CRÍTICO! Hashear la contraseña antes de guardarla
      const saltRounds = 10; // Número de rondas de sal para el hashing
      const hashedPassword = await bcrypt.hash(datos.contrasena, saltRounds);
      datos.contrasena = hashedPassword; // Sobrescribe la contraseña con su hash

      const nuevoUsuario = transactionalEntityManager.create(Usuario, datos);
      return await transactionalEntityManager.save(Usuario, nuevoUsuario);
    } catch (error: unknown) {
      console.error("Error detallado en crearUsuario:", error); // Log del error completo para depuración

      // Manejo específico para errores de base de datos
      if (error instanceof QueryFailedError) {
        // Para SQL Server (MSSQL), los errores de unicidad suelen tener códigos 2627 o 2601
        // Se accede al error del driver original para obtener el número de error
        const driverErrorCode = (error.driverError as any)?.number; // Acceder al número del error del driver

        if (driverErrorCode === 2627 || driverErrorCode === 2601) {
          throw new Error("El correo electrónico ya está registrado. Por favor, elige otro.");
        }
      }
      
      // Si no es un error de base de datos específico, o no se pudo identificar,
      // se relanza un mensaje genérico para la capa superior.
      throw new Error("No se pudo crear el usuario. Por favor, inténtalo de nuevo más tarde.");
    }
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
export const obtenerLoginPorMail = async (email: string, password: string): Promise<Usuario | null> => {
  console.log("--- Inicio de obtenerLoginPorMail ---");
  console.log("Correo recibido:", email);
  console.log("Contraseña recibida (sin hashear):", password); // NO loguear esto en producción

  const usuarioRepository = AppDataSource.getRepository(Usuario);

  try {
    const usuario = await usuarioRepository.findOne({
      where: { correo: email },
      relations: ['negociosAdministrados', 'empleados', 'rol'],
    });

    console.log("Usuario encontrado en DB:", usuario ? usuario.correo : "Ninguno");

    if (usuario) {
      console.log("Contraseña del usuario en DB (hash):", usuario.contrasena);
      const isPasswordMatch = await bcrypt.compare(password, usuario.contrasena);
      console.log("Resultado de bcrypt.compare (¿Contraseña coincide?):", isPasswordMatch);

      if (isPasswordMatch) {
        console.log("Contraseña verificada exitosamente. Login OK.");
        return usuario;
      } else {
        console.log("Contraseña NO coincide. Credenciales inválidas.");
        return null;
      }
    } else {
      console.log("Usuario no encontrado para el correo:", email);
      return null;
    }
  } catch (error: unknown) {
    console.error("Error en obtenerLoginPorMail (capturado en el servicio):", (error as Error).message);
    // Puedes relanzar un error más genérico si no quieres exponer detalles internos
    throw new Error("Ocurrió un error al intentar iniciar sesión.");
  } finally {
    console.log("--- Fin de obtenerLoginPorMail ---");
  }
};

export const obtenerRolesActivos = async (): Promise<Rol[]> => {
  try {
    const rolRepository = AppDataSource.getRepository(Rol);

    // Busca todos los roles donde la propiedad 'activo' sea 0 (según tu convención para "activo")
    const rolesActivos = await rolRepository.find({
      where: { activo: 0 },
    });

    return rolesActivos;
  } catch (error: unknown) { // Captura el error para un manejo profesional
    console.error("Error en obtenerRolesActivos:", (error as Error).message);
    // Relanza el error para que el controlador o la capa superior puedan manejarlo
    throw new Error("No se pudieron obtener los roles activos. Por favor, inténtalo de nuevo más tarde.");
  }
};


/*Para crear roles desde sistema
export const crearRol = async (datos: Partial<Rol>): Promise<Rol> => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    try {
      // Validaciones para los campos obligatorios
      if (!datos.nombre) {
        throw new Error("El nombre del rol es obligatorio.");
      }
      // 'activo' no es estrictamente necesario validar aquí si tiene un default en la entidad
      // y 'descripcion' es nullable.

      // Crea una nueva instancia de la entidad Rol con los datos proporcionados
      const nuevoRol = transactionalEntityManager.create(Rol, datos);

      // Guarda el nuevo rol en la base de datos
      return await transactionalEntityManager.save(Rol, nuevoRol);
    } catch (error: unknown) {
      console.error("Error en crearRol:", (error as Error).message);
      // Puedes añadir manejo específico para errores de unicidad si el nombre del rol ya existe
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error("El nombre de rol ya existe. Por favor, elige otro.");
      }
      // Relanza el error con un mensaje genérico para la capa superior
      throw new Error("No se pudo crear el rol. Por favor, inténtalo de nuevo más tarde.");
    }
  });
};*/

