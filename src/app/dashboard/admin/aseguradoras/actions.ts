
'use server';

import AseguradoraManager from '@/aseguradoraManager';
import type { Aseguradora, NewAseguradoraData, UpdateAseguradoraData, Ajustador } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Import ObjectId for validation and new creation

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Serializes an Aseguradora object from the database format to a client-friendly format.
 * Specifically, it converts the MongoDB _id (ObjectId) to a hex string.
 * @param {any} aseguradoraFromDb - The raw aseguradora object from MongoDB.
 * @returns {Aseguradora} The serialized aseguradora object.
 */
function serializeAseguradora(aseguradoraFromDb: any): Aseguradora { 
  return {
    ...aseguradoraFromDb,
    _id: aseguradoraFromDb._id ? (aseguradoraFromDb._id instanceof ObjectId ? aseguradoraFromDb._id.toHexString() : aseguradoraFromDb._id) : undefined,
    ajustadores: aseguradoraFromDb.ajustadores?.map((ajustador: any) => ({ 
        ...ajustador,
        // idAjustador is already a string (ObjectId hex string) from the manager
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
 * @returns {Promise<ActionResult<Aseguradora[]>>} Result object with data or error.
 */
export async function getAllAseguradorasAction(): Promise<ActionResult<Aseguradora[]>> {
  const manager = new AseguradoraManager();
  try {
    const dataFromDBRaw = await manager.getAllAseguradoras(); 
    // Manager already returns _id as string, so direct serialization is fine
    const dataForClient = serializeAseguradoras(dataFromDBRaw);
    return { success: true, data: dataForClient };
  } catch (error) {
    console.error("Server action getAllAseguradorasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener aseguradoras." };
  }
}

/**
 * Server Action to create a new aseguradora.
 * @param {NewAseguradoraData} data - Data for the new aseguradora.
 * @returns {Promise<ActionResult<{ aseguradoraId: string | null }>>} Result object with the new aseguradora's _id or error.
 */
export async function createAseguradoraAction(data: NewAseguradoraData): Promise<ActionResult<{ aseguradoraId: string | null }>> {
  const manager = new AseguradoraManager();
  try {
    const newMongoIdObject = await manager.createAseguradora(data); 
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Aseguradora creada exitosamente.',
        data: {
          aseguradoraId: newMongoIdObject.toHexString(), 
        }
      };
    } else {
      return { success: false, error: 'No se pudo crear la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action createAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear la aseguradora." };
  }
}

/**
 * Server Action to get an aseguradora by its MongoDB _id.
 * @param {string} id - The MongoDB _id of the aseguradora.
 * @returns {Promise<ActionResult<Aseguradora | null>>} Result object with data or error.
 */
export async function getAseguradoraByIdAction(id: string): Promise<ActionResult<Aseguradora | null>> {
  const manager = new AseguradoraManager();
  try {
    const dataFromDBRaw = await manager.getAseguradoraById(id); 
    if (dataFromDBRaw) {
      // Manager already returns _id as string
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
 * @param {string} id - The MongoDB _id of the aseguradora to update.
 * @param {UpdateAseguradoraData} updateData - Data to update.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateAseguradoraAction(id: string, updateData: UpdateAseguradoraData): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.updateAseguradora(id, updateData);
    if (success) {
      return { success: true, message: 'Aseguradora actualizada exitosamente.' };
    } else {
      const exists = await manager.getAseguradoraById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Aseguradora no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action updateAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la aseguradora." };
  }
}

/**
 * Server Action to delete an aseguradora.
 * @param {string} id - The MongoDB _id of the aseguradora to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteAseguradoraAction(id: string): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.deleteAseguradora(id);
    if (success) {
      return { success: true, message: 'Aseguradora eliminada exitosamente.' };
    } else {
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
 * @param {string} aseguradoraId - The MongoDB _id of the parent aseguradora.
 * @param {Omit<Ajustador, 'idAjustador'>} ajustadorData - Data for the new ajustador.
 * @returns {Promise<ActionResult<Ajustador>>} Result object with the new ajustador (including its generated idAjustador) or error.
 */
export async function addAjustadorToAseguradoraAction(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<ActionResult<Ajustador>> {
    const manager = new AseguradoraManager();
    try {
        if (!ajustadorData.nombre?.trim()) {
            return { success: false, error: "Nombre del ajustador es requerido."};
        }
        const newAjustador = await manager.addAjustadorToAseguradora(aseguradoraId, ajustadorData);
        if (newAjustador) {
            // newAjustador already has idAjustador as a string ObjectId
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
 * @param {string} aseguradoraId - The MongoDB _id of the parent aseguradora.
 * @param {string} idAjustador - The ObjectId string of the ajustador to update.
 * @param {Partial<Omit<Ajustador, 'idAjustador'>>} ajustadorUpdateData - Data to update.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateAjustadorInAseguradoraAction(aseguradoraId: string, idAjustador: string, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre?.trim()) {
             return { success: false, error: "El nombre del ajustador no puede estar vacío."};
        }
        const success = await manager.updateAjustadorInAseguradora(aseguradoraId, idAjustador, ajustadorUpdateData);
        if (success) {
            return { success: true, message: "Ajustador actualizado exitosamente." };
        } else {
            // Consider if the ajustador or aseguradora was not found
            return { success: false, error: "No se pudo actualizar el ajustador o no se encontró." };
        }
    } catch (error) {
        console.error("Server action updateAjustadorInAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar ajustador."};
    }
}

/**
 * Server Action to remove an ajustador from an aseguradora.
 * @param {string} aseguradoraId - The MongoDB _id of the parent aseguradora.
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
 * @param {string} aseguradoraId - The MongoDB _id of the aseguradora.
 * @returns {Promise<ActionResult<Partial<Ajustador>[]>>} Result object with an array of ajustadores (idAjustador, nombre) or error.
 */
export async function getAjustadoresByAseguradora(aseguradoraId: string): Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>> {
 const manager = new AseguradoraManager();
 try {
 if (!aseguradoraId) {
 return { success: false, error: "Se requiere el ID de la aseguradora." };
 }
 const aseguradora = await manager.getAseguradoraById(aseguradoraId); // This now returns Aseguradora with _id as string
 if (aseguradora && aseguradora.ajustadores) {
 // idAjustador is already a string ObjectId here
 return { success: true, data: aseguradora.ajustadores.map(adj => ({ idAjustador: adj.idAjustador, nombre: adj.nombre })) };
 }
 return { success: true, data: [], message: "Aseguradora no encontrada o sin ajustadores." };
 } catch (error) {
 console.error("Server action getAjustadoresByAseguradora error:", error);
 return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener ajustadores." };
 }
}
