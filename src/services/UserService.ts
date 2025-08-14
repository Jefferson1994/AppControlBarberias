import { AppDataSource } from "../config/data-source"; 
import { Usuario } from '../entities/Usuario';
import { Rol } from "../entities/Rol";
import bcrypt from 'bcryptjs';
import { QueryFailedError } from "typeorm";
import { Otp } from "../entities/Otp"; // Importar la entidad Otp
import { TipoOtp } from "../entities/TipoOtp"; // Importar la entidad TipoOtp
import * as dotenv from 'dotenv'; 
import { sendEmail, generateOtp } from './EmailService'; // Importar el EmailService

const usuarioRepository = AppDataSource.getRepository(Usuario);
dotenv.config(); 

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
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(datos.contrasena, saltRounds);
      datos.contrasena = hashedPassword;

      // Por defecto, el usuario se crea como activo (activo = 1) según la entidad Usuario.
      // La "activación de cuenta" ahora se manejará con la verificación del OTP,
      // que simplemente confirmará que el correo es válido, pero el usuario ya puede iniciar sesión.
      // Si la lógica es que NO PUEDE INICIAR SESIÓN hasta verificar, el campo 'activo' en Usuario
      // debería ser '0' por defecto y cambiar a '1' en verificarOtp.
      // Para este flujo, asumimos que el usuario puede intentar loguearse y luego se le pedirá el OTP.

      const nuevoUsuario = transactionalEntityManager.create(Usuario, datos);
      const usuarioGuardado = await transactionalEntityManager.save(Usuario, nuevoUsuario);

      // --- Lógica de Creación y Envío de OTP para VERIFICACION_CUENTA ---
      const otpRepository = transactionalEntityManager.getRepository(Otp);
      const tipoOtpRepository = transactionalEntityManager.getRepository(TipoOtp);

      // Buscar el TipoOtp para 'VERIFICACION_CUENTA'
      let tipoVerificacion = await tipoOtpRepository.findOne({
        where: { nombre: 'VERIFICACION_CUENTA' },
      });

      // Si no existe el TipoOtp, crearlo (esto es útil para la primera vez o si se despliega en una DB vacía)
      if (!tipoVerificacion) {
        tipoVerificacion = tipoOtpRepository.create({ nombre: 'VERIFICACION_CUENTA', descripcion: 'Verificación de cuenta de usuario', activo: 1 });
        await tipoOtpRepository.save(tipoVerificacion);
      }

      const otpCode = generateOtp(6);
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // OTP válido por 15 minutos

      // Crear y guardar el nuevo registro OTP
      const newOtp = otpRepository.create({
        id_usuario: usuarioGuardado.id,
        id_tipo_otp: tipoVerificacion.id,
        codigo: otpCode,
        expira_en: otpExpiresAt,
        usado: false, // Por defecto, no usado
      });
      await otpRepository.save(newOtp);

      // Enviar el correo con el OTP
      const emailSubject = 'Verifica tu cuenta en [Tu Aplicación]';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Verifica tu Correo Electrónico</h2>
          <p>Hola ${usuarioGuardado.nombre},</p>
          <p>Gracias por registrarte en [Tu Aplicación]. Para activar tu cuenta, por favor usa el siguiente código de verificación:</p>
          <p style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #f0f8ff; padding: 10px; border-radius: 5px; display: inline-block;">
            ${otpCode}
          </p>
          <p>Este código es válido por los próximos 15 minutos.</p>
          <p>Si no te registraste en [Tu Aplicación], por favor ignora este correo.</p>
          <p>Gracias,</p>
          <p>El Equipo de [Tu Aplicación]</p>
        </div>
      `;

      await sendEmail(usuarioGuardado.correo, emailSubject, `Tu código de verificación es: ${otpCode}`, emailHtml);
      console.log(`OTP de verificación de cuenta enviado al nuevo usuario ${usuarioGuardado.correo}`);

      return usuarioGuardado; // Devuelve el usuario (aún no verificado)
    } catch (error: unknown) {
      console.error("Error detallado en crearUsuario:", error);
      if (error instanceof QueryFailedError) {
        const driverErrorCode = (error.driverError as any)?.number;
        if (driverErrorCode === 2627 || driverErrorCode === 2601) {
          throw new Error("El correo electrónico ya está registrado. Por favor, elige otro.");
        }
      }
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

