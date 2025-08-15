import express from "express";
import "reflect-metadata";
import { AppDataSource } from "./config/data-source";
import userRoutes from "./routes/user.routes";
import empresaRoutes from "./routes/empresa.routes";
import cors from "cors";


const app = express();
app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(async () => {
    console.log("Base de datos conectada");
    await AppDataSource.runMigrations(); 

    app.use("/api", userRoutes);
    app.use("/empresa", empresaRoutes);

    app.listen(3000, () => {
      console.log("Servidor corriendo en http://localhost:3000");
    });
  })
  .catch((error) => console.error(error));
 

