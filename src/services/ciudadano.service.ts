// src/services/ciudadano.service.ts
import axios from 'axios';
import NodeCache from 'node-cache';
import { CiudadanoEstandar } from '../interfaces/ciudadano.interface';

// Las cachés se quedan igual
const tokenCache = new NodeCache({ stdTTL: 3500 });
const cedulaCache = new NodeCache({ stdTTL: 3600 });

// Función para obtener el token, con manejo de errores mejorado
async function getTokenCiudadano(): Promise<string> {
    const cacheKey = 'ciudadano-api-token';
    const cachedToken = tokenCache.get<string>(cacheKey);
    if (cachedToken) {
        console.log('Usando token desde caché...');
        return cachedToken;
    }

    console.log('Solicitando un nuevo token...');
    const url = process.env.CEDULA_TOKEN_URL;
    if (!url) throw new Error('CEDULA_TOKEN_URL no está definida en .env');

    // Axios puede manejar la codificación si le pasas un objeto simple
    const body = {
        grant_type: 'client_credentials',
        client_id: process.env.CEDULA_CLIENT_ID,
        client_secret: process.env.CEDULA_CLIENT_SECRET,
        scope: process.env.CEDULA_SCOPE,
    };

    try {
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const token = response.data.access_token;
        if (!token) {
            throw new Error('La respuesta del API de token no incluyó un access_token.');
        }

        tokenCache.set(cacheKey, token);
        return token;
    } catch (error) {
        // Usamos el type guard de axios para un manejo de errores más seguro
        if (axios.isAxiosError(error)) {
            console.error('Error de Axios al obtener el token:', error.response?.data);
        } else {
            console.error('Error inesperado al obtener el token:', error);
        }
        throw new Error('No se pudo obtener el token de autorización.');
    }
}

// Función principal, ahora con un tipo de retorno explícito y mejor manejo de errores
export async function getDatosCiudadano(tipo: string, identificacion: string): Promise<object> {
    const cacheKey = `${tipo}-${identificacion}`;
    const cachedData = cedulaCache.get(cacheKey);
    if (cachedData) {
        console.log(`Resultado para ${cacheKey} obtenido desde caché.`);
        return cachedData as object;
    }

    try {
        const token = await getTokenCiudadano();
        if (!token) throw new Error('Token inválido o nulo.');

        const url = `${process.env.CEDULA_API_URL}/Consultar`;
        const response = await axios.get(url, {
            params: { tipoidentificacion: tipo, identificacion },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Ocp-Apim-Subscription-Key': process.env.CEDULA_API_KEY!,
            },
        });

        const resultado = response.data?.DataResult 
            ? { ok: true, datos: response.data.DataResult }
            : { ok: false, mensaje: 'No se encontraron datos.' };
            
        cedulaCache.set(cacheKey, resultado);
        return resultado;

    } catch (error) {
        // --- BLOQUE CORREGIDO ---
        let errorMessage = 'Error al consultar el servicio de ciudadanos.';

        if (axios.isAxiosError(error)) {
            console.error('Error de Axios al consultar datos del ciudadano:', error.response?.data);
            if (error.response?.status === 404) {
                errorMessage = 'Identificación inválida o no encontrada.';
            } else if (error.response?.data?.mensaje) {
                // Si el API de error tiene un mensaje, úsalo
                errorMessage = error.response.data.mensaje;
            }
        } else {
            console.error('Error inesperado al consultar datos del ciudadano:', error);
        }

        // ✅ La corrección clave: Siempre retornamos un objeto con la estructura esperada
        return { ok: false, mensaje: errorMessage };
    }
}

function mapperServicioActual(apiResponse: any,identificacionOriginal: string): CiudadanoEstandar {
    // Aquí mapeamos los campos del servicio actual al nuestro
    return {
        identificacion: identificacionOriginal || '', // Ajusta el nombre del campo si es diferente
        nombreCompleto: apiResponse.nombreCompleto || `${apiResponse.Nombres} ${apiResponse.Apellidos}`,
        nombres: apiResponse.Nombres || '',
        apellidos: apiResponse.Apellidos || '',
        fechaDefuncion: apiResponse.FechaDefuncion || null
    };
}

// --- MAPPER PARA EL NUEVO SERVICIO (EL QUE VAS A CONTRATAR) ---
function mapperServicioNuevo(apiResponse: any): CiudadanoEstandar {
    // La respuesta ya viene en la estructura que queremos, solo la extraemos
    const responseData = apiResponse.data.response;
    return {
        identificacion: responseData.identificacion,
        nombreCompleto: responseData.nombreCompleto,
        nombres: responseData.nombres,
        apellidos: responseData.apellidos,
        fechaDefuncion: responseData.fechaDefuncion
    };
}