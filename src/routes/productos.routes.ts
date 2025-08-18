import { Router } from 'express';
import { ProductoController } from '../controllers/ProductoController';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación

const router = Router();


router.post('/tipo', authenticateJWT, ProductoController.obtenerActivos);

router.post('/crear', authenticateJWT, ProductoController.crear);

router.post('/actualizar', authenticateJWT, ProductoController.actualizar);

router.post('/eliminar', authenticateJWT, ProductoController.eliminar);

router.post('/productoXEmpresa', authenticateJWT, ProductoController.obtenerProductoPorEmpresa);

router.post('/productoXId', authenticateJWT, ProductoController.obtenerPorId);


export default router;



