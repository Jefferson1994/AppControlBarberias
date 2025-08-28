import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Importa tu middleware de autenticación
import {ReservaController } from '../controllers/ReservaController'; 

const router = Router();


router.post('/crearReservaPendiente', ReservaController.crearReservaPendiente);
//router.post('/confirmaReserva', authenticateJWT, ReservaController.confirmarReserva);
router.post('/confirmaReserva', ReservaController.confirmarReserva);
router.post('/listarReservaPendientes', ReservaController.listarReservasPendientes);
router.post('/listarReservaConfirmadas', ReservaController.listarReservasConfirmadas);

export default router;
