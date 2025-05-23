
'use server';
/**
 * @fileOverview Server Actions para la gestión de Clientes.
 * Interactúan con ClienteManager para realizar operaciones CRUD.
 * Manejan la serialización de datos para el cliente (ej. _id de ObjectId a string).
 */
import ClienteManager from '@/clienteManager'; // Importar el ClienteManager
import type { Cliente, NewClienteData, UpdateClienteData } from '@/lib/types'; // Tipos relevantes

/**
 * Interfaz para el resultado de las acciones del servidor.
 * @template T El tipo de datos devueltos en caso de éxito.
 */
interface ActionResult<T> {
  success: boolean; // Indica si la acción fue exitosa.
  data?: T; // Datos devueltos por la acción en caso de éxito.
  error?: string; // Mensaje de error si la acción falló.
  message?: string; // Mensaje opcional de éxito o informativo.
}

/**
 * Server Action para obtener todos los clientes.
 * @returns {Promise<ActionResult<Cliente[]>>} Objeto de resultado con un array de clientes o un error.
 * @example const { data } = await getAllClientsAction();
 */
export async function getAllClientsAction(): Promise<ActionResult<Cliente[]>> {
  const manager = new ClienteManager();
  console.log('Server Action: getAllClientsAction - Obteniendo clientes de la base de datos.');
  try {
    // ClienteManager.getAllClientes() ya devuelve clientes con _id como string.
    const clientsFromDB = await manager.getAllClientes();
    return { success: true, data: clientsFromDB };
  } catch (error) {
    console.error('Server action getAllClientsAction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Fallo al obtener clientes.';
    return { success: false, error: errorMessage, data: [] };
  }
}

/**
 * Server Action para crear un nuevo cliente.
 * @param {NewClienteData} data - Datos para el nuevo cliente (nombre, telefono, correo, rfc).
 * @returns {Promise<ActionResult<{ clienteId: string | null, nuevoCliente?: Cliente }>>} Objeto de resultado con el `_id` (string) del nuevo cliente y el objeto cliente, o un error.
 */
export async function createClienteAction(data: NewClienteData): Promise<ActionResult<{ clienteId: string | null, nuevoCliente?: Cliente }>> {
  const manager = new ClienteManager();
  try {
    // El método createCliente del manager devuelve el _id (string) del nuevo documento.
    const newClienteIdString = await manager.createCliente(data); 
    if (newClienteIdString) {
      // Obtener el cliente recién creado para devolverlo, asegurando que _id es string.
      const nuevoCliente = await manager.getClienteById(newClienteIdString);
      return {
        success: true,
        message: 'Cliente creado exitosamente.',
        data: {
          clienteId: newClienteIdString, // _id ya es string desde el manager.
          nuevoCliente: nuevoCliente || undefined // Devolver el objeto cliente creado
        }
      };
    } else {
      // Este caso idealmente no se alcanza si manager.createCliente lanza error en fallo.
      return { success: false, error: 'No se pudo crear el cliente.' };
    }
  } catch (error) {
    console.error("Server action createClienteAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear el cliente." };
  }
}

/**
 * Server Action para obtener un cliente por su `_id`.
 * @param {string} id - El `_id` (string ObjectId) del cliente.
 * @returns {Promise<ActionResult<Cliente | null>>} Objeto de resultado con los datos del cliente o un error.
 */
export async function getClienteByIdAction(id: string): Promise<ActionResult<Cliente | null>> {
  const manager = new ClienteManager();
  try {
    const cliente = await manager.getClienteById(id); // Manager devuelve _id como string
    if (cliente) {
      return { success: true, data: cliente };
    }
    return { success: true, data: null, message: "Cliente no encontrado." };
  } catch (error) {
    console.error("Server action getClienteByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener el cliente." };
  }
}

/**
 * Server Action para actualizar un cliente existente.
 * @param {string} id - El `_id` (string ObjectId) del cliente a actualizar.
 * @param {UpdateClienteData} updateData - Los datos a actualizar.
 * @returns {Promise<ActionResult<null>>} Objeto de resultado indicando éxito o error.
 */
export async function updateClienteAction(id: string, updateData: UpdateClienteData): Promise<ActionResult<null>> {
  const manager = new ClienteManager();
  try {
    const success = await manager.updateCliente(id, updateData);
    if (success) {
      return { success: true, message: 'Cliente actualizado exitosamente.' };
    } else {
      // Verificar si no se encontró o no hubo cambios.
      const exists = await manager.getClienteById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Cliente no encontrado.' };
      return { success: true, message: 'Ningún cambio detectado en el cliente.' };
    }
  } catch (error) {
    console.error("Server action updateClienteAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el cliente." };
  }
}

/**
 * Server Action para eliminar un cliente.
 * @param {string} id - El `_id` (string ObjectId) del cliente a eliminar.
 * @returns {Promise<ActionResult<null>>} Objeto de resultado indicando éxito o error.
 */
export async function deleteClienteAction(id: string): Promise<ActionResult<null>> {
  const manager = new ClienteManager();
  try {
    const success = await manager.deleteCliente(id);
    if (success) {
      return { success: true, message: 'Cliente eliminado exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar el cliente o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteClienteAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el cliente." };
  }
}
