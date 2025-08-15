import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import { NegocioController } from '../controllers/NegociosController'; // Importa tu controlador de Negocios

const router = Router();


router.post('/crearEmpresa', authenticateJWT, NegocioController.crear);

export default router;