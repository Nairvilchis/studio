
'use server';

import type { Collection, ObjectId, InsertOneResult } from 'mongodb';
import { connectDB } from './db';
import type { User, UserPermissions } from '@/lib/types'; // Import from new types file
import { UserRole } from '@/lib/types'; // Import from new types file


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
      const usersCollection = db.collection<User>('users');
      usersCollection.createIndex({ usuario: 1 }, { unique: true }).catch(console.warn);
      usersCollection.createIndex({ idEmpleado: 1 }, { unique: true }).catch(console.warn);
      return usersCollection;
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
      throw new Error('idEmpleado, usuario, contraseña y rol son requeridos para crear un usuario.');
    }

    // Aplicar permisos por defecto basados en rol si no se especifican
    let defaultPermissions: UserPermissions = {};
    if (userData.rol === UserRole.ADMIN) {
        defaultPermissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true, eliminarOrdenes: true, verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true, eliminarPresupuestos: true, verRefacciones: true, crearRefacciones: true, editarRefacciones: true, eliminarRefacciones: true };
    } else if (userData.rol === UserRole.ASESOR) {
        defaultPermissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true, verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true };
    } else if (userData.rol === UserRole.VALUADOR) {
        defaultPermissions = { verOrdenes: true, crearPresupuestos: true, editarPresupuestos: true };
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
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      if (error.code === 11000) { // Duplicate key error
        if (error.message.includes('usuario_1')) {
          throw new Error(`El nombre de usuario "${newUser.usuario}" ya existe.`);
        } else if (error.message.includes('idEmpleado_1')) {
          throw new Error(`El ID de empleado "${newUser.idEmpleado}" ya está en uso.`);
        }
      }
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
        console.warn('Invalid ObjectId format for getUserById:', id);
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
      const user = await collection.findOne({ usuario: username });
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por nombre de usuario:', error);
      throw error;
    }
  }

  // UPDATE: Método para actualizar un usuario por su _id de MongoDB
  async updateUser(id: string, updateData: Partial<Omit<User, '_id' | 'idEmpleado'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for updateUser:', id);
        return false;
      }
      
      const { idEmpleado, ...dataToUpdate } = updateData; // idEmpleado no se debe modificar aquí

      if (Object.keys(dataToUpdate).length === 0) {
        console.log('No fields to update for user ID:', id);
        return true; 
      }

      // Si se intenta actualizar 'usuario' y ya existe, MongoDB lanzará un error 11000
      // que se manejará en la capa de actions.

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Usuario actualizado:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      if (error.code === 11000 && updateData.usuario) {
         throw new Error(`El nombre de usuario "${updateData.usuario}" ya está en uso.`);
      }
      throw error;
    }
  }

  // DELETE: Método para eliminar un usuario por su _id de MongoDB
  async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for deleteUser:', id);
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
