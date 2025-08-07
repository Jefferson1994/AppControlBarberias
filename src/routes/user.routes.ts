import { Router } from "express";
import {  UserController } from "../controllers/UserController";

const router = Router();

router.post("/users", UserController.crear);
router.get("/usersListar", UserController.listar);
router.post("/userId", UserController.obtenerPorId);
router.post("/login", UserController.LoginPorMail);

export default router;
