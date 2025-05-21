
'use server';

import UserManager from '@/userManager';
import type { User, UserRole } from '@/lib/types'; // Import from new types file

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { usuario: string, idEmpleado: string, rol: UserRole };
}

export async function loginUser(credentials: {usuario: string, contraseña: string}): Promise<LoginResult> {
  console.log("Server Action: loginUser - Intentando iniciar sesión con:", credentials.usuario);
  const userManager = new UserManager();
  try {
    const user = await userManager.getUserByUsername(credentials.usuario);
    console.log("Server Action: loginUser - Usuario encontrado en DB:", user ? `{ usuario: '${user.usuario}', idEmpleado: ${user.idEmpleado}, rol: '${user.rol}' }` : 'No encontrado');

    if (user && user.contraseña === credentials.contraseña) { 
      console.log("Server Action: loginUser - Contraseña coincide para:", user.usuario);
      // En una aplicación real, aquí se verificaría una contraseña hasheada.
      return {
        success: true,
        user: {
          usuario: user.usuario,
          idEmpleado: user.idEmpleado,
          rol: user.rol 
        }
      };
    } else {
      console.log("Server Action: loginUser - Usuario no encontrado o contraseña incorrecta para:", credentials.usuario);
      return { success: false, message: "Usuario o contraseña incorrectos." };
    }
  } catch (error) {
    console.error("Server action login error:", error);
    return { success: false, message: "Error del sistema al intentar iniciar sesión." };
  }
}
