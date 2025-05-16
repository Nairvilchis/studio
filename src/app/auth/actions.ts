
'use server';

import UserManager from '@/userManager';
// La interfaz User ya está exportada desde userManager.ts, así que no necesitamos importarla explícitamente aquí
// si solo la usamos internamente o si UserManager la devuelve tipada.
// Si la necesitáramos explícitamente para tipos de retorno o parámetros aquí, sería:
// import type { User } from '@/userManager'; 

interface LoginResult {
  success: boolean;
  message?: string;
  user?: { username: string }; // Solo enviar información necesaria y no sensible al cliente
}

export async function loginUser(credentials: {username: string, password: string}): Promise<LoginResult> {
  const userManager = new UserManager();
  try {
    const user = await userManager.getUserByUsername(credentials.username);

    if (user && user.password === credentials.password) { // Comparación de texto plano. ¡NO SEGURO PARA PRODUCCIÓN!
      return { success: true, user: { username: user.username } };
    } else {
      return { success: false, message: "Usuario o contraseña incorrectos." };
    }
  } catch (error) {
    // Es buena práctica registrar el error real en el servidor
    console.error("Server action login error:", error);
    // Pero devolver un mensaje genérico al cliente
    return { success: false, message: "Error del sistema al intentar iniciar sesión." };
  }
}
