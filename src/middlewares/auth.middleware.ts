import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config(); // Aseguramos que las variables de entorno se carguen al inicio

interface CustomRequest extends Request {
  user?: {
    id: number;
    correo: string;
    id_rol: number;
    rolNombre: string | null;
  };
}


const JWT_SECRET = process.env.NODE_ENV === 'development'
  ? process.env.JWT_Desarrollo
  : process.env.JWT_SECRET;


if (!JWT_SECRET) {
  console.error("ERROR CRÍTICO: La variable de entorno JWT_SECRET o JWT_Desarrollo no está definida.");
  console.error("Por favor, asegúrate de configurar JWT_SECRET en .env para producción, o JWT_Desarrollo en .env para desarrollo.");
  process.exit(1); // Sale de la aplicación si no hay clave secreta.
}

/**
 * Middleware de autenticación JWT.
 * Intercepta las peticiones, verifica el token JWT y adjunta la información del usuario al objeto 'req'.
 * Si el token es inválido o no existe, la petición es rechazada con un 401 Unauthorized.
 * @param req El objeto de petición de Express.
 * @param res El objeto de respuesta de Express.
 * @param next La función para pasar el control al siguiente middleware.
 */
export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  console.log("--- Inicio del Middleware authenticateJWT ---"); // Log de inicio
  const authHeader = req.headers.authorization;
  console.log("Header Authorization recibido:", authHeader ? "Presente" : "Ausente"); // Log del header

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log("Token extraído (parcial):", token ? token.substring(0, 20) + '...' : "Vacío"); // Log del token (parcial)

     if (!token) {
      console.log("Error: Token JWT no encontrado después de 'Bearer'.");
      return res.status(401).json({ mensaje: "Acceso no autorizado. Formato de token incorrecto (falta el token después de 'Bearer')." });
    }

    jwt.verify(token, JWT_SECRET!, (err: { message: any; }, user: string | JwtPayload) => {
      if (err) {
        console.log("Error en jwt.verify: Token inválido o expirado."); // Log de error de verificación
        console.error("Error detallado:", err.message); // Log del mensaje de error
        return res.status(403).json({ mensaje: "Token de autenticación inválido o expirado." });
      }

      req.user = user as CustomRequest['user'];
      console.log("Token JWT verificado con éxito. Usuario autenticado:", req.user?.correo); // Log de verificación exitosa
      console.log("--- Fin del Middleware authenticateJWT (Pasando a next()) ---"); // Log antes de next()
      next();
    });
  } else {
    console.log("Header Authorization no proporcionado."); // Log si no hay header
    res.status(401).json({ mensaje: "Acceso no autorizado. Token JWT no proporcionado." });
    console.log("--- Fin del Middleware authenticateJWT (Respuesta 401) ---"); // Log de respuesta 401
  }
};
