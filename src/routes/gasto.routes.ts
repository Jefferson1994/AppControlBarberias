import { Router } from "express";
import {  GastosController } from "../controllers/GastoController";

const router = Router();

router.post("/ingreso", GastosController.crear);
router.post("/listarIngreso", GastosController.obtenerTodosIngresosCategorias);
router.post("/listarEgreso", GastosController.obtenerTodosGastosCategorias);
router.get("/ingreso", GastosController.listar);
router.get("/ingreso", GastosController.obtenerPorId);


export default router;