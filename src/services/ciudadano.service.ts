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
    if (cedulaCache.has(cacheKey)) {
        console.log(`Resultado para ${cacheKey} obtenido desde caché.`);
        return cedulaCache.get(cacheKey) as object;
    }

    try {
        const token = await getTokenCiudadano();
        if (!token) throw new Error('Token inválido o nulo.');

        let apiResponse: any;

        // --- LÓGICA PARA CAMBIAR DE PROVEEDOR ---
        if (process.env.CEDULA_PROVIDER === 'nuevo') {
            console.log('Usando el NUEVO proveedor de servicios...');
            // Aquí iría la lógica de llamada al nuevo API
            // Por ahora, simulamos la respuesta que nos diste:
            apiResponse = { data: { response: { identificacion, nombreCompleto: "NOMBRE DESDE NUEVO API", nombres: "NOMBRE", apellidos: "APELLIDO", fechaDefuncion: null } } };
            
            const resultadoEstandar = mapperServicioNuevo(apiResponse);
            const resultadoFinal = { ok: true, datos: resultadoEstandar };
            cedulaCache.set(cacheKey, resultadoFinal);
            return resultadoFinal;

        } else {
            // Lógica para el servicio ACTUAL (el de tu trabajo)
            console.log('Usando el proveedor de servicios ACTUAL...');
            const url = `${process.env.CEDULA_API_URL}/Consultar`;
            const response = await axios.get(url, {
                params: { tipoidentificacion: tipo, identificacion },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Ocp-Apim-Subscription-Key': process.env.CEDULA_API_KEY!,
                },
            });

            apiResponse = response.data?.DataResult;

            if (apiResponse) {
                const resultadoEstandar = mapperServicioActual(apiResponse,identificacion);
                const resultadoFinal = { ok: true, datos: resultadoEstandar };
                cedulaCache.set(cacheKey, resultadoFinal);
                return resultadoFinal;
            } else {
                return { ok: false, mensaje: 'No se encontraron datos.' };
            }
        }
    } catch (error) {
        // ... (tu manejo de errores se queda igual)
        // ...
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