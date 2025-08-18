import express from "express";
import "reflect-metadata";
import { AppDataSource } from "./config/data-source";
import userRoutes from "./routes/user.routes";
import empresaRoutes from "./routes/empresa.routes";
import productosRoutes from "./routes/productos.routes";
import cors from "cors";
import router from "./routes/servicios.routes";


const app = express();
app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(async () => {
    console.log("Base de datos conectada");
    await AppDataSource.runMigrations(); 

    app.use("/api", userRoutes);
    app.use("/empresa", empresaRoutes);
    app.use("/productos", productosRoutes);
    app.use("/servicio", router);

    app.listen(3000, () => {
      console.log("Servidor corriendo en http://localhost:3000");
    });
  })
  .catch((error) => console.error(error));
 

