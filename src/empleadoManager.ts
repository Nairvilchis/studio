
'use server';
/**
 * @fileOverview Manages employee (Empleado) operations with MongoDB.
 * Handles CRUD for employees and their optional nested system user credentials.
 * @remarks
 * Esta clase utiliza la directiva 'use server' para indicar que solo debe ejecutarse en el servidor.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult } from './db';
import { connectDB } from './db';
import type { Empleado, SystemUserCredentials, UserPermissions, UserRole } from '@/lib/types';
import { UserRole as UserRoleEnum } from '@/lib/types'; // Enum for runtime use

/**
 * Clase responsable de gestionar operaciones CRUD para Empleados
 * y sus credenciales de usuario de sistema anidadas opcionales en la base de datos MongoDB.
 */
class EmpleadoManager {
  private collectionPromise: Promise<Collection<Empleado>>;

  /**
   * Constructor de EmpleadoManager.
   * Inicializa la promesa de conexión a la colección 'empleados' en MongoDB.
   * Crea índices en 'user.usuario' (único parcial) y 'nombre'.
   */
  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const empleadosCollection = db.collection<Empleado>('empleados');
      // Crear un índice único en 'user.usuario' si existe.
      // Esto asegura que los nombres de usuario sean únicos entre los empleados con acceso al sistema.
      empleadosCollection.createIndex({ "user.usuario": 1 }, { unique: true, partialFilterExpression: { "user.usuario": { $exists: true } } })
        .catch(err => { if (err.code !== 11000) console.warn('Failed to create index on empleados.user.usuario:', err);});
      // Índice en el nombre del empleado para ordenar o buscar.
      empleadosCollection.createIndex({ nombre: 1 })
        .catch(err => { if (err.code !== 11000) console.warn('Failed to create index on empleados.nombre:', err);});
      return empleadosCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de empleados:', err);
      throw err;
    });
  }

  /**
   * Obtiene la colección MongoDB para empleados.
   * @returns {Promise<Collection<Empleado>>} La colección de empleados.
   * @private
   */
  private async getCollection(): Promise<Collection<Empleado>> {
    return this.collectionPromise;
  }

  /**
   * Obtiene los permisos por defecto basados en el rol del usuario.
   * @param {UserRole} rol - El rol del usuario.
   * @returns {UserPermissions} Los permisos por defecto para ese rol.
   * @private
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
      // Añadir permisos por defecto para otros roles según sea necesario.
    }
    return permissions;
  }

  /**
   * Crea un nuevo empleado. Opcionalmente crea credenciales de usuario del sistema.
   * @param {Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>} empleadoData - Datos básicos para el nuevo empleado.
   * @param {Omit<SystemUserCredentials, 'permisos'>} [systemUserData] - Credenciales opcionales de usuario del sistema (usuario, contraseña, rol).
   * @returns {Promise<ObjectId | null>} El ObjectId de MongoDB del empleado recién creado, o null en caso de fallo.
   * @throws {Error} Si faltan campos requeridos o si el nombre de usuario está duplicado.
   */
  async createEmpleado(
    empleadoData: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>, 
    systemUserData?: Omit<SystemUserCredentials, 'permisos' | '_id'> // Se omite _id aquí porque user no lo tiene
  ): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    if (!empleadoData.nombre || !empleadoData.puesto) {
      throw new Error('Nombre y puesto son requeridos para crear un empleado.');
    }

    // Preparar el documento base del empleado.
    const newEmpleadoDocument: Omit<Empleado, '_id'> = {
      ...empleadoData, // Extender datos básicos del empleado.
      fechaRegistro: new Date(), // Establecer fecha de registro.
      // El campo user se añadirá a continuación si se proporcionan systemUserData.
    };

    // Si se proporcionan datos de usuario del sistema, crear el objeto user anidado.
    if (systemUserData && systemUserData.usuario && systemUserData.contraseña && systemUserData.rol) {
      newEmpleadoDocument.user = {
        ...systemUserData, // usuario, contraseña, rol
        // IMPORTANTE: En una aplicación real, la contraseña DEBE ser hasheada aquí antes de guardar.
        // ej., contraseña: await hashPassword(systemUserData.contraseña), 
        permisos: this.getDefaultPermissions(systemUserData.rol), // Asignar permisos por defecto basados en el rol.
      };
    }

    try {
      const result: InsertOneResult<Empleado> = await collection.insertOne(newEmpleadoDocument as Empleado);
      console.log('Empleado creado con ID:', result.insertedId);
      return result.insertedId;
    } catch (error: any) {
      console.error('Error al crear empleado:', error);
      // Manejar error de nombre de usuario duplicado.
      if (error.code === 11000 && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserData?.usuario}" ya está en uso.`);
      }
      throw error; // Relanzar otros errores.
    }
  }

  /**
   * Obtiene todos los empleados, ordenados por nombre.
   * Las contraseñas se eliminan de los detalles del usuario por seguridad.
   * @returns {Promise<Empleado[]>} Una lista de todos los empleados, con _id como string.
   */
  async getAllEmpleados(): Promise<Empleado[]> {
    const collection = await this.getCollection();
    try {
      const empleados = await collection.find().sort({ nombre: 1 }).toArray();
      // Por seguridad, siempre eliminar la contraseña de los detalles del usuario del sistema al listar.
      // Y convertir _id a string.
      return empleados.map(emp => {
        const empForClient: Partial<Empleado> & {_id: string} = {
          ...emp,
          _id: emp._id.toHexString()
        };
        if (empForClient.user) {
          const { contraseña, ...userWithoutPassword } = empForClient.user; // Desestructurar para omitir contraseña.
          empForClient.user = userWithoutPassword;
        }
        return empForClient as Empleado;
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  }

  /**
   * Obtiene un único empleado por su `_id` de MongoDB (como string).
   * La contraseña se elimina de los detalles del usuario si está presente.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del empleado.
   * @returns {Promise<Empleado | null>} El objeto empleado con `_id` como string, o null si no se encuentra o el ID es inválido.
   */
  async getEmpleadoById(id: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) { // Validar formato de ObjectId.
        console.warn('Formato de ObjectId inválido para getEmpleadoById:', id);
        return null;
      }
      const empleado = await collection.findOne({ _id: new ObjectId(id) });
      if (!empleado) return null;

      const empForClient: Partial<Empleado> & {_id: string} = {
        ...empleado,
        _id: empleado._id.toHexString()
      };
      // Eliminar contraseña si existen detalles de usuario.
      if (empForClient.user) {
        const { contraseña, ...userWithoutPassword } = empForClient.user;
        empForClient.user = userWithoutPassword;
      }
      return empForClient as Empleado;
    } catch (error) {
      console.error('Error al obtener empleado por ID:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene un único empleado por su nombre de usuario del sistema.
   * Este método se usa típicamente para el login y devuelve el empleado CON la contraseña.
   * @param {string} username - El nombre de usuario del sistema.
   * @returns {Promise<Empleado | null>} El objeto empleado (incluyendo contraseña), o null si no se encuentra.
   */
  async getEmpleadoByUsername(username: string): Promise<Empleado | null> {
    const collection = await this.getCollection();
    try {
      // Consultar específicamente por el nombre de usuario dentro del objeto 'user' anidado.
      const empleado = await collection.findOne({ "user.usuario": username });
      return empleado; // Devolver con contraseña para la verificación de login.
    } catch (error) {
      console.error('Error al obtener empleado por nombre de usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de un empleado y/o sus credenciales de usuario del sistema.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del empleado a actualizar.
   * @param {Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>} empleadoUpdateData - Datos a actualizar para el empleado.
   * @param {Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string }} [systemUserUpdateData] - Datos opcionales para actualizar/crear credenciales de usuario del sistema. `contraseña` es opcional para permitir cambios de rol/usuario sin cambiar contraseña.
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si el nombre de usuario está duplicado.
   */
  async updateEmpleado(
    id: string, 
    empleadoUpdateData: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>,
    systemUserUpdateData?: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string }
  ): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateEmpleado:', id);
        return false;
      }

      const updateDoc: any = { $set: {}, $unset: {} }; // Preparar documento de actualización para MongoDB.
      
      // Actualizar campos básicos del empleado (nombre, puesto, etc.).
      for (const key in empleadoUpdateData) {
        if (Object.prototype.hasOwnProperty.call(empleadoUpdateData, key)) {
          updateDoc.$set[key] = (empleadoUpdateData as any)[key];
        }
      }

      // Actualizar o crear credenciales de usuario del sistema anidadas.
      if (systemUserUpdateData) {
        const currentEmpleado = await collection.findOne({_id: new ObjectId(id) }); // Obtener estado actual para el objeto user.
        
        // Caso 1: Creando un nuevo usuario de sistema para un empleado que no tiene uno.
        const creatingUser = !currentEmpleado?.user && systemUserUpdateData.usuario && systemUserUpdateData.contraseña && systemUserUpdateData.rol;
        
        if (creatingUser) {
           updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario!;
           // IMPORTANTE: Hashear contraseña en una aplicación real.
           updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña!; 
           updateDoc.$set['user.rol'] = systemUserUpdateData.rol!;
           updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol!);
        } else if (currentEmpleado?.user) { 
            // Caso 2: Modificando un usuario de sistema existente.
            if (systemUserUpdateData.usuario) updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario;
            if (systemUserUpdateData.contraseña) { // Solo actualizar contraseña si se proporciona.
                // IMPORTANTE: Hashear contraseña en una aplicación real.
                updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña;
            }
            if (systemUserUpdateData.rol) {
                updateDoc.$set['user.rol'] = systemUserUpdateData.rol;
                // Actualizar permisos si cambia el rol.
                updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol); 
            }
        }
      }
      
      // Si no hay cambios reales, devolver true.
      if (Object.keys(updateDoc.$set).length === 0 && Object.keys(updateDoc.$unset).length === 0) {
        return true; 
      }
      // Limpiar $unset si está vacío.
      if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar empleado:', error);
      // Manejar error de nombre de usuario duplicado.
      if (error.code === 11000 && systemUserUpdateData?.usuario && error.message.includes('user.usuario_1')) {
        throw new Error(`El nombre de usuario "${systemUserUpdateData.usuario}" ya está en uso.`);
      }
      throw error;
    }
  }

  /**
   * Elimina las credenciales de usuario del sistema de un empleado, deshabilitando efectivamente su acceso al sistema.
   * @param {string} empleadoId - La cadena hexadecimal del ObjectId de MongoDB del empleado.
   * @returns {Promise<boolean>} True si se eliminó el acceso al sistema, false en caso contrario.
   */
  async removeSystemUserFromEmpleado(empleadoId: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(empleadoId)) {
        console.warn('Formato de ObjectId inválido para removeSystemUserFromEmpleado:', empleadoId);
        return false;
      }
      // Usar $unset para eliminar todo el subdocumento 'user'.
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
   * Elimina un empleado de la base de datos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del empleado a eliminar.
   * @returns {Promise<boolean>} True si el empleado fue eliminado, false en caso contrario.
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
