import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv'; // Importar dotenv para cargar variables de entorno

dotenv.config(); // Cargar las variables de entorno desde el archivo .env

// --- INICIO DE DEBUG DE VARIABLES DE ENTORNO ---
console.log("DEBUG: EMAIL_SERVICE_HOST:", process.env.EMAIL_SERVICE_HOST);
console.log("DEBUG: EMAIL_SERVICE_PORT:", process.env.EMAIL_SERVICE_PORT);
console.log("DEBUG: EMAIL_SERVICE_USER:", process.env.EMAIL_SERVICE_USER);
console.log("DEBUG: EMAIL_SERVICE_SECURE:", process.env.EMAIL_SERVICE_SECURE);
// --- FIN DE DEBUG DE VARIABLES DE ENTORNO ---

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE_HOST, // Servidor SMTP (ej. smtp.gmail.com)
  port: parseInt(process.env.EMAIL_SERVICE_PORT || '587', 10), // Puerto SMTP (ej. 587 o 465)
  secure: process.env.EMAIL_SERVICE_SECURE === 'true', // true para SSL (puerto 465), false para STARTTLS (puerto 587)
  auth: {
    user: process.env.EMAIL_SERVICE_USER, // Tu dirección de correo electrónico (remitente)
    pass: process.env.EMAIL_SERVICE_PASS, // Tu contraseña de aplicación o normal
  },
  // Opcional: Ignorar certificados SSL no válidos (NO RECOMENDADO EN PRODUCCIÓN)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

/**
 * Envía un correo electrónico a un destinatario específico.
 *
 * @param to El correo electrónico del destinatario.
 * @param subject El asunto del correo.
 * @param text El contenido del correo en texto plano.
 * @param html Opcional: El contenido del correo en formato HTML para un mejor estilo.
 * @returns Una promesa que se resuelve con la información de la respuesta del servidor de correo.
 * @throws {Error} Si ocurre un error durante el proceso de envío del correo.
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string): Promise<any> => {
  try {
    // Aquí es donde se construye y se envía el correo.
    const info = await transporter.sendMail({
      from: `"App pruebas Sistema Control financiero barberia" <${process.env.EMAIL_SERVICE_USER}>`, // Remitente (puede ser diferente a EMAIL_SERVICE_USER si tu SMTP lo permite)
      to: to,       // Destinatario
      subject: subject, // Asunto del correo
      text: text,     // Contenido en texto plano
      html: html,     // Contenido en HTML (si se proporciona, anula el texto plano en clientes que lo soporten)
    });

    console.log('Mensaje de correo enviado con éxito: %s', info.messageId);
    console.log('URL de vista previa del mensaje (solo para desarrollo): %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error: unknown) {
    console.error("Error al enviar correo electrónico:", (error as Error).message);
    // Relanzar el error para que el llamador pueda manejarlo adecuadamente.
    throw new Error(`Fallo al enviar el correo: ${(error as Error).message}`);
  }
};

/**
 * Genera un código OTP (One-Time Password) numérico de una longitud específica.
 *
 * @param length La longitud deseada del OTP (por defecto 6 dígitos).
 * @returns Un string que representa el código OTP generado.
 */
export const generateOtp = (length: number = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    // Añade un dígito aleatorio (0-9) en cada iteración
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};
