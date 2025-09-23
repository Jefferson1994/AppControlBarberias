import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import { NegocioController } from '../controllers/NegociosController'; 
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();


router.post('/crearEmpresa', authenticateJWT,upload.single('imagen'), NegocioController.crear);
router.put('/:id', authenticateJWT, NegocioController.actualizar);
router.delete('/:id', authenticateJWT, NegocioController.eliminar);
//Colaborador Empresa
router.post('/agregarColaborador', authenticateJWT, NegocioController.agregarColaborador);
router.post('/desvincularColaborador', authenticateJWT, NegocioController.desvincularColaborador);
router.post('/todasEmpresasXAdmin', authenticateJWT, NegocioController.obtenerEmpresasPorAdmin);
router.post('/empresasXId', authenticateJWT, NegocioController.obtenerEmpresaPorId);
router.post('/empresaEstadisticas', authenticateJWT, NegocioController.obtenerEstadisticas);
export default router;
