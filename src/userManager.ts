
import type { Collection, ObjectId, InsertOneResult } from 'mongodb';
import { connectDB } from './db'; // Importamos la función de conexión

// Definimos los roles de usuario
export enum UserRole {
  ADMIN = "admin",
  VALUADOR = "valuador",
  ASESOR = "asesor",
  ALMACENISTA = "almacenista",
  HOJALATERO = "hojalatero",
  PINTOR = "pintor",
  // Añadir otros roles según sea necesario
}

// Definimos la interfaz para los permisos de usuario
export interface UserPermissions {
  verOrdenes?: boolean;
  crearOrdenes?: boolean;
  editarOrdenes?: boolean;
  eliminarOrdenes?: boolean;
  verPresupuestos?: boolean;
  crearPresupuestos?: boolean;
  editarPresupuestos?: boolean;
  eliminarPresupuestos?: boolean;
  verRefacciones?: boolean;
  crearRefacciones?: boolean;
  editarRefacciones?: boolean;
  eliminarRefacciones?: boolean;
  // Añadir más permisos según sea necesario
  [key: string]: boolean | undefined; // Para permitir claves de permiso dinámicas
}

// Interfaz para la estructura de un usuario, actualizada según el nuevo esquema
export interface User {
  _id?: ObjectId; // El ID generado por MongoDB
  idEmpleado: number; // ID personalizado del empleado
  usuario: string; // Nombre de usuario para login
  contraseña?: string; // Contraseña (debería ser hasheada en producción)
  rol: UserRole; // Rol del empleado
  permisos?: UserPermissions; // Permisos específicos del rol o usuario
  // Campos que estaban en la estructura anterior y podrían pertenecer a 'empleados'
  workstation?: string; 
}

// Interfaz para la tabla empleados (separada de users para datos personales/HR)
// Podría ir en su propio manager 'employeeManager.ts' en el futuro
export interface Empleado {
  _id?: ObjectId;
  idUser: number; // Referencia a User.idEmpleado
  nombre: string;
  telefono?: string;
  correo?: string;
  tipo?: string; // ej. "Interno", "Externo"
  puesto?: string; // ej. "Mecánico Jefe", "Valuador Principal"
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
}


class UserManager {
  private collectionPromise: Promise<Collection<User>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      // Consider creating an index on 'usuario' and 'idEmpleado' for faster lookups
      // db.collection<User>('users').createIndex({ usuario: 1 }, { unique: true });
      // db.collection<User>('users').createIndex({ idEmpleado: 1 }, { unique: true });
      return db.collection<User>('users');
    }).catch(err => {
      console.error('Error al obtener la colección de usuarios:', err);
      throw err; 
    });
  }

  private async getCollection(): Promise<Collection<User>> {
    return this.collectionPromise;
  }

  // CREATE: Método para crear un nuevo usuario
  async createUser(userData: Pick<User, 'idEmpleado' | 'usuario' | 'contraseña' | 'rol'> & Partial<Pick<User, 'permisos' | 'workstation'>>): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    if (!userData.idEmpleado || !userData.usuario || !userData.contraseña || !userData.rol) {
      console.error('idEmpleado, usuario, contraseña y rol son requeridos para crear un usuario.');
      return null;
    }

    // Aplicar permisos por defecto basados en rol si no se especifican
    let defaultPermissions: UserPermissions = {};
    if (userData.rol === UserRole.ADMIN) {
        defaultPermissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true, eliminarOrdenes: true, /* ...todos los permisos */ };
    } else if (userData.rol === UserRole.ASESOR) {
        defaultPermissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true };
    }
    // Añadir más lógicas de permisos por defecto para otros roles

    const newUser: Omit<User, '_id'> = {
      idEmpleado: userData.idEmpleado,
      usuario: userData.usuario,
      contraseña: userData.contraseña, // IMPORTANTE: Hashear en una aplicación real
      rol: userData.rol,
      permisos: { ...defaultPermissions, ...userData.permisos },
      workstation: userData.workstation || 'DefaultWorkstation',
    };

    try {
      const result: InsertOneResult<User> = await collection.insertOne(newUser as User);
      console.log('Usuario creado con ID:', result.insertedId);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      // Chequear si el error es por duplicidad de 'usuario' o 'idEmpleado' si tienen índices únicos
      // if (error.code === 11000) { ... }
      throw error;
    }
  }

  // READ: Método para obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    try {
      const users = await collection.find().toArray();
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  // READ: Método para obtener un usuario por su _id de MongoDB
  async getUserById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for getUserById:', id);
        return null;
      }
      const user = await collection.findOne({ _id: new ObjectId(id) });
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  }
  
  // READ: Método para obtener un usuario por su idEmpleado
  async getUserByIdEmpleado(idEmpleado: number): Promise<User | null> {
    const collection = await this.getCollection();
    try {
      const user = await collection.findOne({ idEmpleado: idEmpleado });
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por idEmpleado:', error);
      throw error;
    }
  }


  // READ: Método para obtener un usuario por su nombre de usuario ('usuario')
  async getUserByUsername(username: string): Promise<User | null> {
    const collection = await this.getCollection();
    try {
      const user = await collection.findOne({ usuario: username }); // Campo cambiado a 'usuario'
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por nombre de usuario:', error);
      throw error;
    }
  }

  // UPDATE: Método para actualizar un usuario por su _id de MongoDB
  async updateUser(id: string, updateData: Partial<Omit<User, '_id' | 'idEmpleado' | 'usuario'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for updateUser:', id);
        return false;
      }
      // Los campos idEmpleado y usuario no deberían cambiarse con este método general.
      // Para cambiar contraseña o rol, se deben pasar explícitamente.
      const { idEmpleado, usuario, ...dataToUpdate } = updateData;

      if (Object.keys(dataToUpdate).length === 0) {
        console.log('No fields to update for user ID:', id);
        return false; 
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Usuario actualizado:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // DELETE: Método para eliminar un usuario por su _id de MongoDB
  async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for deleteUser:', id);
        return false;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Usuario eliminado:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }
}

export default UserManager;
