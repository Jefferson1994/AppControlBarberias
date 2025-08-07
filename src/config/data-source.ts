import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Gasto } from '../entities/Gasto';
import { TipoGasto } from '../entities/TipoGasto';
import { CategoriaGasto } from '../entities/CategoriaGasto';

//cadeana local
/*export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost', // o LAPTOP-UA0JFMK2
  port: 1433,
  username: 'sa',
  password: 'admin',
  database: 'BasecontrolGastos',
  synchronize:  true,
  logging:  false,
  entities: [Usuario, Gasto, TipoGasto, CategoriaGasto],
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
});*/
export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'sql1002.site4now.net',
  port: 1433, // Puerto predeterminado para SQL Server
  username: 'db_ab9b38_pruebasjeff_admin', // Usuario
  password: 'J3FF1994jsv12345', // Contraseña
  database: 'db_ab9b38_pruebasjeff', // Nombre de la base de datos
  synchronize: true, // Sincroniza las entidades con la base de datos
  logging: false, // Log de consultas SQL
  entities: [Usuario, Gasto, TipoGasto, CategoriaGasto], // Entidades de TypeORM
  options: {
    encrypt: true, // Activar encriptación si es necesario
    enableArithAbort: true, // Habilita la validación de errores aritméticos
  },
});
