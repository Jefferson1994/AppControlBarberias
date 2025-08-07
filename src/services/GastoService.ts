import { AppDataSource } from '../config/data-source';
import { Gasto } from '../entities/Gasto';
import { TipoGasto } from '../entities/TipoGasto';


const usuarioRepository = AppDataSource.getRepository(Gasto);

const tipoGastosRepository = AppDataSource.getRepository(TipoGasto);

export const obtenerUsuarios = async () => {
  return await usuarioRepository.find();
};

export const crearGasto = async (datos: Partial<Gasto>) => {
  return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
    // Validaciones
    if (!datos.monto) throw new Error("Monto obligatorio");
    if (!datos.descripcion) throw new Error("Descripcion obligatorio");
    if (!datos.fecha) throw new Error("fecha obligatoria");

    const nuevo = transactionalEntityManager.create(Gasto, datos);
    return await transactionalEntityManager.save(Gasto, nuevo);
  });
};

export const obtenerGastoPorId = async (id: number) => {
  return await usuarioRepository.findOneBy({ id });
};

//export const obtenerTiposGastosCategorias = async (id: number) => {
//  return await tipoGastosRepository.findOneBy({ id });
//};

export const obtenerTiposGastosCategorias = async (id: number) => {
  return await tipoGastosRepository.findOne({
    where: { id },
    relations: ["categorias"],  // nombre del campo en TipoGasto que apunta a las categorías
  });
};


//export const obtenerTipoIngresoCategorias= async (id: number) => {
//  return await tipoGastosRepository.findOneBy({ id });
//};

export const obtenerTipoIngresoCategorias = async (id: number) => {
  return await tipoGastosRepository.findOne({
    where: { id },
    relations: ["categorias"],  // nombre del campo en TipoGasto que apunta a las categorías
  });
};

/*export const obtenerGastoxx = async (email: string, password: string): Promise<Gasto | null> => {
  // Buscar usuario por email
//  const usuario = await usuarioRepository.findOneBy({ descripcion });

  console.log("usuario encontrado ", usuario)

  if (!usuario) {
    return null; // No existe usuario con ese email
  }

  // Comparar contraseñas (usa bcrypt)
  //const esValida = await bcrypt.compare(password, usuario.password);
  const esValida = password === usuario.password;

  console.log("es valida  ", esValida)
  if (!esValida) {
    return null; // Contraseña incorrecta
  }

  // Si llega aquí, el login es correcto
  return usuario;
};
*/