import { Router } from "express";
import {  UserController } from "../controllers/UserController";

const router = Router();

router.post("/users", UserController.crear);
router.post("/login", UserController.LoginPorMail);
router.post("/rol", UserController.RolesActivos);
//router.get("/usersListar", UserController.listar);
//router.post("/userId", UserController.obtenerPorId);


export default router;
