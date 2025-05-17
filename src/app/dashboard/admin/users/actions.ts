
'use server';

import UserManager, { type User, type UserRole } from '@/userManager'; // Adjusted import to include UserRole
import type { ObjectId } // Added ObjectId for type checking
from 'mongodb';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize ObjectId to string and handle potential undefined _id
function serializeUser(user: User): User {
  return {
    ...user,
    _id: user._id ? (user._id as ObjectId).toHexString() as any : undefined,
    // Ensure contraseña is not sent to client unless explicitly needed and handled
    // For list views, it's better to omit it. For edit forms, it might be needed if changing.
  };
}

function serializeUsers(users: User[]): User[] {
  return users.map(serializeUser);
}


export async function getAllUsersAction(): Promise<ActionResult<User[]>> {
  const manager = new UserManager();
  try {
    const dataFromDB = await manager.getAllUsers();
    // Exclude password from the list sent to the client
    const users = serializeUsers(dataFromDB.map(u => {
      const { contraseña, ...userWithoutPassword } = u;
      return userWithoutPassword as User;
    }));
    return { success: true, data: users };
  } catch (error) {
    console.error("Server action getAllUsersAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener usuarios." };
  }
}

export async function createUserAction(userData: Pick<User, 'idEmpleado' | 'usuario' | 'contraseña' | 'rol'>): Promise<ActionResult<{ userId: string | null }>> {
  const manager = new UserManager();
  try {
    const newMongoId = await manager.createUser(userData);
    if (newMongoId) {
      return {
        success: true,
        message: 'Usuario creado exitosamente.',
        data: { userId: newMongoId.toHexString() }
      };
    } else {
      return { success: false, error: 'No se pudo crear el usuario.' };
    }
  } catch (error) {
    console.error("Server action createUserAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear usuario." };
  }
}

export async function getUserByIdAction(id: string): Promise<ActionResult<User | null>> {
  const manager = new UserManager();
  try {
    const dataFromDB = await manager.getUserById(id);
    if (dataFromDB) {
      // For editing, we might send the user object as is, or omit password depending on edit logic
      // For now, sending without password to avoid accidental exposure
      const { contraseña, ...userWithoutPassword } = serializeUser(dataFromDB);
      return { success: true, data: userWithoutPassword as User };
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
    // Ensure idEmpleado and main 'usuario' (username) are not part of the general update here if they are meant to be immutable or have special update logic.
    // Password should only be updated if a new one is provided.
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.contraseña === '' || dataToUpdate.contraseña === undefined) {
      delete dataToUpdate.contraseña; // Don't update password if it's empty
    }

    const success = await manager.updateUser(id, dataToUpdate);
    if (success) {
      return { success: true, message: 'Usuario actualizado exitosamente.' };
    } else {
      const exists = await manager.getUserById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Usuario no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el usuario.' };
    }
  } catch (error) {
    console.error("Server action updateUserAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el usuario." };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult<null>> {
  const manager = new UserManager();
  try {
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
