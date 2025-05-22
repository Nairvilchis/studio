
'use server';

import EmpleadoManager from '@/empleadoManager';
import type { Empleado, SystemUserCredentials, UserRole } from '@/lib/types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize _id to string and remove password from user object
function serializeEmpleado(empleadoFromDb: any): Empleado {
  const serialized = {
    ...empleadoFromDb,
    _id: empleadoFromDb._id ? empleadoFromDb._id.toHexString() : undefined,
  };
  if (serialized.user && serialized.user.contraseña) {
    delete serialized.user.contraseña;
  }
  if (serialized.fechaRegistro && typeof serialized.fechaRegistro === 'string') {
    serialized.fechaRegistro = new Date(serialized.fechaRegistro);
  }
  if (serialized.fechaBaja && typeof serialized.fechaBaja === 'string') {
    serialized.fechaBaja = new Date(serialized.fechaBaja);
  }
  return serialized as Empleado;
}

function serializeEmpleados(empleadosFromDb: any[]): Empleado[] {
  return empleadosFromDb.map(serializeEmpleado);
}

export async function getAllEmpleadosAction(): Promise<ActionResult<Empleado[]>> {
  const manager = new EmpleadoManager();
  try {
    const dataFromDB = await manager.getAllEmpleados();
    return { success: true, data: serializeEmpleados(dataFromDB) };
  } catch (error) {
    console.error("Server action getAllEmpleadosAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener empleados." };
  }
}

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
        data: { empleadoId: newMongoIdObject.toHexString() }
      };
    } else {
      return { success: false, error: 'No se pudo crear el empleado.' };
    }
  } catch (error) {
    console.error("Server action createEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear empleado." };
  }
}

export async function getEmpleadoByIdAction(id: string): Promise<ActionResult<Empleado | null>> {
  const manager = new EmpleadoManager();
  try {
    const dataFromDB = await manager.getEmpleadoById(id);
    if (dataFromDB) {
      return { success: true, data: serializeEmpleado(dataFromDB) };
    }
    return { success: true, data: null, message: "Empleado no encontrado." };
  } catch (error) {
    console.error("Server action getEmpleadoByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener el empleado." };
  }
}

export async function updateEmpleadoAction(
  id: string, 
  empleadoUpdateData: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>>,
  systemUserUpdateData?: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string } // contraseña is optional
): Promise<ActionResult<null>> {
  const manager = new EmpleadoManager();
  try {
    // Prepare system user data, only pass if there are actual updates
    let sysUserUpdate: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>> | undefined = undefined;
    if (systemUserUpdateData && Object.keys(systemUserUpdateData).length > 0) {
        sysUserUpdate = { ...systemUserUpdateData };
        if (sysUserUpdate.contraseña === '' || sysUserUpdate.contraseña === undefined) {
            delete sysUserUpdate.contraseña; // Don't update password if empty
        }
    }

    const success = await manager.updateEmpleado(id, empleadoUpdateData, sysUserUpdate);
    if (success) {
      return { success: true, message: 'Empleado actualizado exitosamente.' };
    } else {
      const exists = await manager.getEmpleadoById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Empleado no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el empleado.' };
    }
  } catch (error) {
    console.error("Server action updateEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el empleado." };
  }
}

export async function deleteEmpleadoAction(id: string): Promise<ActionResult<null>> {
  const manager = new EmpleadoManager();
  try {
    const success = await manager.deleteEmpleado(id);
    if (success) {
      return { success: true, message: 'Empleado eliminado exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar el empleado o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteEmpleadoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el empleado." };
  }
}

export async function removeSystemUserFromEmpleadoAction(empleadoId: string): Promise<ActionResult<null>> {
    const manager = new EmpleadoManager();
    try {
        const success = await manager.removeSystemUserFromEmpleado(empleadoId);
        if (success) {
            return { success: true, message: "Acceso al sistema removido exitosamente." };
        } else {
            return { success: false, error: "No se pudo remover el acceso al sistema." };
        }
    } catch (error) {
        console.error("Server action removeSystemUserFromEmpleadoAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido." };
    }
}
