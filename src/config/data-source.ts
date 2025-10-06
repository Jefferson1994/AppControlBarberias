import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Caja } from '../entities/Cajas';
import { Cliente  } from '../entities/Cliente';
import { DetalleFactura } from '../entities/DetalleFactura';
import { Colaborador } from '../entities/Colaborador';
import { Factura } from '../entities/Facturas';
import { MetodoPago } from '../entities/Metodo_Pago';
import { MovimientoCaja } from '../entities/MovimientoCajas';
import { Negocio } from '../entities/Negocio';
import { Producto } from '../entities/Producto';
import { Servicio } from '../entities/Servicio';
import { Rol } from '../entities/Rol';
import { Otp } from '../entities/Otp';
import { TipoOtp } from '../entities/TipoOtp';
import { TipoEmpresa } from '../entities/TipoEmpresa';
import { DatosContactoEmpresa} from '../entities/DatosContactoEmpresa';
import { TipoProducto} from '../entities/TipoProducto';
import { TipoServicio} from '../entities/TipoServicio';
import { TipoMovimientoCaja} from '../entities/TipoMovimientoCaja';
import { DetalleVenta} from '../entities/DetalleVenta';
import { Venta} from '../entities/Venta';
import {ParametroSistema } from '../entities/ParametrosSistema'
import {ComprobanteCounter } from '../entities/ComprobanteCounter'
import {Reserva } from '../entities/Reserva'
import {EstadoReserva } from '../entities/EstadoReserva'
import {ImagenEmpresa } from '../entities/ImagenEmpresa'
import {ImagenProducto } from '../entities/ImagenProducto'
import {ImagenServicio } from '../entities/ImagenServicio'
import { ClienteNoRegistrado } from '../entities/ClienteNoRegistrado';

//cadeana local
/*export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost', // o LAPTOP-UA0JFMK2
  port: 1433,
  username: 'sa',
  password: 'admin',
  database: 'BdAppControlFinancieroBaberia',
  synchronize:  true,
  logging:  false,
  entities: [Usuario, Caja, Cliente, DetalleFactura,Colaborador,Factura,
    MetodoPago,MovimientoCaja,Negocio,Producto,Servicio,Rol,Otp,TipoOtp,
    TipoEmpresa,DatosContactoEmpresa,TipoProducto,TipoServicio,TipoMovimientoCaja,
    Venta,DetalleVenta,ParametroSistema,ComprobanteCounter,Reserva,EstadoReserva,
    ImagenEmpresa,ImagenProducto,ImagenServicio,ClienteNoRegistrado
  ],
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
});*/


export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'SQL1004.site4now.net', // Actualizado según "Data Source"
  port: 1433, // Puerto predeterminado para SQL Server, generalmente 1433
  username: 'db_abced7_jeff1994jsv_admin', // Actualizado según "User Id"
  password: 'J3FF1994jsv123', // Contraseña confirmada
  database: 'db_abced7_jeff1994jsv', // Actualizado según "Initial Catalog"
  synchronize: true, // Sincroniza las entidades con la base de datos (usar con precaución en producción)
  logging: false, // Desactiva el log de consultas SQL en la consola
  entities: [
    Usuario,Caja,
    Cliente,DetalleFactura,
    Colaborador,Factura,
    MetodoPago,MovimientoCaja,
    Negocio,Producto,
    Servicio,Rol,
    Otp,TipoOtp,
    TipoEmpresa,DatosContactoEmpresa,
    TipoProducto,TipoServicio,
    TipoMovimientoCaja,Venta,
    DetalleVenta,ParametroSistema,
    ComprobanteCounter,Reserva,EstadoReserva,
    ImagenEmpresa,ImagenProducto,ImagenServicio,
    ClienteNoRegistrado
  ],
  options: {
    encrypt: true, // Activar encriptación para conexiones a SQL Azure, o si tu servidor lo requiere
    trustServerCertificate: true, // Cambiar a false en producción y proporcionar certificados CA válidos
    enableArithAbort: true, // Habilita la validación de errores aritméticos
  },
});

