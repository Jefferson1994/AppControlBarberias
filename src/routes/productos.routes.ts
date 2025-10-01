import { Router } from 'express';
import { ProductoController } from '../controllers/ProductoController';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();


router.post('/tipo', authenticateJWT, ProductoController.obtenerActivos);

//router.post('/crear', authenticateJWT, ProductoController.crear);
router.post('/crear', authenticateJWT, upload.array('imagenes', 3), ProductoController.crear);

router.post('/actualizar', authenticateJWT, ProductoController.actualizar);

router.post('/eliminar', authenticateJWT, ProductoController.eliminar);

router.post('/productoXEmpresa', authenticateJWT, ProductoController.obtenerProductoPorEmpresa);

router.post('/productoXId', authenticateJWT, ProductoController.obtenerPorId);


export default router;



