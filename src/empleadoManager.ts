
'use server';

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult } from 'mongodb';
import { connectDB } from './db';
import type { Empleado, SystemUserCredentials, UserPermissions, UserRole } from '@/lib/types';
import { UserRole as UserRoleEnum } from '@/lib/types'; // Enum for runtime use

class EmpleadoManager {
  private collectionPromise: Promise<Collection<Empleado>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const empleadosCollection = db.collection<Empleado>('empleados');
      // Index for unique username if user credentials exist
      empleadosCollection.createIndex({ "user.usuario": 1 }, { unique: true, partialFilterExpression: { "user.usuario": { $exists: true } } }).catch(console.warn);
      empleadosCollection.createIndex({ nombre: 1 }).catch(console.warn);
      return empleadosCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de empleados:', err);
      throw err;
    });
  }

  private async getCollection(): Promise<Collection<Empleado>> {
    return this.collectionPromise;
  }

  private getDefaultPermissions(rol: UserRole): UserPermissions {
    let permissions: UserPermissions = {};
    switch (rol) {
      case UserRoleEnum.ADMIN:
        permissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true, eliminarOrdenes: true, verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true, eliminarPresupuestos: true, verRefacciones: true, crearRefacciones: true, editarRefacciones: true, eliminarRefacciones: true };
        break;
      case UserRoleEnum.ASESOR:
        permissions = { verOrdenes: true, crearOrdenes: true, editarOrdenes: true, verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true };
        break;
      case UserRoleEnum.VALUADOR:
        permissions = { verOrdenes: true, crearPresupuestos: true, editarPresupuestos: true };
        break;
      // Add other roles as needed
    }
    return permissions;
  }

  async createEmpleado(empleadoData: Omit<Empleado, '_id' | 'fechaRegistro'>, systemUserData?: Omit<SystemUserCredentials, 'permisos' | '_id'>): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    if (!empleadoData.nombre || !empleadoData.puesto) {
      throw new Error('Nombre y puesto son requeridos para crear un empleado.');
    }

    const newEmpleadoDocument: Omit<Empleado, '_id'> = {
      ...empleadoData,
      fechaRegistro: new Date(),
    };

    if (systemUserData && systemUserData.usuario && systemUserData.contraseña && systemUserData.rol) {
      newEmpleadoDocument.user = {
        ...systemUserData,
        // En una app real, la contraseña DEBE ser hasheada aquí antes de guardarla.
        // contraseña: await hashPassword(systemUserData.contraseña), 
        permisos: this.getDefaultPermissions(systemUserData.rol),
      };
    }

    try {
      const result: InsertOneResult<Empleado> = await collection.insertOne(newEmpleadoDocument as Empleado);
      console.log('Empleado creado con ID:', result.insertedId);
      return result.insertedId;
    } catch (error: any) {
      console.error('Error al crear empleado:', error);
      if (error.code === 11000 && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserData?.usuario}" ya está en uso.`);
      }
      throw error;
    }
  }

  async getAllEmpleados(): Promise<Empleado[]> {
    const collection = await this.getCollection();
    try {
      const empleados = await collection.find().sort({ nombre: 1 }).toArray();
      // For security, always remove password from system user details when listing
      return empleados.map(emp => {
        if (emp.user) {
          const { contraseña, ...userWithoutPassword } = emp.user;
          return { ...emp, user: userWithoutPassword };
        }
        return emp;
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  }

  async getEmpleadoById(id: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        return null;
      }
      const empleado = await collection.findOne({ _id: new ObjectId(id) });
      if (empleado?.user) {
        const { contraseña, ...userWithoutPassword } = empleado.user;
        return { ...empleado, user: userWithoutPassword };
      }
      return empleado;
    } catch (error) {
      console.error('Error al obtener empleado por ID:', error);
      throw error;
    }
  }
  
  async getEmpleadoByUsername(username: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      // This query specifically looks for the username within the nested 'user' object.
      // It returns the full employee document, including the hashed password.
      const empleado = await collection.findOne({ "user.usuario": username });
      return empleado; // Return with password for login check
    } catch (error) {
      console.error('Error al obtener empleado por nombre de usuario:', error);
      throw error;
    }
  }

  async updateEmpleado(id: string, empleadoUpdateData: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>, systemUserUpdateData?: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        return false;
      }

      const updateDoc: any = { $set: {}, $unset: {} };
      
      // Update basic employee fields
      for (const key in empleadoUpdateData) {
        if (Object.prototype.hasOwnProperty.call(empleadoUpdateData, key)) {
          updateDoc.$set[key] = (empleadoUpdateData as any)[key];
        }
      }

      // Update nested system user credentials
      if (systemUserUpdateData) {
        const currentEmpleado = await this.getEmpleadoById(id);
        const creatingUser = !currentEmpleado?.user && systemUserUpdateData.usuario && systemUserUpdateData.contraseña && systemUserUpdateData.rol;
        
        if (creatingUser) {
           updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario;
           // HASHEAR CONTRASEÑA AQUÍ
           updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña; 
           updateDoc.$set['user.rol'] = systemUserUpdateData.rol;
           updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol!);
        } else if (currentEmpleado?.user) { // Only update existing user fields
            if (systemUserUpdateData.usuario) updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario;
            if (systemUserUpdateData.contraseña) {
                // HASHEAR CONTRASEÑA AQUÍ
                updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña;
            }
            if (systemUserUpdateData.rol) {
                updateDoc.$set['user.rol'] = systemUserUpdateData.rol;
                updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol); // Update permissions if role changes
            }
        }
      }
      
      if (Object.keys(updateDoc.$set).length === 0 && Object.keys(updateDoc.$unset).length === 0) {
        return true; // No actual changes
      }
      if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;


      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar empleado:', error);
      if (error.code === 11000 && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserUpdateData?.usuario}" ya está en uso.`);
      }
      throw error;
    }
  }

  async removeSystemUserFromEmpleado(empleadoId: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(empleadoId)) return false;
      const result = await collection.updateOne(
        { _id: new ObjectId(empleadoId) },
        { $unset: { user: "" } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al remover acceso al sistema del empleado:', error);
      throw error;
    }
  }

  async deleteEmpleado(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      throw error;
    }
  }
}

export default EmpleadoManager;
