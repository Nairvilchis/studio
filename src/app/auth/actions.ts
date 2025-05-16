
'use server';

import UserManager from '@/userManager';
import type { User } from '@/userManager'; // Import User type

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { usuario: string, idEmpleado: number, rol: User['rol'] }; // Return relevant, non-sensitive info
}

export async function loginUser(credentials: {usuario: string, contraseña: string}): Promise<LoginResult> {
  const userManager = new UserManager();
  try {
    // Fetch user by 'usuario' (new field name for username)
    const user = await userManager.getUserByUsername(credentials.usuario);

    // Compare 'contraseña' (new field name for password)
    // IMPORTANT: This is plain text comparison. NOT SECURE FOR PRODUCTION! Implement password hashing.
    if (user && user.contraseña === credentials.contraseña) { 
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
