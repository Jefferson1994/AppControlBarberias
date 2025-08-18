import { Router } from 'express';
import { ServicioController } from '../controllers/ServiciosController';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación

const router = Router();


router.post('/tipo', authenticateJWT, ServicioController.obtenerTiposActivos);

router.post('/crear', authenticateJWT, ServicioController.crear);

router.post('/actualizar', authenticateJWT, ServicioController.actualizar);

router.post('/eliminar', authenticateJWT, ServicioController.eliminar);

router.post('/servicioXEmpresa', authenticateJWT, ServicioController.obtenerServiciosPorEmpresa);

router.post('/servicioXId', authenticateJWT, ServicioController.obtenerPorIdYNegocio);


export default router;
