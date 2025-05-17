
'use server';

import UserManager from '@/userManager';
import type { User, UserRole } from '@/lib/types'; // Import from new types file
// No longer need to import ObjectId from mongodb here if types are string-based for client

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize _id to string if it was an ObjectId from DB
// The User type from lib/types already expects _id as string | undefined
function serializeUser(userFromDb: any): User { // userFromDb is the raw doc from Mongo
  const { contraseña, ...userWithoutPassword } = userFromDb;
  return {
    ...userWithoutPassword,
    _id: userFromDb._id ? userFromDb._id.toHexString() : undefined,
  } as User;
}

function serializeUsers(usersFromDb: any[]): User[] {
  return usersFromDb.map(u => {
    const { contraseña, ...userWithoutPassword } = u;
    return {
        ...userWithoutPassword,
        _id: u._id ? u._id.toHexString() : undefined,
    } as User;
  });
}


export async function getAllUsersAction(): Promise<ActionResult<User[]>> {
  const manager = new UserManager();
  try {
    const dataFromDB = await manager.getAllUsers(); // This returns User[] with ObjectId from DB
    // Strip password before sending to client
    const usersForClient = dataFromDB.map(u => {
        const { contraseña, ...userWithoutPassword } = u;
        return {
            ...userWithoutPassword,
            _id: u._id ? u._id.toHexString() : undefined, // Ensure _id is string
        };
    });
    return { success: true, data: usersForClient as User[] };
  } catch (error) {
    console.error("Server action getAllUsersAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener usuarios." };
  }
}

export async function createUserAction(userData: Pick<User, 'idEmpleado' | 'usuario' | 'contraseña' | 'rol'>): Promise<ActionResult<{ userId: string | null }>> {
  const manager = new UserManager();
  try {
    const newMongoIdObject = await manager.createUser(userData); // Returns ObjectId
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Usuario creado exitosamente.',
        data: { userId: newMongoIdObject.toHexString() } // Convert to string for client
      };
    } else {
      return { success: false, error: 'No se pudo crear el usuario (createUser retornó null).' };
    }
  } catch (error) {
    console.error("Server action createUserAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear usuario." };
  }
}

export async function getUserByIdAction(id: string): Promise<ActionResult<User | null>> {
  const manager = new UserManager();
  try {
    const dataFromDB = await manager.getUserById(id); // `id` is string, manager converts to ObjectId
    if (dataFromDB) {
      const { contraseña, ...userWithoutPassword } = dataFromDB;
      return { 
        success: true, 
        data: {
            ...userWithoutPassword,
            _id: dataFromDB._id ? dataFromDB._id.toHexString() : undefined,
        } as User
      };
    }
    return { success: true, data: null, message: "Usuario no encontrado." };
  } catch (error) {
    console.error("Server action getUserByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener el usuario." };
  }
}

export async function updateUserAction(id: string, updateData: Partial<Pick<User, 'usuario' | 'contraseña' | 'rol' | 'permisos' | 'workstation'>>): Promise<ActionResult<null>> {
  const manager = new UserManager();
  try {
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.contraseña === '' || dataToUpdate.contraseña === undefined) {
      delete dataToUpdate.contraseña;
    }

    // `id` is string, manager.updateUser expects string and handles ObjectId conversion
    const success = await manager.updateUser(id, dataToUpdate);
    if (success) {
      return { success: true, message: 'Usuario actualizado exitosamente.' };
    } else {
      const exists = await manager.getUserById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Usuario no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el usuario.' }; // Or specific message if needed
    }
  } catch (error) {
    console.error("Server action updateUserAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el usuario." };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult<null>> {
  const manager = new UserManager();
  try {
    // `id` is string, manager.deleteUser expects string and handles ObjectId conversion
    const success = await manager.deleteUser(id);
    if (success) {
      return { success: true, message: 'Usuario eliminado exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar el usuario o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteUserAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el usuario." };
  }
}
