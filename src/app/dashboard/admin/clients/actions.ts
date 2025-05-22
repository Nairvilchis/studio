
'use server';

import ClienteManager from '@/clienteManager'; // Import the new ClienteManager
import type { Cliente, NewClienteData } from '@/lib/types';

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

// Helper to serialize _id to string - ClienteManager already returns _id as string
// function serializeCliente(clienteFromDb: any): Cliente {
//   return {
//     ...clienteFromDb,
//     _id: clienteFromDb._id ? clienteFromDb._id.toHexString() : undefined,
//   } as Cliente;
// }

// function serializeClientes(clientesFromDb: any[]): Cliente[] {
//   return clientesFromDb.map(serializeCliente);
// }

/**
 * Server Action to get all clients.
 * @returns {Promise<ActionResult<Cliente[]>>} Result object with an array of clients or an error.
 */
export async function getAllClientsAction(): Promise<ActionResult<Cliente[]>> {
  const manager = new ClienteManager();
  console.log('Server Action: getAllClientsAction - Fetching clients from database.');
  try {
    // ClienteManager.getAllClientes() already returns clients with _id as string.
    const clientsFromDB = await manager.getAllClientes();
    return { success: true, data: clientsFromDB };
  } catch (error) {
    console.error('Server action getAllClientsAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients.';
    return { success: false, error: errorMessage, data: [] };
  }
}

/**
 * Server Action to create a new client.
 * @param {NewClienteData} data - Data for the new client (nombre, telefono, correo, rfc).
 * @returns {Promise<ActionResult<{ clienteId: string | null, nuevoCliente?: Cliente }>>} Result object with the new client's MongoDB _id (as string) and the client object, or an error.
 */
export async function createClienteAction(data: NewClienteData): Promise<ActionResult<{ clienteId: string | null, nuevoCliente?: Cliente }>> {
  const manager = new ClienteManager();
  try {
    // The manager's createCliente method returns the MongoDB ObjectId of the new document.
    const newMongoIdObject = await manager.createCliente(data); 
    if (newMongoIdObject) {
      // Fetch the newly created client to return it, ensuring _id is a string.
      const nuevoCliente = await manager.getClienteById(newMongoIdObject.toHexString());
      return {
        success: true,
        message: 'Cliente creado exitosamente.',
        data: {
          clienteId: newMongoIdObject.toHexString(), // Convert ObjectId to string for the client.
          nuevoCliente: nuevoCliente || undefined // Send back the created client object
        }
      };
    } else {
      // This case should ideally not be reached if manager.createCliente throws on failure.
      return { success: false, error: 'No se pudo crear el cliente.' };
    }
  } catch (error) {
    console.error("Server action createClienteAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear el cliente." };
  }
}

// Puedes añadir otras acciones aquí en el futuro, como updateCliente, deleteCliente, etc.

    