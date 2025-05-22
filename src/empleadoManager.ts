
'use server';
/**
 * @fileOverview Manages employee (Empleado) operations with MongoDB.
 * Handles CRUD for employees and their optional nested system user credentials.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult } from 'mongodb';
import { connectDB } from './db';
import type { Empleado, SystemUserCredentials, UserPermissions, UserRole } from '@/lib/types';
import { UserRole as UserRoleEnum } from '@/lib/types'; // Enum for runtime use

class EmpleadoManager {
  private collectionPromise: Promise<Collection<Empleado>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const empleadosCollection = db.collection<Empleado>('empleados');
      // Create a unique index on 'user.usuario' if it exists.
      // This ensures usernames are unique across employees with system access.
      empleadosCollection.createIndex({ "user.usuario": 1 }, { unique: true, partialFilterExpression: { "user.usuario": { $exists: true } } }).catch(console.warn);
      // Index on employee name for sorting or searching.
      empleadosCollection.createIndex({ nombre: 1 }).catch(console.warn);
      return empleadosCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de empleados:', err);
      throw err;
    });
  }

  /**
   * Retrieves the MongoDB collection for employees.
   * @returns {Promise<Collection<Empleado>>} The employee collection.
   */
  private async getCollection(): Promise<Collection<Empleado>> {
    return this.collectionPromise;
  }

  /**
   * Gets default permissions based on user role.
   * @param {UserRole} rol The role of the user.
   * @returns {UserPermissions} The default permissions for that role.
   */
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
      // Add default permissions for other roles as needed.
    }
    return permissions;
  }

  /**
   * Creates a new employee. Optionally creates system user credentials.
   * @param {Omit<Empleado, '_id' | 'fechaRegistro'>} empleadoData Data for the new employee.
   * @param {Omit<SystemUserCredentials, 'permisos' | '_id'>} [systemUserData] Optional system user credentials.
   * @returns {Promise<ObjectId | null>} The MongoDB ObjectId of the newly created employee, or null on failure.
   * @throws Will throw an error if required fields are missing or if username is duplicate.
   */
  async createEmpleado(empleadoData: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>, systemUserData?: Omit<SystemUserCredentials, 'permisos' | '_id'>): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    if (!empleadoData.nombre || !empleadoData.puesto) {
      throw new Error('Nombre y puesto son requeridos para crear un empleado.');
    }

    // Prepare the base employee document.
    const newEmpleadoDocument: Omit<Empleado, '_id'> = {
      ...empleadoData, // Spread basic employee data.
      fechaRegistro: new Date(), // Set registration date.
      // user field will be added below if systemUserData is provided.
    };

    // If system user data is provided, create the nested user object.
    if (systemUserData && systemUserData.usuario && systemUserData.contraseña && systemUserData.rol) {
      newEmpleadoDocument.user = {
        ...systemUserData,
        // IMPORTANT: In a real application, the password MUST be hashed here before saving.
        // e.g., contraseña: await hashPassword(systemUserData.contraseña), 
        permisos: this.getDefaultPermissions(systemUserData.rol), // Assign default permissions based on role.
      };
    }

    try {
      const result: InsertOneResult<Empleado> = await collection.insertOne(newEmpleadoDocument as Empleado);
      console.log('Empleado creado con ID:', result.insertedId);
      return result.insertedId;
    } catch (error: any) {
      console.error('Error al crear empleado:', error);
      // Handle duplicate username error.
      if (error.code === 11000 && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserData?.usuario}" ya está en uso.`);
      }
      throw error; // Re-throw other errors.
    }
  }

  /**
   * Retrieves all employees, sorted by name.
   * Passwords are removed from the user details for security.
   * @returns {Promise<Empleado[]>} A list of all employees.
   */
  async getAllEmpleados(): Promise<Empleado[]> {
    const collection = await this.getCollection();
    try {
      const empleados = await collection.find().sort({ nombre: 1 }).toArray();
      // For security, always remove password from system user details when listing.
      return empleados.map(emp => {
        if (emp.user) {
          const { contraseña, ...userWithoutPassword } = emp.user; // Destructure to omit password.
          return { ...emp, user: userWithoutPassword };
        }
        return emp;
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single employee by their MongoDB ObjectId.
   * Password is removed from user details if present.
   * @param {string} id The MongoDB ObjectId string of the employee.
   * @returns {Promise<Empleado | null>} The employee object or null if not found or ID is invalid.
   */
  async getEmpleadoById(id: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) { // Validate ObjectId format.
        console.warn('Formato de ObjectId inválido para getEmpleadoById:', id);
        return null;
      }
      const empleado = await collection.findOne({ _id: new ObjectId(id) });
      // Remove password if user details exist.
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
  
  /**
   * Retrieves a single employee by their system username.
   * This method is typically used for login and returns the employee with the password.
   * @param {string} username The system username.
   * @returns {Promise<Empleado | null>} The employee object (including password) or null if not found.
   */
  async getEmpleadoByUsername(username: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      // Query specifically for the username within the nested 'user' object.
      const empleado = await collection.findOne({ "user.usuario": username });
      return empleado; // Return with password for login check.
    } catch (error) {
      console.error('Error al obtener empleado por nombre de usuario:', error);
      throw error;
    }
  }

  /**
   * Updates an employee's data and/or their system user credentials.
   * @param {string} id The MongoDB ObjectId string of the employee to update.
   * @param {Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>} empleadoUpdateData Data to update for the employee.
   * @param {Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>>} [systemUserUpdateData] Optional data to update/create system user credentials.
   * @returns {Promise<boolean>} True if the update was successful (modified count > 0), false otherwise.
   * @throws Will throw an error if username is duplicate.
   */
  async updateEmpleado(
    id: string, 
    empleadoUpdateData: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>,
    systemUserUpdateData?: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>>
  ): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateEmpleado:', id);
        return false;
      }

      const updateDoc: any = { $set: {}, $unset: {} }; // Prepare update document for MongoDB.
      
      // Update basic employee fields (nombre, puesto, etc.).
      for (const key in empleadoUpdateData) {
        if (Object.prototype.hasOwnProperty.call(empleadoUpdateData, key)) {
          updateDoc.$set[key] = (empleadoUpdateData as any)[key];
        }
      }

      // Update or create nested system user credentials.
      if (systemUserUpdateData) {
        const currentEmpleado = await collection.findOne({_id: new ObjectId(id) }); // Fetch current state for user object.
        
        // Case 1: Creating a new system user for an employee who doesn't have one.
        const creatingUser = !currentEmpleado?.user && systemUserUpdateData.usuario && systemUserUpdateData.contraseña && systemUserUpdateData.rol;
        
        if (creatingUser) {
           updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario!;
           // IMPORTANT: Hash password in a real application.
           updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña!; 
           updateDoc.$set['user.rol'] = systemUserUpdateData.rol!;
           updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol!);
        } else if (currentEmpleado?.user) { 
            // Case 2: Modifying an existing system user.
            if (systemUserUpdateData.usuario) updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario;
            if (systemUserUpdateData.contraseña) {
                // IMPORTANT: Hash password in a real application.
                updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña;
            }
            if (systemUserUpdateData.rol) {
                updateDoc.$set['user.rol'] = systemUserUpdateData.rol;
                // Update permissions if role changes.
                updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol); 
            }
        }
      }
      
      // If no actual changes are being made, return true.
      if (Object.keys(updateDoc.$set).length === 0 && Object.keys(updateDoc.$unset).length === 0) {
        return true; 
      }
      // Clean up $unset if it's empty.
      if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar empleado:', error);
      // Handle duplicate username error.
      if (error.code === 11000 && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserUpdateData?.usuario}" ya está en uso.`);
      }
      throw error;
    }
  }

  /**
   * Removes the system user credentials from an employee, effectively disabling their system access.
   * @param {string} empleadoId The MongoDB ObjectId string of the employee.
   * @returns {Promise<boolean>} True if system access was removed, false otherwise.
   */
  async removeSystemUserFromEmpleado(empleadoId: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(empleadoId)) return false;
      // Uses $unset to remove the entire 'user' subdocument.
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

  /**
   * Deletes an employee from the database.
   * @param {string} id The MongoDB ObjectId string of the employee to delete.
   * @returns {Promise<boolean>} True if the employee was deleted, false otherwise.
   */
  async deleteEmpleado(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para deleteEmpleado:', id);
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
