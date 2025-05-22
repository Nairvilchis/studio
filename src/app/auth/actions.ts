
'use server';

import EmpleadoManager from '@/empleadoManager'; // Changed from UserManager
import type { SystemUserCredentials, UserRole } from '@/lib/types'; // UserRole is now under lib/types

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { 
    empleadoId: string; // Changed from idEmpleado to empleadoId (which is _id)
    usuario: string; 
    rol: UserRole 
  };
}

export async function loginUser(credentials: {usuario: string, contraseña: string}): Promise<LoginResult> {
  console.log("Server Action: loginUser - Intentando iniciar sesión con:", credentials.usuario);
  const empleadoManager = new EmpleadoManager(); // Changed from UserManager
  try {
    const empleado = await empleadoManager.getEmpleadoByUsername(credentials.usuario); // Changed method and manager
    
    if (empleado && empleado.user && empleado.user.contraseña === credentials.contraseña) {
      // Password check is against empleado.user.contraseña
      // En una aplicación real, aquí se verificaría una contraseña hasheada.
      console.log("Server Action: loginUser - Contraseña coincide para:", empleado.user.usuario);
      return {
        success: true,
        user: {
          empleadoId: empleado._id!.toString(), // Use empleado's MongoDB _id
          usuario: empleado.user.usuario,
          rol: empleado.user.rol 
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
