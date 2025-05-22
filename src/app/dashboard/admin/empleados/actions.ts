
'use server';

import EmpleadoManager from '@/empleadoManager';
import type { Empleado, SystemUserCredentials, UserRole as UserRoleType } from '@/lib/types';
import { UserRole } from '@/lib/types'; // Enum for runtime use

/**
 * Interface for the result of server actions.
 * @template T The type of data returned on success.
 */
interface ActionResult<T> {
  success: boolean; // Indicates if the action was successful.
  data?: T; // Data returned by the action on success.
  error?: string; // Error message if the action failed.
  message?: string; // Optional success or informational message.
}

/**
 * Helper to serialize an Empleado object from the database format to a client-friendly format.
 * Specifically, it ensures the MongoDB _id (ObjectId) is a hex string and removes the password from the user object.
 * It also handles date conversion if dates are stored as strings.
 * @param {any} empleadoFromDb - The raw empleado object from MongoDB.
 * @returns {Empleado} The serialized empleado object.
 */
function serializeEmpleado(empleadoFromDb: any): Empleado {
  const serialized = {
    ...empleadoFromDb,
    _id: empleadoFromDb._id ? empleadoFromDb._id.toHexString() : undefined,
  };
  // Ensure 'user' exists and then remove 'contraseña'
  if (serialized.user && serialized.user.contraseña) {
    delete serialized.user.contraseña;
  }
  // Convert date strings to Date objects if they are stored as strings
  if (serialized.fechaRegistro && typeof serialized.fechaRegistro === 'string') {
    serialized.fechaRegistro = new Date(serialized.fechaRegistro);
  }
  if (serialized.fechaBaja && typeof serialized.fechaBaja === 'string') {
    serialized.fechaBaja = new Date(serialized.fechaBaja);
  }
  return serialized as Empleado;
}

/**
 * Serializes an array of Empleado objects.
 * @param {any[]} empleadosFromDb - Array of raw empleado objects from MongoDB.
 * @returns {Empleado[]} Array of serialized empleado objects.
 */
function serializeEmpleados(empleadosFromDb: any[]): Empleado[] {
  return empleadosFromDb.map(serializeEmpleado);
}

/**
 * Server Action to get all employees.
 * @returns {Promise<ActionResult<Empleado[]>>} Result object with an array of employees or an error.
 */
export async function getAllEmpleadosAction(): Promise<ActionResult<Empleado[]>> {
  const manager = new EmpleadoManager();
  try {
    const dataFromDB = await manager.getAllEmpleados();
    // getAllEmpleados already returns Empleado[] with _id as string and password removed.
    // Further serialization here ensures dates are Date objects if they weren't already.
    return { success: true, data: serializeEmpleados(dataFromDB) };
  } catch (error) {
    console.error("Server action getAllEmpleadosAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener empleados." };
  }
}

/**
 * Server Action to create a new employee.
 * @param {Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>} empleadoData - Basic data for the new employee.
 * @param {Omit<SystemUserCredentials, 'permisos' | '_id'>} [systemUserData] - Optional system user credentials (usuario, contraseña, rol).
 * @returns {Promise<ActionResult<{ empleadoId: string | null }>>} Result object with the new employee's MongoDB _id (as string) or an error.
 */
export async function createEmpleadoAction(
  empleadoData: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>, 
  systemUserData?: Omit<SystemUserCredentials, 'permisos' | '_id'>
): Promise<ActionResult<{ empleadoId: string | null }>> {
  const manager = new EmpleadoManager();
  try {
    const newMongoIdObject = await manager.createEmpleado(empleadoData, systemUserData);
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Empleado creado exitosamente.',
        data: { empleadoId: newMongoIdObject.toHexString() } // Convert ObjectId to string for the client.
      };
    } else {
      return { success: false, error: 'No se pudo crear el empleado (manager retornó null).' };
    }
  } catch (error) {
    console.error("Server action createEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear empleado." };
  }
}

/**
 * Server Action to get an employee by their MongoDB _id (string).
 * @param {string} id - The MongoDB _id (as a hex string) of the employee.
 * @returns {Promise<ActionResult<Empleado | null>>} Result object with the employee data or an error/message.
 */
export async function getEmpleadoByIdAction(id: string): Promise<ActionResult<Empleado | null>> {
  const manager = new EmpleadoManager();
  try {
    const dataFromDB = await manager.getEmpleadoById(id);
    if (dataFromDB) {
      // Manager's getEmpleadoById already returns _id as string and password removed.
      // Serialization here mainly ensures date conversion consistency.
      return { success: true, data: serializeEmpleado(dataFromDB) };
    }
    return { success: true, data: null, message: "Empleado no encontrado." };
  } catch (error) {
    console.error("Server action getEmpleadoByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener el empleado." };
  }
}

/**
 * Server Action to update an employee.
 * @param {string} id - The MongoDB _id (as string) of the employee to update.
 * @param {Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>} empleadoUpdateData - Data to update for the employee.
 * @param {Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string }} [systemUserUpdateData] - Optional data for system user credentials.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateEmpleadoAction(
  id: string, 
  empleadoUpdateData: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>,
  systemUserUpdateData?: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string } // contraseña is optional for updates
): Promise<ActionResult<null>> {
  const manager = new EmpleadoManager();
  try {
    // Prepare system user data; only pass if there are actual updates.
    let sysUserUpdate: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>> | undefined = undefined;
    if (systemUserUpdateData && Object.keys(systemUserUpdateData).length > 0) {
        sysUserUpdate = { ...systemUserUpdateData };
        // Don't update password if it's an empty string (explicitly cleared) or undefined.
        if (sysUserUpdate.contraseña === '' || sysUserUpdate.contraseña === undefined) {
            delete sysUserUpdate.contraseña; 
        }
    }

    const success = await manager.updateEmpleado(id, empleadoUpdateData, sysUserUpdate);
    if (success) {
      return { success: true, message: 'Empleado actualizado exitosamente.' };
    } else {
      // Check if the employee exists to differentiate 'not found' from 'no changes made'.
      const exists = await manager.getEmpleadoById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Empleado no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el empleado.' };
    }
  } catch (error) {
    console.error("Server action updateEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el empleado." };
  }
}

/**
 * Server Action to delete an employee.
 * @param {string} id - The MongoDB _id (as string) of the employee to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteEmpleadoAction(id: string): Promise<ActionResult<null>> {
  const manager = new EmpleadoManager();
  try {
    const success = await manager.deleteEmpleado(id);
    if (success) {
      return { success: true, message: 'Empleado eliminado exitosamente.' };
    } else {
      // Could mean not found or other deletion failure.
      return { success: false, error: 'No se pudo eliminar el empleado o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el empleado." };
  }
}

/**
 * Server Action to remove system user access from an employee.
 * @param {string} empleadoId - The MongoDB _id (string) of the employee.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function removeSystemUserFromEmpleadoAction(empleadoId: string): Promise<ActionResult<null>> {
    const manager = new EmpleadoManager();
    try {
        const success = await manager.removeSystemUserFromEmpleado(empleadoId);
        if (success) {
            return { success: true, message: "Acceso al sistema removido exitosamente." };
        } else {
            // Could mean employee not found, or already had no user.
            return { success: false, error: "No se pudo remover el acceso al sistema." };
        }
    } catch (error) {
        console.error("Server action removeSystemUserFromEmpleadoAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al remover acceso." };
    }
}

/**
 * Options for employee-related select components.
 * Contains the _id (string ObjectId) and the name of the employee.
 */
interface EmployeeOption {
  _id: string; 
  nombre: string; 
}

/**
 * Serializes an Empleado object to the EmployeeOption format for Selects.
 * Ensures _id is a string and only name is included.
 * @param {Empleado} empleado - Empleado object (manager should already provide _id as string).
 * @returns {EmployeeOption} Object with _id and nombre.
 */
function serializeEmpleadoToEmployeeOption(empleado: Empleado): EmployeeOption {
 return {
    _id: empleado._id, // Empleado._id is already a string from the manager
    nombre: empleado.nombre
 };
}


/**
 * Server Action to get employees by a specific system role.
 * Used for populating select/dropdown components in the UI.
 * @param {UserRoleType} rol - The system role to filter by.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} Result object with an array of employee options or an error.
 */
export async function getEmpleadosByRolAction(rol: UserRoleType): Promise<ActionResult<EmployeeOption[]>> {
  const manager = new EmpleadoManager();
  try {
    const empleados = await manager.getAllEmpleados(); // Gets all employees (serialized, password removed)
    // Filter employees who have a 'user' object and their role matches.
    const filteredEmpleados = empleados
      .filter(emp => emp.user?.rol === rol)
      .map(serializeEmpleadoToEmployeeOption);
    return { success: true, data: filteredEmpleados };
  } catch (error) {
    console.error(`Server action getEmpleadosByRolAction (Rol: ${rol}) error:`, error);
    return { success: false, error: error instanceof Error ? error.message : `Error al obtener empleados por rol ${rol}.` };
  }
}

/**
 * Server Action to get employees by a specific position (puesto).
 * Used for populating select/dropdown components in the UI.
 * @param {string} puesto - The position/puesto to filter by.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} Result object with an array of employee options or an error.
 */
export async function getEmpleadosByPuestoAction(puesto: string): Promise<ActionResult<EmployeeOption[]>> {
  const manager = new EmpleadoManager();
  try {
    const empleados = await manager.getAllEmpleados(); // Gets all employees (serialized, password removed)
    const filteredEmpleados = empleados
      .filter(emp => emp.puesto === puesto)
      .map(serializeEmpleadoToEmployeeOption);
    return { success: true, data: filteredEmpleados };
  } catch (error) {
    console.error(`Server action getEmpleadosByPuestoAction (Puesto: ${puesto}) error:`, error);
    return { success: false, error: error instanceof Error ? error.message : `Error al obtener empleados por puesto ${puesto}.` };
  }
}
