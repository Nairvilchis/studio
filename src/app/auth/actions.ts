
'use server';

import UserManager from '@/userManager';
import type { User, UserRole } from '@/userManager'; // Import User type

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { usuario: string, idEmpleado: number, rol: UserRole }; // Devolver rol
}

export async function loginUser(credentials: {usuario: string, contraseña: string}): Promise<LoginResult> {
  const userManager = new UserManager();
  try {
    const user = await userManager.getUserByUsername(credentials.usuario);

    if (user && user.contraseña === credentials.contraseña) { // ¡IMPORTANTE: Comparación en texto plano!
      return {
        success: true,
        user: {
          usuario: user.usuario,
          idEmpleado: user.idEmpleado,
          rol: user.rol
        }
      };
    } else {
      return { success: false, message: "Usuario o contraseña incorrectos." };
    }
  } catch (error) {
    console.error("Server action login error:", error);
    return { success: false, message: "Error del sistema al intentar iniciar sesión." };
  }
}
