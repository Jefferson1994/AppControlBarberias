import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Caja } from '../entities/Cajas';
import { Cliente  } from '../entities/Cliente';
import { DetalleFactura } from '../entities/DetalleFactura';
import { Empleado } from '../entities/Empleado';
import { Factura } from '../entities/Facturas';
import { MetodoPago } from '../entities/Metodo_Pago';
import { MovimientoCaja } from '../entities/MovimientoCajas';
import { Negocio } from '../entities/Negocio';
import { Producto } from '../entities/Producto';
import { Servicio } from '../entities/Servicio';
import { Rol } from '../entities/Rol';
import { Otp } from '../entities/Otp';
import { TipoOtp } from '../entities/TipoOtp';


//cadeana local
export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost', // o LAPTOP-UA0JFMK2
  port: 1433,
  username: 'sa',
  password: 'admin',
  database: 'BdAppControlFinancieroBaberia',
  synchronize:  true,
  logging:  false,
  entities: [Usuario, Caja, Cliente, DetalleFactura,Empleado,Factura,
    MetodoPago,MovimientoCaja,Negocio,Producto,Servicio,Rol,Otp,TipoOtp
  ],
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
});


/*export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'SQL1004.site4now.net', // Actualizado según "Data Source"
  port: 1433, // Puerto predeterminado para SQL Server, generalmente 1433
  username: 'db_abced7_jeff1994jsv_admin', // Actualizado según "User Id"
  password: 'J3FF1994jsv123', // Contraseña confirmada
  database: 'db_abced7_jeff1994jsv', // Actualizado según "Initial Catalog"
  synchronize: true, // Sincroniza las entidades con la base de datos (usar con precaución en producción)
  logging: false, // Desactiva el log de consultas SQL en la consola
  entities: [
    Usuario,
    Caja,
    Cliente,
    DetalleFactura,
    Empleado,
    Factura,
    MetodoPago,
    MovimientoCaja,
    Negocio,
    Producto,
    Servicio,
    Rol
  ],
  options: {
    encrypt: true, // Activar encriptación para conexiones a SQL Azure, o si tu servidor lo requiere
    trustServerCertificate: true, // Cambiar a false en producción y proporcionar certificados CA válidos
    enableArithAbort: true, // Habilita la validación de errores aritméticos
  },
});*/