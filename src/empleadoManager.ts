
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
        permissions = { 
          verOrdenes: true, crearOrdenes: true, editarOrdenes: true, eliminarOrdenes: true, 
          verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true, eliminarPresupuestos: true, 
          verRefacciones: true, crearRefacciones: true, editarRefacciones: true, eliminarRefacciones: true,
          gestionarEmpleados: true, gestionarMarcas: true, gestionarAseguradoras: true, gestionarConfigGeneral: true
        };
        break;
      case UserRoleEnum.ASESOR:
        permissions = { 
          verOrdenes: true, crearOrdenes: true, editarOrdenes: true, 
          verPresupuestos: true, crearPresupuestos: true, editarPresupuestos: true 
        };
        break;
      case UserRoleEnum.VALUADOR:
        permissions = { 
          verOrdenes: true, 
          crearPresupuestos: true, editarPresupuestos: true 
        };
        break;
      // Añadir permisos por defecto para otros roles según sea necesario.
    }
    return permissions;
  }

  /**
   * Crea un nuevo empleado. Opcionalmente crea credenciales de usuario del sistema.
   * @param {Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>} empleadoData - Datos básicos para el nuevo empleado.
   * @param {Omit<SystemUserCredentials, 'permisos' | '_id'>} [systemUserData] - Credenciales opcionales de usuario del sistema (usuario, contraseña, rol).
   * @returns {Promise<string | null>} El _id (string hex) del empleado recién creado, o null en caso de fallo.
   * @throws {Error} Si faltan campos requeridos o si el nombre de usuario está duplicado.
   */
  async createEmpleado(
    empleadoData: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>, 
    systemUserData?: Omit<SystemUserCredentials, 'permisos' | '_id'> // Se omite _id aquí porque user no lo tiene
  ): Promise<string | null> {
    console.log("EmpleadoManager: createEmpleado - Iniciando creación...");
    const collection = await this.getCollection();

    if (!empleadoData.nombre || !empleadoData.nombre.trim() || !empleadoData.puesto || !empleadoData.puesto.trim()) {
      console.error("EmpleadoManager: createEmpleado - Nombre y puesto son requeridos.");
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
      console.log("EmpleadoManager: createEmpleado - Creando usuario de sistema para el empleado.");
      newEmpleadoDocument.user = {
        ...systemUserData, // usuario, contraseña, rol
        // IMPORTANTE: En una aplicación real, la contraseña DEBE ser hasheada aquí antes de guardar.
        // ej., contraseña: await hashPassword(systemUserData.contraseña), 
        permisos: this.getDefaultPermissions(systemUserData.rol), // Asignar permisos por defecto basados en el rol.
      };
    } else {
      console.log("EmpleadoManager: createEmpleado - No se crearán credenciales de sistema.");
    }

    try {
      const result: InsertOneResult<Empleado> = await collection.insertOne(newEmpleadoDocument as Empleado);
      console.log('EmpleadoManager: createEmpleado - Empleado creado con ID de MongoDB:', result.insertedId);
      return result.insertedId ? result.insertedId.toHexString() : null;
    } catch (error: any) {
      console.error('EmpleadoManager: Error al crear empleado en DB:', error);
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
    console.log("EmpleadoManager: getAllEmpleados - Obteniendo empleados de la colección...");
    const collection = await this.getCollection();
    try {
      const empleados = await collection.find().sort({ nombre: 1 }).toArray();
      console.log(`EmpleadoManager: getAllEmpleados - ${empleados.length} empleados encontrados en DB.`);
      // Por seguridad, siempre eliminar la contraseña de los detalles del usuario del sistema al listar.
      // Y convertir _id a string.
      const empleadosSerializados = empleados.map(emp => {
        const empForClient: Partial<Empleado> & {_id: string} = { // Asegurar que _id sea string
          ...emp,
          _id: emp._id.toHexString()
        };
        if (empForClient.user) {
          const { contraseña, ...userWithoutPassword } = empForClient.user; // Desestructurar para omitir contraseña.
          empForClient.user = userWithoutPassword;
        }
        return empForClient as Empleado;
      });
      // console.log("EmpleadoManager: getAllEmpleados - Empleados serializados:", JSON.stringify(empleadosSerializados, null, 2).substring(0, 500) + "...");
      return empleadosSerializados;
    } catch (error) {
      console.error('EmpleadoManager: Error al obtener empleados:', error);
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
    console.log("EmpleadoManager: getEmpleadoById - Buscando empleado con ID:", id);
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) { // Validar formato de ObjectId.
        console.warn('EmpleadoManager: Formato de ObjectId inválido para getEmpleadoById:', id);
        return null;
      }
      const empleado = await collection.findOne({ _id: new ObjectId(id) });
      if (!empleado) {
        console.log("EmpleadoManager: getEmpleadoById - Empleado no encontrado.");
        return null;
      }
      console.log("EmpleadoManager: getEmpleadoById - Empleado encontrado:", empleado);

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
      console.error('EmpleadoManager: Error al obtener empleado por ID:', error);
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
    console.log("EmpleadoManager: getEmpleadoByUsername - Buscando empleado con username:", username);
    const collection = await this.getCollection();
    try {
      // Consultar específicamente por el nombre de usuario dentro del objeto 'user' anidado.
      const empleado = await collection.findOne({ "user.usuario": username });
      if (empleado) {
        console.log("EmpleadoManager: getEmpleadoByUsername - Empleado encontrado:", empleado._id.toHexString());
      } else {
        console.log("EmpleadoManager: getEmpleadoByUsername - Empleado no encontrado para username:", username);
      }
      return empleado; // Devolver con contraseña para la verificación de login.
    } catch (error) {
      console.error('EmpleadoManager: Error al obtener empleado por nombre de usuario:', error);
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
    console.log("EmpleadoManager: updateEmpleado - Actualizando empleado ID:", id);
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('EmpleadoManager: Formato de ObjectId inválido para updateEmpleado:', id);
        return false;
      }

      const updateDoc: any = { $set: {}, $unset: {} }; // Preparar documento de actualización para MongoDB.
      
      // Actualizar campos básicos del empleado (nombre, puesto, etc.).
      let hasEmpleadoChanges = false;
      for (const key in empleadoUpdateData) {
        if (Object.prototype.hasOwnProperty.call(empleadoUpdateData, key)) {
          updateDoc.$set[key] = (empleadoUpdateData as any)[key];
          hasEmpleadoChanges = true;
        }
      }

      // Actualizar o crear credenciales de usuario del sistema anidadas.
      let hasUserChanges = false;
      if (systemUserUpdateData) {
        console.log("EmpleadoManager: updateEmpleado - Procesando systemUserUpdateData:", systemUserUpdateData);
        const currentEmpleado = await collection.findOne({_id: new ObjectId(id) }); // Obtener estado actual para el objeto user.
        
        // Caso 1: Creando un nuevo usuario de sistema para un empleado que no tiene uno.
        const creatingUser = !currentEmpleado?.user && systemUserUpdateData.usuario && systemUserUpdateData.contraseña && systemUserUpdateData.rol;
        
        if (creatingUser) {
           console.log("EmpleadoManager: updateEmpleado - Creando nuevo usuario de sistema para empleado ID:", id);
           updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario!;
           // IMPORTANTE: Hashear contraseña en una aplicación real.
           updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña!; 
           updateDoc.$set['user.rol'] = systemUserUpdateData.rol!;
           updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol!);
           hasUserChanges = true;
        } else if (currentEmpleado?.user) { 
            // Caso 2: Modificando un usuario de sistema existente.
            console.log("EmpleadoManager: updateEmpleado - Modificando usuario de sistema existente para empleado ID:", id);
            if (systemUserUpdateData.usuario) { updateDoc.$set['user.usuario'] = systemUserUpdateData.usuario; hasUserChanges = true; }
            if (systemUserUpdateData.contraseña) { // Solo actualizar contraseña si se proporciona una nueva.
                console.log("EmpleadoManager: updateEmpleado - Actualizando contraseña.");
                // IMPORTANTE: Hashear contraseña en una aplicación real.
                updateDoc.$set['user.contraseña'] = systemUserUpdateData.contraseña;
                hasUserChanges = true;
            }
            if (systemUserUpdateData.rol) {
                updateDoc.$set['user.rol'] = systemUserUpdateData.rol;
                // Actualizar permisos si cambia el rol.
                updateDoc.$set['user.permisos'] = this.getDefaultPermissions(systemUserUpdateData.rol); 
                hasUserChanges = true;
            }
        } else if (systemUserUpdateData.usuario || systemUserUpdateData.rol || systemUserUpdateData.contraseña) {
            // Caso donde se intenta crear/modificar usuario pero falta algo (ej, empleado no tiene user y no se proporciona contraseña)
            // Se debería manejar en la lógica de la action o del componente UI, aquí asumimos que los datos vienen validados.
             console.warn("EmpleadoManager: updateEmpleado - Se intentó actualizar/crear usuario pero faltan datos o el empleado no tiene user preexistente:", systemUserUpdateData);
        }
      }
      
      // Si no hay cambios reales, devolver true.
      if (!hasEmpleadoChanges && !hasUserChanges) {
        console.log("EmpleadoManager: updateEmpleado - No hay cambios para aplicar en empleado ID:", id);
        return true; 
      }
      // Limpiar $unset si está vacío.
      if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;
      if (Object.keys(updateDoc.$set).length === 0) delete updateDoc.$set; // Limpiar $set si está vacío después de procesar.

      if (!updateDoc.$set && !updateDoc.$unset) { // Si ambos están vacíos
          console.log("EmpleadoManager: updateEmpleado - No hay operaciones $set o $unset para realizar en empleado ID:", id);
          return true; // No hay nada que actualizar.
      }

      console.log("EmpleadoManager: updateEmpleado - Documento de actualización:", JSON.stringify(updateDoc));
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      console.log("EmpleadoManager: updateEmpleado - Resultado de la actualización:", result);
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('EmpleadoManager: Error al actualizar empleado:', error);
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
    console.log("EmpleadoManager: removeSystemUserFromEmpleado - Removiendo acceso para empleado ID:", empleadoId);
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(empleadoId)) {
        console.warn('EmpleadoManager: Formato de ObjectId inválido para removeSystemUserFromEmpleado:', empleadoId);
        return false;
      }
      // Usar $unset para eliminar todo el subdocumento 'user'.
      const result = await collection.updateOne(
        { _id: new ObjectId(empleadoId) },
        { $unset: { user: "" } } 
      );
      console.log("EmpleadoManager: removeSystemUserFromEmpleado - Resultado:", result);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('EmpleadoManager: Error al remover acceso al sistema del empleado:', error);
      throw error;
    }
  }

  /**
   * Elimina un empleado de la base de datos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del empleado a eliminar.
   * @returns {Promise<boolean>} True si el empleado fue eliminado, false en caso contrario.
   */
  async deleteEmpleado(id: string): Promise<boolean> {
    console.log("EmpleadoManager: deleteEmpleado - Eliminando empleado ID:", id);
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('EmpleadoManager: Formato de ObjectId inválido para deleteEmpleado:', id);
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log("EmpleadoManager: deleteEmpleado - Resultado:", result);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('EmpleadoManager: Error al eliminar empleado:', error);
      throw error;
    }
  }
}

export default EmpleadoManager;
