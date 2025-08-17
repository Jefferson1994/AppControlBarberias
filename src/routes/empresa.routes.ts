import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import { NegocioController } from '../controllers/NegociosController'; 

const router = Router();


router.post('/crearEmpresa', authenticateJWT, NegocioController.crear);
router.put('/:id', authenticateJWT, NegocioController.actualizar);
router.delete('/:id', authenticateJWT, NegocioController.eliminar);
//Colaborador Empresa
router.post('/agregarColaborador', authenticateJWT, NegocioController.agregarColaborador);
router.post('/desvincularColaborador', authenticateJWT, NegocioController.desvincularColaborador);

export default router;
