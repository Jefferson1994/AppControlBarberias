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
    MetodoPago,MovimientoCaja,Negocio,Producto,Servicio
  ],
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
});

// cadena para desplegar en servidor ahora local

/*
export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'sql1002.site4now.net',
  port: 1433, // Puerto predeterminado para SQL Server
  username: 'db_ab9b38_pruebasjeff_admin', // Usuario
  password: 'J3FF1994jsv12345', // Contraseña
  database: 'BaseAppControlFinancieroBaberia', // Nombre de la base de datos
  synchronize: true, // Sincroniza las entidades con la base de datos
  logging: false, // Log de consultas SQL
  entities: [Usuario, Caja, Cliente, DetalleFactura,Empleado,Factura,
    MetodoPago,MovimientoCaja,Negocio,Producto,Servicio

  ]
  options: {
    encrypt: true, // Activar encriptación si es necesario
    enableArithAbort: true, // Habilita la validación de errores aritméticos
  },
});*/
