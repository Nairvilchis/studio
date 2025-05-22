
'use server';

import AseguradoraManager from '@/aseguradoraManager';
import type { Aseguradora, NewAseguradoraData, UpdateAseguradoraData, Ajustador } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Import ObjectId for validation and new creation

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

/**
 * Serializes an Aseguradora object from the database format to a client-friendly format.
 * Specifically, it ensures the MongoDB _id (ObjectId) is a hex string.
 * It also ensures that idAjustador within the ajustadores array are strings.
 * @param {any} aseguradoraFromDb - The raw aseguradora object from MongoDB.
 * @returns {Aseguradora} The serialized aseguradora object.
 */
function serializeAseguradora(aseguradoraFromDb: any): Aseguradora { 
  return {
    ...aseguradoraFromDb,
    // Ensure _id is a string. If it's already a string (from manager), it's fine.
    // If it's an ObjectId (e.g., if raw doc was fetched differently), convert it.
    _id: aseguradoraFromDb._id ? (aseguradoraFromDb._id instanceof ObjectId ? aseguradoraFromDb._id.toHexString() : aseguradoraFromDb._id) : undefined,
    ajustadores: aseguradoraFromDb.ajustadores?.map((ajustador: any) => ({ 
        ...ajustador,
        // idAjustador should already be a string (ObjectId hex string) from the manager methods.
    })) || [],
  } as Aseguradora;
}

/**
 * Serializes an array of Aseguradora objects.
 * @param {any[]} aseguradorasFromDb - Array of raw aseguradora objects from MongoDB.
 * @returns {Aseguradora[]} Array of serialized aseguradora objects.
 */
function serializeAseguradoras(aseguradorasFromDb: any[]): Aseguradora[] {
  return aseguradorasFromDb.map(serializeAseguradora);
}

/**
 * Server Action to get all aseguradoras.
 * @returns {Promise<ActionResult<Aseguradora[]>>} Result object with an array of aseguradoras or an error.
 */
export async function getAllAseguradorasAction(): Promise<ActionResult<Aseguradora[]>> {
  const manager = new AseguradoraManager();
  try {
    // The manager's getAllAseguradoras method already returns _id as string.
    const dataFromDBRaw = await manager.getAllAseguradoras(); 
    // Serialization here primarily ensures consistency if the manager's output changes.
    const dataForClient = serializeAseguradoras(dataFromDBRaw);
    return { success: true, data: dataForClient };
  } catch (error) {
    console.error("Server action getAllAseguradorasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener aseguradoras." };
  }
}

/**
 * Server Action to create a new aseguradora.
 * @param {NewAseguradoraData} data - Data for the new aseguradora (nombre, telefono, optional ajustadores).
 * @returns {Promise<ActionResult<{ aseguradoraId: string | null }>>} Result object with the new aseguradora's MongoDB _id (as string) or an error.
 */
export async function createAseguradoraAction(data: NewAseguradoraData): Promise<ActionResult<{ aseguradoraId: string | null }>> {
  const manager = new AseguradoraManager();
  try {
    // The manager's createAseguradora method returns the MongoDB ObjectId of the new document.
    const newMongoIdObject = await manager.createAseguradora(data); 
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Aseguradora creada exitosamente.',
        data: {
          aseguradoraId: newMongoIdObject.toHexString(), // Convert ObjectId to string for the client.
        }
      };
    } else {
      // This case should ideally not be reached if manager.createAseguradora throws on failure.
      return { success: false, error: 'No se pudo crear la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action createAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear la aseguradora." };
  }
}

/**
 * Server Action to get an aseguradora by its MongoDB _id (string).
 * @param {string} id - The MongoDB _id (as a hex string) of the aseguradora.
 * @returns {Promise<ActionResult<Aseguradora | null>>} Result object with the aseguradora data or an error/message.
 */
export async function getAseguradoraByIdAction(id: string): Promise<ActionResult<Aseguradora | null>> {
  const manager = new AseguradoraManager();
  try {
    // The manager's getAseguradoraById method expects a string _id and returns _id as string.
    const dataFromDBRaw = await manager.getAseguradoraById(id); 
    if (dataFromDBRaw) {
      // Ensure consistent serialization.
      return { success: true, data: serializeAseguradora(dataFromDBRaw) };
    }
    return { success: true, data: null, message: "Aseguradora no encontrada." };
  } catch (error) {
    console.error("Server action getAseguradoraByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener la aseguradora." };
  }
}

/**
 * Server Action to update an aseguradora.
 * @param {string} id - The MongoDB _id (as string) of the aseguradora to update.
 * @param {UpdateAseguradoraData} updateData - Data to update (nombre, telefono).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateAseguradoraAction(id: string, updateData: UpdateAseguradoraData): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.updateAseguradora(id, updateData);
    if (success) {
      return { success: true, message: 'Aseguradora actualizada exitosamente.' };
    } else {
      // If manager.updateAseguradora returns false, it might be due to not found or no changes.
      const exists = await manager.getAseguradoraById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Aseguradora no encontrada.'};
      // If it exists but modifiedCount was 0, it means no actual data changed.
      return { success: true, message: 'Ningún cambio detectado en la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action updateAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la aseguradora." };
  }
}

/**
 * Server Action to delete an aseguradora.
 * @param {string} id - The MongoDB _id (as string) of the aseguradora to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteAseguradoraAction(id: string): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.deleteAseguradora(id);
    if (success) {
      return { success: true, message: 'Aseguradora eliminada exitosamente.' };
    } else {
      // Could mean not found or other deletion failure.
      return { success: false, error: 'No se pudo eliminar la aseguradora o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar la aseguradora." };
  }
}

// --- Ajustador Actions ---

/**
 * Server Action to add an ajustador to an aseguradora.
 * The `idAjustador` is generated by the manager and returned.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the parent aseguradora.
 * @param {Omit<Ajustador, 'idAjustador'>} ajustadorData - Data for the new ajustador (nombre, telefono, correo).
 * @returns {Promise<ActionResult<Ajustador>>} Result object with the new ajustador (including its generated `idAjustador`) or an error.
 */
export async function addAjustadorToAseguradoraAction(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<ActionResult<Ajustador>> {
    const manager = new AseguradoraManager();
    try {
        // Basic validation for ajustador name.
        if (!ajustadorData.nombre?.trim()) {
            return { success: false, error: "Nombre del ajustador es requerido."};
        }
        // The manager's method handles ObjectId generation for idAjustador.
        const newAjustador = await manager.addAjustadorToAseguradora(aseguradoraId, ajustadorData);
        if (newAjustador) {
            // newAjustador already has idAjustador as a string (ObjectId hex string).
            return { success: true, message: "Ajustador añadido exitosamente.", data: newAjustador };
        } else {
            return { success: false, error: "No se pudo añadir el ajustador." };
        }
    } catch (error) {
        console.error("Server action addAjustadorToAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al añadir ajustador."};
    }
}

/**
 * Server Action to update an ajustador within an aseguradora.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the parent aseguradora.
 * @param {string} idAjustador - The ObjectId string of the ajustador to update.
 * @param {Partial<Omit<Ajustador, 'idAjustador'>>} ajustadorUpdateData - Data to update (nombre, telefono, correo).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateAjustadorInAseguradoraAction(aseguradoraId: string, idAjustador: string, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        // Basic validation for ajustador name if provided.
        if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre?.trim()) {
             return { success: false, error: "El nombre del ajustador no puede estar vacío."};
        }
        const success = await manager.updateAjustadorInAseguradora(aseguradoraId, idAjustador, ajustadorUpdateData);
        if (success) {
            return { success: true, message: "Ajustador actualizado exitosamente." };
        } else {
            // Could mean ajustador/aseguradora not found, or no actual change.
            return { success: false, error: "No se pudo actualizar el ajustador o no se encontró/modificó." };
        }
    } catch (error) {
        console.error("Server action updateAjustadorInAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar ajustador."};
    }
}

/**
 * Server Action to remove an ajustador from an aseguradora.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the parent aseguradora.
 * @param {string} idAjustador - The ObjectId string of the ajustador to remove.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function removeAjustadorFromAseguradoraAction(aseguradoraId: string, idAjustador: string): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        const success = await manager.removeAjustadorFromAseguradora(aseguradoraId, idAjustador);
        if (success) {
            return { success: true, message: "Ajustador eliminado exitosamente." };
        } else {
            return { success: false, error: "No se pudo eliminar el ajustador o no se encontró." };
        }
    } catch (error) {
        console.error("Server action removeAjustadorFromAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar ajustador."};
    }
}

/**
 * Server Action to get ajustadores for a specific aseguradora, returning only idAjustador and nombre.
 * Used for populating select/dropdown components in the UI.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the aseguradora.
 * @returns {Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>>} Result object with an array of ajustadores (idAjustador, nombre) or an error.
 */
export async function getAjustadoresByAseguradora(aseguradoraId: string): Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>> {
 const manager = new AseguradoraManager();
 try {
 if (!aseguradoraId) {
 return { success: false, error: "Se requiere el ID de la aseguradora." };
 }
 // The manager's method returns the Aseguradora object with _id as string and ajustadores with idAjustador as string.
 const aseguradora = await manager.getAseguradoraById(aseguradoraId); 
 if (aseguradora && aseguradora.ajustadores) {
 // Map to the desired structure for the select component.
 return { success: true, data: aseguradora.ajustadores.map(adj => ({ idAjustador: adj.idAjustador, nombre: adj.nombre })) };
 }
 return { success: true, data: [], message: "Aseguradora no encontrada o sin ajustadores." };
 } catch (error) {
 console.error("Server action getAjustadoresByAseguradora error:", error);
 return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener ajustadores." };
 }
}

