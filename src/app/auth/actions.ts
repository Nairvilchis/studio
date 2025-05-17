
'use server';

import UserManager from '@/userManager';
import type { User, UserRole } from '@/lib/types'; // Import from new types file

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { usuario: string, idEmpleado: number, rol: UserRole }; 
}

export async function loginUser(credentials: {usuario: string, contraseña: string}): Promise<LoginResult> {
  const userManager = new UserManager();
  try {
    const user = await userManager.getUserByUsername(credentials.usuario);

    if (user && user.contraseña === credentials.contraseña) { 
      // En una aplicación real, aquí se verificaría una contraseña hasheada.
      // Por ejemplo: const passwordMatch = await bcrypt.compare(credentials.contraseña, user.contraseña);
      // if (user && passwordMatch) { ... }
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
