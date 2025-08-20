import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import {CajaController } from '../controllers/CajaController'; 

const router = Router();


router.post('/abrirCaja', authenticateJWT, CajaController.abrirCaja);
router.post('/cajaXColaborador', authenticateJWT, CajaController.obtenerCajaActiva);
//router.post('/transaccionCaja', authenticateJWT, CajaController.desvincularColaborador);
//router.post('/cerrarCaja', authenticateJWT, CajaController.desvincularColaborador);

export default router;
