import { Router } from 'express';
import { ServicioController } from '../controllers/ServiciosController';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();


router.post('/tipo', authenticateJWT, ServicioController.obtenerTiposActivos);

//router.post('/crear', authenticateJWT, ServicioController.crear);
router.post('/crear', authenticateJWT, upload.array('imagenes', 3), ServicioController.crear);
router.post('/actualizar', authenticateJWT, ServicioController.actualizar);

router.post('/eliminar', authenticateJWT, ServicioController.eliminar);

router.post('/servicioXEmpresa', authenticateJWT, ServicioController.obtenerServiciosPorEmpresa);

router.post('/servicioXId', authenticateJWT, ServicioController.obtenerPorIdYNegocio);


export default router;
